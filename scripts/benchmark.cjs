#!/usr/bin/env node

/**
 * Usage:
 *    node benchmark.js /path/to/headless_three /path/to/model_directory [useWebIfc]
 *
 * Environment variables:
 *    EXCLUDE_FILENAMES   list of file names to skip, e.g. 'foo.ifc bar.ifc'
 *
 * This script:
 *    - Spawns a server using "yarn serve" or "yarn serve-webifc".
 *    - Iterates over all IFC files in modelDir/ifc, skipping any in EXCLUDE_FILENAMES.
 *    - Renders each IFC, collects performance stats, and writes them to CSV.
 *    - If old performance data is found, calls a Python script to generate a delta CSV.
 */

const { spawn, execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');
const urlModule = require('url');
const { generateDeltaCSV } = require('./gen_delta_csv.cjs');

// ---------- UTILITIES ----------

// Simple usage / help
function usageAndExit() {
  console.error(`Usage: node benchmark.js /path/to/headless_three /path/to/model_directory [useWebIfc]
  
    EXCLUDE_FILENAMES    (env var) list of file names to filter for exclusion, e.g. 'foo.ifc bar.ifc'. Optional
  `);
  process.exit(1);
}

// URL-encode a file name
function encodeFileName(filename) {
  return encodeURIComponent(filename);
}

/**
 * Perform a POST request with JSON body, save response to file (binary).
 * @param {string} url Endpoint to POST to.
 * @param {Object} body JSON object for the POST body.
 * @param {string} outputPath Path to save the response as a file (PNG).
 * @param {number} timeoutSeconds Max time in seconds before giving up.
 * @returns {Promise<boolean>} true if success, false if error.
 */
function postToServerAndSaveFile(url, body, outputPath, timeoutSeconds = 180) {
  return new Promise((resolve) => {
    const data = JSON.stringify(body);
    const parsedUrl = new urlModule.URL(url);

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
      timeout: timeoutSeconds * 1000, // in ms
    };

    const req = http.request(options, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        // Non-2xx => fail
        res.resume(); // Consume response data to free up memory
        return resolve(false);
      }

      // Pipe the response to the file
      const fileStream = fs.createWriteStream(outputPath);
      res.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close(() => {
          resolve(true);
        });
      });
    });

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy(new Error('Request timed out'));
      resolve(false);
    });

    // Write body and finalize request
    req.write(data);
    req.end();
  });
}

/**
 * Sleep for N seconds. 
 * @param {number} sec 
 * @returns {Promise<void>}
 */
function sleep(sec) {
  return new Promise((resolve) => setTimeout(resolve, sec * 1000));
}

// ---------- MAIN ----------

