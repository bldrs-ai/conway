#!/usr/bin/env node

/**
 * Usage:
 *    node benchmark.js /path/to/headless_three /path/to/model_directory [useWebIfc | singleThread]
 *
 * Environment variables:
 *    EXCLUDE_FILENAMES   list of file names to skip, e.g. 'foo.ifc bar.ifc'
 *
 * This script:
 *    - Spawns a server using "yarn serve" or "yarn serve-webifc".
 *    - Iterates over all IFC files in modelDir/ifc, skipping any in EXCLUDE_FILENAMES.
 *    - Renders each IFC, collects performance stats, and writes them to CSV.
 *    - At the end, generates an HTML report in outputDir that displays:
 *         • Full IFC file path,
 *         • Rendered image,
 *         • A link to view the IFC on bldrs.ai.
 *      The link follows the format:
 *         https://bldrs.ai/share/v/gh/bldrs-ai/<modelDirName>/main/<relative-ifc-path>
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
 * Perform a POST request with JSON body, save response to file (PNG).
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
        res.resume(); // consume response data to free up memory
        return resolve(false);
      }
      const fileStream = fs.createWriteStream(outputPath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close(() => {
          resolve(true);
        });
      });
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy(new Error('Request timed out'));
      resolve(false);
    });

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

  const command = [
    'node benchmark.cjs',
    ...args.map(a => JSON.stringify(a))
  ].join(' ');

  // Determine engine usage
  let isEngineConway = true;
  let engineSuffix = "";
  if (thirdArg) {
    if (thirdArg === "useWebIfc") {
      isEngineConway = false;
      engineSuffix = "-webifc";
    } else if (thirdArg === "singleThread") {
      engineSuffix = "-single-thread"
    } else {
      console.error("Error: unknown engine command: can pass useWebIfc or singleThread for Conway single threaded mode.");
      usageAndExit();
    }
  }

  const excludeFilenamesEnv = process.env.EXCLUDE_FILENAMES || "";
  const excludeSet = new Set(excludeFilenamesEnv.split(/\s+/).filter(Boolean));

  const scriptDir = process.cwd();
  const currentDate = new Date()
    .toISOString()
    .replace(/[-:T]/g, '')
    .split('.')[0];

  // Determine engine version
  let engineVersion = "";
  if (isEngineConway) {
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
        const name = jsonLine.data.trees[0].name; // e.g., "@bldrs-ai/conway@0.1.560"
        const parts = name.split('@');
        engineVersion = parts[2] || '';
      }
    } catch (e) {
      console.error('Failed to get @bldrs-ai/conway version from yarn list. Using fallback "unknown".', e);
      engineVersion = 'unknown';
    }
  } else {
    try {
      const yarnListOutput = execSync(
        `yarn list --pattern web-ifc --json`,
        { cwd: serverDir, stdio: ['pipe', 'pipe', 'pipe'] }
      ).toString();
      
      // Split the output into lines and get the last non-empty line.
      const lines = yarnListOutput.trim().split(/\r?\n/);
      const lastLine = lines[lines.length - 1];
      const parsedOutput = JSON.parse(lastLine);
      
      // Ensure the output is the dependency tree.
      if (parsedOutput.type === 'tree' && parsedOutput.data && parsedOutput.data.trees) {
        // Find the entry whose name starts with "web-ifc@".
        const webIfcEntry = parsedOutput.data.trees.find(entry =>
          entry.name.startsWith('web-ifc@')
        );
        if (webIfcEntry) {
          const parts = webIfcEntry.name.split('@');
          engineVersion = parts[1] || '';
        }
      }
    } catch (e) {
      console.error('Failed to get web-ifc version from yarn list. Using fallback "unknown".', e);
      engineVersion = 'unknown';
    }
  }

  const engineStr =
  (isEngineConway ? 'conway' : 'webifc') +
  (engineVersion ? engineVersion : '') +
  (engineSuffix === "-single-thread" ? engineSuffix : "");

  // Extract the model directory’s base name (used in the share link)
  const modelDirName = path.basename(modelDir);
  // Test run name for the benchmarks folder.
  const testRunName = `${engineStr}_${modelDirName}`;

  // Construct output directory for logs/CSVs.
  const outputBase = path.join(modelDir, 'benchmarks');
  const outputDir = path.join(outputBase, testRunName);
  fs.mkdirSync(outputDir, { recursive: true });

  // Write command log.
  const logOutputFile = path.join(outputDir, '00-command.log.txt');
  fs.writeFileSync(logOutputFile, command + '\n', { encoding: 'utf8' });

  // CSV files.
  const basicStatsFilename = path.join(outputDir, 'performance.csv');
  const newResults = path.join(outputDir, 'performance-detail.csv');
  const errorLogFile = path.join(outputDir, 'performance.err.txt');
  const tempServerOutputFile = path.join(outputDir, '00-rendering-server.log.txt');

  fs.writeFileSync(
    newResults,
    "timestamp,loadStatus,uname,engine,filename,schemaVersion,parseTimeMs,geometryTimeMs,totalTimeMs,geometryMemoryMb,rssMb,heapUsedMb,heapTotalMb,preprocessorVersion,originatingSystem\n",
    'utf8'
  );

  [basicStatsFilename, errorLogFile].forEach((f) => {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  });

  let allStatus = 'OK';
  const startTime = Date.now();

  // Array to hold entries for the HTML report.
  const htmlEntries = [];

  // Helper to append a line to a file.
  function appendLineToFile(filename, line) {
    fs.appendFileSync(filename, line + "\n", 'utf8');
  }

  // Function to recursively get all IFC files.
  function getIfcFiles(directory) {
    let results = [];
    if (!fs.existsSync(directory)) return results;
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

    // Skip excluded files.
    if (excludeSet.has(baseFilename)) {
      appendLineToFile(basicStatsFilename, `skip, 0s, ${filePath.replace(modelDir + '/', '')}`);
      continue;
    }

    // Start the server.
    const serverCmd = `yarn serve${engineSuffix}`;
    const serverChild = spawn(serverCmd, { cwd: serverDir, shell: true, detached:true });
    const writeStream = fs.createWriteStream(tempServerOutputFile, { flags: 'w' });
    serverChild.stdout.pipe(writeStream);
    serverChild.stderr.pipe(writeStream);

    await sleep(3);

    const modelStartTime = Date.now();
    const encodedFileName = encodeFileName(baseFilename);
    const url = `file://${filePath}`; // local file path

    // --- Save the output PNG in the same directory as the IFC file ---
    const outputPng = path.join(path.dirname(filePath), `${baseFilename}-fit.png`);

    let curlSuccess = true;
    const renderEndpoint = 'http://localhost:8001/renderPanoramic';

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
        appendLineToFile(basicStatsFilename, `error, ${deltaTimeSec}s, ${filePath.replace(modelDir + '/', '')}`);
      } else {
        appendLineToFile(basicStatsFilename, `ok, ${deltaTimeSec}s, ${filePath.replace(modelDir + '/', '')}`);
      }
    } catch (err) {
      curlSuccess = false;
      const modelEndTime = Date.now();
      const deltaTimeSec = ((modelEndTime - modelStartTime) / 1000).toFixed(2);
      appendLineToFile(errorLogFile, `Error processing file ${url}: ${err.message}`);
      appendLineToFile(basicStatsFilename, `error, ${deltaTimeSec}s, ${filePath.replace(modelDir + '/', '')}`);
    }

    if (curlSuccess) {
      await sleep(1);
      writeStream.close();

      let logContents = '';
      try {
        logContents = fs.readFileSync(tempServerOutputFile, 'utf8');
      } catch (e) {
        console.error("Error reading server output file:", e);
      }

      let timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
      let loadStatus = 'OK';
      const unameVal = os.arch();
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
        if (!/Load Status: OK/.test(logContents)) {
          loadStatus = 'FAIL';
        } else {
          const parseTimeMatch = logContents.match(/Parse Time: (\d+) ms/);
          if (parseTimeMatch) parseTimeMs = parseTimeMatch[1];
          const geometryTimeMatch = logContents.match(/Geometry Time: (\d+) ms/);
          if (geometryTimeMatch) geometryTimeMs = geometryTimeMatch[1];
          const totalTimeMatch = logContents.match(/Total Time: (\d+) ms/);
          if (totalTimeMatch) totalTimeMs = totalTimeMatch[1];
          const geomMemMatch = logContents.match(/Geometry Memory: ([\d.]+) MB/);
          if (geomMemMatch) geometryMemoryMb = geomMemMatch[1];
          const rssMatch = logContents.match(/RSS ([\d.]+) MB/);
          if (rssMatch) rssMb = rssMatch[1];
          const heapUsedMatch = logContents.match(/Heap Used: ([\d.]+) MB/);
          if (heapUsedMatch) heapUsedMb = heapUsedMatch[1];
          const heapTotalMatch = logContents.match(/Heap Total: ([\d.]+) MB/);
          if (heapTotalMatch) heapTotalMb = heapTotalMatch[1];
          const schemaVersionMatch = logContents.match(/Version: (IFC[^\s]+)/);
          if (schemaVersionMatch) schemaVersion = schemaVersionMatch[1].slice(0, -1);
          const ppVersionMatch = logContents.match(/Preprocessor Version: '([^']+)'/);
          if (ppVersionMatch) preprocessorVersion = ppVersionMatch[1];
          const originMatch = logContents.match(/Originating System: '([^']+)'/);
          if (originMatch) originatingSystem = originMatch[1];
        }
      } else {
        const totalTimeMatch = logContents.match(/Total Time: (\d+) ms/);
        if (totalTimeMatch) totalTimeMs = totalTimeMatch[1];
        const geomMemMatch = logContents.match(/Geometry Memory: ([\d.]+) MB/);
        if (geomMemMatch) geometryMemoryMb = geomMemMatch[1];
        const rssMatch = logContents.match(/RSS ([\d.]+) MB/);
        if (rssMatch) rssMb = rssMatch[1];
        const heapUsedMatch = logContents.match(/Heap Used: ([\d.]+) MB/);
        if (heapUsedMatch) heapUsedMb = heapUsedMatch[1];
        const heapTotalMatch = logContents.match(/Heap Total: ([\d.]+) MB/);
        if (heapTotalMatch) heapTotalMb = heapTotalMatch[1];
        parseTimeMs = 0;
        geometryTimeMs = 0;
        preprocessorVersion = 0;
        originatingSystem = 0;
      }

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

      // --- RECORD THE HTML ENTRY ---
      if (fs.existsSync(outputPng)) {
        // Compute a relative path from outputDir to the image.
        const relImagePath = path.relative(outputDir, outputPng);
        // Compute the IFC file path relative to the modelDir so that the "ifc/" folder is included.
        const relativeIfcPath = path.relative(modelDir, filePath).split(path.sep).join('/');
        console.log(`modelDir: ${modelDir}\nfilePath: ${filePath}\nrelativeIfcPath: ${relativeIfcPath}`);
        // Link format: https://bldrs.ai/share/v/gh/bldrs-ai/<modelDirName>/main/<relative-ifc-path>
        const link = `https://bldrs.ai/share/v/gh/bldrs-ai/${modelDirName}/main/${relativeIfcPath}`;
        console.log(`link: ${link}`);
        htmlEntries.push({ ifcFullPath: filePath, image: relImagePath, link });
      }
    } else {
      const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
      const unameVal = os.arch();
      allStatus = 'fail';
      const failLine = `${timestamp},FAIL,${unameVal},N/A,${baseFilename},N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A`;
      appendLineToFile(newResults, failLine);
    }

    // Kill the server.
    if (serverChild && serverChild.pid) {
      try {
        process.kill(-serverChild.pid);
      } catch (e) {
        // ignore
      }
    }
    await sleep(2);
  }

  const endTime = Date.now();
  const deltaTimeSec = ((endTime - startTime) / 1000).toFixed(2);
  appendLineToFile(basicStatsFilename, `${allStatus}, ${deltaTimeSec}s, ALL_FILES`);

  // Delta CSV generation (if applicable).
  let oldVersion = '';
  try {
    if (isEngineConway) {
      oldVersion = execSync(
        `npm show @bldrs-ai/conway version`,
        { stdio: ['pipe','pipe','ignore'] }
      ).toString().trim();
      const parts = oldVersion.split('.');
      if (parts.length === 3) {
        const minor = parseInt(parts[1], 10);
        parts[1] = Math.max(minor - 1, 0).toString();
        oldVersion = parts.join('.');
      }
    }
  } catch (e) {
    console.warn('Could not fetch oldVersion from npm show. Skipping delta generation.', e);
  }

  if (oldVersion && isEngineConway) {
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

  // --- GENERATE THE HTML REPORT ---
const htmlFile = path.join(outputDir, "index.html");

/**
 * Extracts "test-models" or "test-models-private" + everything after,
 * e.g. "/home/user/whatever/test-models/ifc/file.ifc" -> "test-models/ifc/file.ifc".
 * Returns null if neither is found.
 */