async function main() {
  // Process arguments
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Error: Missing required arguments.");
    usageAndExit();
  }

  const [serverDir, modelDir, thirdArg] = args;
  if (!serverDir) {
    console.error("Error: No server directory path provided.");
    usageAndExit();
  }
  if (!modelDir) {
    console.error("Error: No model directory path provided.");
    usageAndExit();
  }

  // Determine engine usage
  let isEngineConway = true;
  let engineSuffix = "";
  if (thirdArg) {
    if (thirdArg !== "useWebIfc") {
      console.error("Error: unknown engine command (to use conway leave blank or pass 'useWebIfc').");
      usageAndExit();
    }
    isEngineConway = false;
    engineSuffix = "-webifc";
  }

  // We retrieve EXCLUDE_FILENAMES from environment
  const excludeFilenamesEnv = process.env.EXCLUDE_FILENAMES || "";
  // Convert to a set for easy membership checks
  // split on whitespace
  const excludeSet = new Set(excludeFilenamesEnv.split(/\s+/).filter(Boolean));

  // Some path definitions
  const scriptDir = process.cwd();
  const currentDate = new Date()
    .toISOString()
    .replace(/[-:T]/g, '')
    .split('.')[0]; // e.g. 20230101_123456

  // Determine engine version
  let engineVersion = "";
  if (isEngineConway) {
    // We'll parse `yarn list --pattern @bldrs-ai/conway`
    // (Redirect errors to stdout so we can parse them)
    try {
      const yarnListOutput = execSync(
        `yarn list --pattern @bldrs-ai/conway --json`,
        { cwd: serverDir, stdio: ['pipe','pipe','pipe'] }
      ).toString();

      const matchedLines = yarnListOutput
        .split(/\r?\n/)
        .filter((line) => line.includes('@bldrs-ai/conway@'));

      if (matchedLines.length > 0) {
        const jsonLine = JSON.parse(matchedLines[0]);
        // e.g. "@bldrs-ai/conway@0.1.560"
        const name = jsonLine.data.trees[0].name;
        const parts = name.split('@');
        engineVersion = parts[2] || '';
      }
    } catch (e) {
      console.error('Failed to get @bldrs-ai/conway version from yarn list. Using fallback "unknown".', e);
      engineVersion = 'unknown';
    }
  } else {
    // web-ifc version
    try {
      const yarnListOutput = execSync(
        `yarn list --pattern web-ifc --json`,
        { cwd: serverDir, stdio: ['pipe','pipe','pipe'] }
      ).toString();

      const matchedLines = yarnListOutput
        .split(/\r?\n/)
        .filter((line) => line.includes('web-ifc@'));

      if (matchedLines.length > 0) {
        const jsonLine = JSON.parse(matchedLines[0]);
        const name = jsonLine.data.name; // e.g. "web-ifc@0.0.45"
        const parts = name.split('@');
        engineVersion = parts[1] || ''; // e.g. '0.0.45'
      }
    } catch (e) {
      console.error('Failed to get web-ifc version from yarn list. Using fallback "unknown".', e);
      engineVersion = 'unknown';
    }
  }

  const engineStr = (isEngineConway ? 'conway' : 'webifc') + (engineVersion ? engineVersion : '');

  // Extract last folder name from modelDir
  const modelDirName = path.basename(modelDir);

  // e.g. conway@0.1.560_test-models => we'll do conway0.1.560_test-models
  const testRunName = `${engineStr}_${modelDirName}`;

  // Construct output directory
  const outputBase = path.join(scriptDir, '..', 'benchmarks');
  const outputDir = path.join(outputBase, testRunName);
  fs.mkdirSync(outputDir, { recursive: true });

  // CSV files
  const basicStatsFilename = path.join(outputDir, 'performance.csv');
  const newResults = path.join(outputDir, 'performance-detail.csv');
  const errorLogFile = path.join(outputDir, 'performance.err.txt');
  const tempServerOutputFile = path.join(outputDir, 'rendering-server.log.txt');

  // Initialize the CSV
  fs.writeFileSync(
    newResults,
    "timestamp,loadStatus,uname,engine,filename,schemaVersion,parseTimeMs,geometryTimeMs,totalTimeMs,geometryMemoryMb,rssMb,heapUsedMb,heapTotalMb,preprocessorVersion,originatingSystem\n",
    'utf8'
  );

  // We'll remove old logs if they exist
  [basicStatsFilename, errorLogFile].forEach((f) => {
    if (fs.existsSync(f)) {
      fs.unlinkSync(f);
    }
  });

  let allStatus = 'OK';
  const startTime = Date.now();

  // Helper function to append line to file
  function appendLineToFile(filename, line) {
    fs.appendFileSync(filename, line + "\n", 'utf8');
  }

  // We'll gather all IFC files under modelDir/ifc (recursively).
  function getIfcFiles(directory) {
    let results = [];
    if (!fs.existsSync(directory)) {
      return results;
    }
    const list = fs.readdirSync(directory, { withFileTypes: true });
    list.forEach((dirent) => {
      const fullPath = path.join(directory, dirent.name);
      if (dirent.isDirectory()) {
        results = results.concat(getIfcFiles(fullPath));
      } else if (dirent.isFile() && dirent.name.endsWith('.ifc')) {
        results.push(fullPath);
      }
    });
    return results;
  }

  const ifcRoot = path.join(modelDir, 'ifc');
  const allIfcFiles = getIfcFiles(ifcRoot);

  for (const filePath of allIfcFiles) {
    const baseFilename = path.basename(filePath);

    // skip excluded
    if (excludeSet.has(baseFilename)) {
      // "skip, 0s, ${f#$modelDir/}" in the bash script
      appendLineToFile(basicStatsFilename, `skip, 0s, ${filePath.replace(modelDir + '/', '')}`);
      continue;
    }

    // Start the server
    const serverCmd = `yarn serve${engineSuffix}`;
    const serverChild = spawn(serverCmd, { cwd: serverDir, shell: true });

    // Stream server output to tempServerOutputFile
    const writeStream = fs.createWriteStream(tempServerOutputFile, { flags: 'w' });
    serverChild.stdout.pipe(writeStream);
    serverChild.stderr.pipe(writeStream);

    // Wait a bit for the server to be up
    await sleep(3);

    const modelStartTime = Date.now();
    const encodedFileName = encodeFileName(baseFilename);
    const url = `file://${filePath}`; // local file path

    const outputPng = path.join(outputDir, `${baseFilename}-fit.png`);

    let curlSuccess = true;

    const renderEndpoint = 'http://localhost:8001/render';

    // Attempt the request
    try {
      const success = await postToServerAndSaveFile(
        renderEndpoint,
        { url },
        outputPng,
        180
      );
      const modelEndTime = Date.now();
      const deltaTimeSec = ((modelEndTime - modelStartTime) / 1000).toFixed(2);

      if (!success) {
        curlSuccess = false;
        appendLineToFile(errorLogFile, `Error processing file ${url}`);
        appendLineToFile(
          basicStatsFilename,
          `error, ${deltaTimeSec}s, ${filePath.replace(modelDir + '/', '')}`
        );
      } else {
        appendLineToFile(
          basicStatsFilename,
          `ok, ${deltaTimeSec}s, ${filePath.replace(modelDir + '/', '')}`
        );
      }
    } catch (err) {
      curlSuccess = false;
      const modelEndTime = Date.now();
      const deltaTimeSec = ((modelEndTime - modelStartTime) / 1000).toFixed(2);
      appendLineToFile(errorLogFile, `Error processing file ${url}: ${err.message}`);
      appendLineToFile(
        basicStatsFilename,
        `error, ${deltaTimeSec}s, ${filePath.replace(modelDir + '/', '')}`
      );
    }

    // If success, parse stats from tempServerOutputFile
    if (curlSuccess) {
      // Wait for the serverChild to flush logs
      await sleep(1);

      // We'll close the writeStream so we can read from it
      writeStream.close();

      // Synchronously read the log file
      let logContents = '';
      try {
        logContents = fs.readFileSync(tempServerOutputFile, 'utf8');
      } catch (e) {
        console.error("Error reading server output file:", e);
      }

      let timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
      let loadStatus = 'OK';
      const unameVal = os.arch(); // or os.platform(), or process.arch
      let schemaVersion = 'N/A';
      let parseTimeMs = 'N/A';
      let geometryTimeMs = 'N/A';
      let totalTimeMs = 'N/A';
      let geometryMemoryMb = 'N/A';
      let rssMb = 'N/A';
      let heapUsedMb = 'N/A';
      let heapTotalMb = 'N/A';
      let preprocessorVersion = 'N/A';
      let originatingSystem = 'N/A';

      if (isEngineConway) {
        // We replicate the logic of:
        //   awk '/\[.*\]: Load Status: OK/{flag=1} ...'
        // The easiest approach is to do a few regexes.

        // Try to see if "Load Status: OK" is in the logs
        if (!/Load Status: OK/.test(logContents)) {
          loadStatus = 'FAIL';
        } else {
          // Parse Time
          const parseTimeMatch = logContents.match(/Parse Time: (\d+) ms/);

          if (parseTimeMatch) parseTimeMs = parseTimeMatch[1];

          // Geometry Time
          const geometryTimeMatch = logContents.match(/Geometry Time: (\d+) ms/);
          if (geometryTimeMatch) geometryTimeMs = geometryTimeMatch[1];

          // Total Time
          const totalTimeMatch = logContents.match(/Total Time: (\d+) ms/);
          if (totalTimeMatch) totalTimeMs = totalTimeMatch[1];

          // Geometry Memory
          const geomMemMatch = logContents.match(/Geometry Memory: ([\d.]+) MB/);
          if (geomMemMatch) geometryMemoryMb = geomMemMatch[1];

          // RSS
          const rssMatch = logContents.match(/RSS ([\d.]+) MB/);
          if (rssMatch) rssMb = rssMatch[1];

          // Heap Used
          const heapUsedMatch = logContents.match(/Heap Used: ([\d.]+) MB/);
          if (heapUsedMatch) heapUsedMb = heapUsedMatch[1];

          // Heap Total
          const heapTotalMatch = logContents.match(/Heap Total: ([\d.]+) MB/);
          if (heapTotalMatch) heapTotalMb = heapTotalMatch[1];

          // schemaVersion
          const schemaVersionMatch = logContents.match(/Version: (IFC[^\s]+)/);
          if (schemaVersionMatch) schemaVersion = schemaVersionMatch[1].substring(0, schemaVersionMatch[1].length - 1);

          // Preprocessor Version
          const ppVersionMatch = logContents.match(/Preprocessor Version: '([^']+)'/);
          if (ppVersionMatch) preprocessorVersion = ppVersionMatch[1];

          // Originating System
          const originMatch = logContents.match(/Originating System: '([^']+)'/);
          if (originMatch) originatingSystem = originMatch[1];
        }
      } else {
        // web-ifc approach:
        // grep -E '(Total Time|web-ifc memory)' and parse
        // totalTimeMs -> /Total Time: (\d+) ms/
        const totalTimeMatch = logContents.match(/Total Time: (\d+) ms/);
        if (totalTimeMatch) totalTimeMs = totalTimeMatch[1];

        // geometryMemoryMb -> /Geometry Memory: (\d+) MB/
        const geomMemMatch = logContents.match(/Geometry Memory: ([\d.]+) MB/);
        if (geomMemMatch) geometryMemoryMb = geomMemMatch[1];

        // rssMb -> /RSS ([\d.]+) MB/
        const rssMatch = logContents.match(/RSS ([\d.]+) MB/);
        if (rssMatch) rssMb = rssMatch[1];

        // heapUsedMb -> /Heap Used: ([\d.]+) MB/
        const heapUsedMatch = logContents.match(/Heap Used: ([\d.]+) MB/);
        if (heapUsedMatch) heapUsedMb = heapUsedMatch[1];

        // heapTotalMb -> /Heap Total: ([\d.]+) MB/
        const heapTotalMatch = logContents.match(/Heap Total: ([\d.]+) MB/);
        if (heapTotalMatch) heapTotalMb = heapTotalMatch[1];

        // For web-ifc, parseTimeMs = geometryTimeMs = preprocessorVersion = originatingSystem = '0' or 'N/A'
        parseTimeMs = 0;
        geometryTimeMs = 0;
        preprocessorVersion = 0;
        originatingSystem = 0;
      }

      // Write CSV
      const line = [
        timestamp,
        loadStatus,
        unameVal,
        engineStr,
        encodedFileName,
        schemaVersion,
        parseTimeMs,
        geometryTimeMs,
        totalTimeMs,
        geometryMemoryMb,
        rssMb,
        heapUsedMb,
        heapTotalMb,
        preprocessorVersion,
        originatingSystem
      ].join(',');


      appendLineToFile(newResults, line);
    } else {
      // If fail
      const timestamp = new Date()
        .toISOString()
        .replace(/[-:T]/g, '')
        .split('.')[0];
      const unameVal = os.arch();

      allStatus = 'fail';
      const failLine = `${timestamp},FAIL,${unameVal},N/A,${baseFilename},N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A`;
      appendLineToFile(newResults, failLine);
    }

    // Kill the server
    if (serverChild && serverChild.pid) {
      try {
        process.kill(serverChild.pid);
      } catch (e) {
        // ignore
      }
    }

    // Wait a bit
    await sleep(2);
  }

  const endTime = Date.now();
  const deltaTimeSec = ((endTime - startTime) / 1000).toFixed(2);
  appendLineToFile(basicStatsFilename, `${allStatus}, ${deltaTimeSec}s, ALL_FILES`);

  // Attempt to do the delta with old results
  let oldVersion = '';
  try {
    if (isEngineConway) {
      // Using the GitHub registry
      oldVersion = execSync(
        `npm show @bldrs-ai/conway version --registry=https://npm.pkg.github.com/`,
        { stdio: ['pipe','pipe','ignore'] }
      ).toString().trim();
      // Decrement minor (like old script). Example: 0.1.560 => 0.0.560
      const parts = oldVersion.split('.');
      if (parts.length === 3) {
        const minor = parseInt(parts[1], 10);
        parts[1] = Math.max(minor - 1, 0).toString();
        oldVersion = parts.join('.');
      }
    }
  } catch (e) {
    // fallback
    console.warn('Could not fetch oldVersion from npm show. Skipping delta generation.', e);
  }

  if (oldVersion && isEngineConway) {
    // e.g. conway + oldVersion + _ + modelDirName
    const oldResultsFileName = `conway${oldVersion}_${modelDirName}/performance-detail.csv`;
    const oldResultsPath = path.join(outputBase, oldResultsFileName);

    const newVersionOnly = engineVersion || 'unknown';
    const deltaOutputPath = path.join(outputDir, `conway${newVersionOnly}_${oldVersion}_delta.csv`);

    if (fs.existsSync(oldResultsPath)) {
      console.log(`Generating delta file: ${deltaOutputPath}`);
      try {
        generateDeltaCSV(oldResultsPath, newResults, deltaOutputPath);
        console.log(`Delta file generated: ${deltaOutputPath}`);
      } catch (e) {
        console.warn(`Failed to generate delta file: ${e.message}`);
      }
    } else {
      console.warn(`Warning: Latest version's performance-detail.csv not found at ${oldResultsPath}. Delta file not generated.`);
    }
  } else if (!isEngineConway) {
    console.log("Web-ifc mode, skipping the oldVersion delta logic.");
  }
}

// Start
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