function truncateBeforeTestModels(fullPath) {
  const re = /(test-models(?:-private)?)(.*)/;
  const match = fullPath.match(re);
  if (!match) return null;  // Did not find "test-models" or "test-models-private"
  const repo = match[1];    // e.g. "test-models" or "test-models-private"
  let subPath = match[2];   // e.g. "/ifc/file.ifc"
  // Remove leading slashes
  subPath = subPath.replace(/^[/\\]+/, '');
  return { repo, subPath };
}

let htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>IFC Rendered Images</title>
  <style type="text/css">
    body { font-family: Verdana, Arial, sans-serif; }
    table { border-collapse: collapse; margin: 0 auto; }
    th, td { border: 1px solid #eee; padding: 8px; text-align: left; }
    img { max-width: 600px; max-height: 600px; }
  </style>
</head>
<body style="text-align: center">
  <h1>Conway ${engineVersion}</h1>
  <p><a href="https://bldrs.ai">https://bldrs.ai</a></p>
  <p><a href="https://github.com/bldrs-ai/conway/pulls">https://github.com/bldrs-ai/conway</a></p>
  <p><a href="https://www.npmjs.com/package/@bldrs-ai/conway">https://www.npmjs.com/package/@bldrs-ai/conway</a></p>
  <table>
    <thead>
      <tr>
        <th>Model</th>
        <th>Panorama &amp; Mid-plane</th>
      </tr>
    </thead>
    <tbody>
`;

for (const entry of htmlEntries) {
  // entry.ifcFullPath = full path to IFC file
  // entry.image       = relative path to the local PNG
  // entry.link        = "https://bldrs.ai/share/v/gh/bldrs-ai/<repo>/main/<ifcPath>"

  // Truncate the portion before test-models or test-models-private.
  // This will give us something like:  test-models/ifc/Foo.ifc
  const truncated = truncateBeforeTestModels(entry.ifcFullPath);

  // If we did not find test-models( or private ), just use the full path as fallback.
  let modelCellText = entry.ifcFullPath;
  let rawImageUrl = entry.image; // By default, your local screenshot path.
  let modelLink = entry.link;    // By default, the share link you generated.

  if (truncated) {
    const { repo, subPath } = truncated;
    // Construct a share link to bldrs.ai (which you already have in entry.link).
    // If you need a raw GitHub link for the image, you can do something like:
    // rawImageUrl = `https://raw.githubusercontent.com/bldrs-ai/${repo}/refs/heads/main/${subPath}-fit.png`
    // But only do this if you actually want to serve the images from GitHub,
    // rather than from your local benchmark output directory.

    // For the cell text, "repo/subPath" will look like "test-models/ifc/Foo.ifc".
    modelCellText = `${repo}/${subPath}`;
  }

  htmlContent += `
      <tr>
        <td>
          <a href="${modelLink}" target="_blank">${modelCellText}</a>
        </td>
        <td>
          <img src="${rawImageUrl}" alt="${modelCellText}">
        </td>
      </tr>
  `;
}

htmlContent += `
    </tbody>
  </table>
</body>
</html>
`;

fs.writeFileSync(htmlFile, htmlContent, 'utf8');
console.log(`HTML report generated at: ${htmlFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
