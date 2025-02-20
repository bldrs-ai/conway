const fs = require('fs');

/**
 * Generate a delta CSV from two performance-detail CSV files.
 *
 * @param {string} csvPath1 Path to first CSV file (older run).
 * @param {string} csvPath2 Path to second CSV file (newer run).
 * @param {string} outputCsvPath Where to write the resulting delta CSV.
 * @param {boolean} [isWebIfc=false] If true, compute only selected deltas and output a limited set of columns.
 */
function generateDeltaCSV(csvPath1, csvPath2, outputCsvPath, isWebIfc = false) {
  const data1 = readDataFromCsv(csvPath1);
  const data2 = readDataFromCsv(csvPath2);

  const deltas = computeDeltas(data1, data2, isWebIfc);
  writeDataToCsv(deltas, outputCsvPath, isWebIfc);
}

/**
 * Reads a CSV file and returns an array of row-objects keyed by header columns.
 * @param {string} filepath
 * @returns {Array<Object>}
 */
function readDataFromCsv(filepath) {
  const fileContents = fs.readFileSync(filepath, 'utf8');
  const lines = fileContents.split(/\r?\n/).filter((l) => l.trim() !== '');

  if (lines.length < 2) {
    // Either empty or header-only => no data
    return [];
  }

  // The first line is the header
  const headers = lines[0].split(',').map((h) => h.trim());

  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',');
    const rowObj = {};
    headers.forEach((header, index) => {
      // Trim whitespace for each cell
      const cell = row[index] ? row[index].trim() : '';
      rowObj[header] = cell;
    });
    data.push(rowObj);
  }
  return data;
}

/**
 * Writes an array of row-objects to CSV.
 * @param {Array<Object>} data
 * @param {string} csvFilename
 * @param {boolean} [isWebIfc=false] If true, use the limited CSV header.
 */
function writeDataToCsv(data, csvFilename, isWebIfc = false) {
  const csvHeader = isWebIfc
    ? [
        'loadStatus1',
        'loadStatus2',
        'uname',
        'engine1',
        'engine2',
        'filename',
        'engine1TotalTimeMs',
        'engine2TotalTimeMs',
        'totalTimeMsDelta',
        'totalTimeMsPercentageChange',
        'geometryMemoryMbDelta',
        'rssMbDelta',
        'heapUsedMbDelta',
        'heapTotalMbDelta',
      ]
    : [
        'timestamp',
        'loadStatus1',
        'loadStatus2',
        'uname',
        'engine1',
        'engine2',
        'filename',
        'schemaVersion',
        'engine1TotalTimeMs',
        'engine2TotalTimeMs',
        'parseTimeMsDelta',
        'geometryTimeMsDelta',
        'totalTimeMsDelta',
        'totalTimeMsPercentageChange',
        'geometryMemoryMbDelta',
        'rssMbDelta',
        'heapUsedMbDelta',
        'heapTotalMbDelta',
      ];

  const lines = [];
  // write the header
  lines.push(csvHeader.join(','));

  // write each row
  data.forEach((row) => {
    const rowCells = csvHeader.map((col) => (row[col] != null ? row[col] : ''));
    lines.push(rowCells.join(','));
  });

  fs.writeFileSync(csvFilename, lines.join('\n'), 'utf8');
}

/**
 * Compute the difference rows between two CSV data sets.
 * @param {Array<Object>} data1
 * @param {Array<Object>} data2
 * @param {boolean} [isWebIfc=false] If true, compute only selected deltas and return limited fields.
 * @returns {Array<Object>} array of delta rows
 */
function computeDeltas(data1, data2, isWebIfc = false) {
  // Build lookup by filename for each data set
  const data1ByFile = {};
  data1.forEach((entry) => {
    data1ByFile[entry.filename] = entry;
  });

  const data2ByFile = {};
  data2.forEach((entry) => {
    data2ByFile[entry.filename] = entry;
  });

  const deltas = [];

  if (isWebIfc) {
    // Process files present in data1
    for (const filename of Object.keys(data1ByFile)) {
      const entry1 = data1ByFile[filename];
      const entry2 = data2ByFile[filename];

      if (entry2) {
        deltas.push({
          loadStatus1: entry1.loadStatus,
          loadStatus2: entry2.loadStatus,
          uname: entry1.uname,
          engine1: entry1.engine,
          engine2: entry2.engine,
          filename,
          engine1TotalTimeMs: entry1.totalTimeMs,
          engine2TotalTimeMs: entry2.totalTimeMs,
          totalTimeMsDelta: computeDelta('totalTimeMs', entry2, entry1),
          totalTimeMsPercentageChange: computePercentageChange(
            entry1.totalTimeMs,
            entry2.totalTimeMs
          ),
          geometryMemoryMbDelta: computeDelta('geometryMemoryMb', entry2, entry1),
          rssMbDelta: computeDelta('rssMb', entry2, entry1),
          heapUsedMbDelta: computeDelta('heapUseMb', entry2, entry1),
          heapTotalMbDelta: computeDelta('heapTotalMb', entry2, entry1),
        });
      } else {
        // Present in data1, missing in data2
        deltas.push({
          loadStatus1: entry1.loadStatus,
          loadStatus2: 'N/A',
          uname: entry1.uname,
          engine1: entry1.engine,
          engine2: 'N/A',
          filename,
          engine1TotalTimeMs: entry1.totalTimeMs,
          engine2TotalTimeMs: 'N/A',
          totalTimeMsDelta: 'N/A',
          totalTimeMsPercentageChange: 'N/A',
          geometryMemoryMbDelta: 'N/A',
          rssMbDelta: 'N/A',
          heapUsedMbDelta: 'N/A',
          heapTotalMbDelta: 'N/A',
        });
      }
    }

    // Process files present in data2 but not in data1
    for (const filename of Object.keys(data2ByFile)) {
      if (!data1ByFile[filename]) {
        const entry2 = data2ByFile[filename];
        deltas.push({
          loadStatus1: 'N/A',
          loadStatus2: entry2.loadStatus,
          uname: entry2.uname,
          engine1: 'N/A',
          engine2: entry2.engine,
          filename,
          engine1TotalTimeMs: 'N/A',
          engine2TotalTimeMs: entry2.totalTimeMs,
          totalTimeMsDelta: 'N/A',
          totalTimeMsPercentageChange: 'N/A',
          geometryMemoryMbDelta: 'N/A',
          rssMbDelta: 'N/A',
          heapUsedMbDelta: 'N/A',
          heapTotalMbDelta: 'N/A',
        });
      }
    }
  } else {
    // Original functionality (compute full delta)
    for (const filename of Object.keys(data1ByFile)) {
      const entry1 = data1ByFile[filename];
      const entry2 = data2ByFile[filename];

      if (entry2) {
        const totalTimeDelta = computeDelta('totalTimeMs', entry2, entry1);
        const totalTimePercentageChange = computePercentageChange(
          entry1.totalTimeMs,
          entry2.totalTimeMs
        );

        deltas.push({
          timestamp: entry1.timestamp,
          loadStatus1: entry1.loadStatus,
          loadStatus2: entry2.loadStatus,
          uname: entry1.uname,
          engine1: entry1.engine,
          engine2: entry2.engine,
          filename,
          schemaVersion: entry1.schemaVersion,
          engine1TotalTimeMs: entry1.totalTimeMs,
          engine2TotalTimeMs: entry2.totalTimeMs,
          parseTimeMsDelta: computeDelta('parseTimeMs', entry2, entry1),
          geometryTimeMsDelta: computeDelta('geometryTimeMs', entry2, entry1),
          totalTimeMsDelta: totalTimeDelta,
          totalTimeMsPercentageChange: totalTimePercentageChange,
          geometryMemoryMbDelta: computeDelta('geometryMemoryMb', entry2, entry1),
          rssMbDelta: computeDelta('rssMb', entry2, entry1),
          heapUsedMbDelta: computeDelta('heapUseMb', entry2, entry1),
          heapTotalMbDelta: computeDelta('heapTotalMb', entry2, entry1),
        });
      } else {
        deltas.push({
          timestamp: entry1.timestamp,
          loadStatus1: entry1.loadStatus,
          loadStatus2: 'N/A',
          uname: entry1.uname,
          engine1: entry1.engine,
          engine2: 'N/A',
          filename,
          schemaVersion: entry1.schemaVersion,
          engine1TotalTimeMs: entry1.totalTimeMs,
          engine2TotalTimeMs: 'N/A',
          parseTimeMsDelta: 'N/A',
          geometryTimeMsDelta: 'N/A',
          totalTimeMsDelta: 'N/A',
          totalTimeMsPercentageChange: 'N/A',
          geometryMemoryMbDelta: 'N/A',
          rssMbDelta: 'N/A',
          heapUsedMbDelta: 'N/A',
          heapTotalMbDelta: 'N/A',
        });
      }
    }

    for (const filename of Object.keys(data2ByFile)) {
      if (!data1ByFile[filename]) {
        const entry2 = data2ByFile[filename];
        deltas.push({
          timestamp: entry2.timestamp,
          loadStatus1: 'N/A',
          loadStatus2: entry2.loadStatus,
          uname: entry2.uname,
          engine1: 'N/A',
          engine2: entry2.engine,
          filename,
          schemaVersion: entry2.schemaVersion,
          engine1TotalTimeMs: 'N/A',
          engine2TotalTimeMs: entry2.totalTimeMs,
          parseTimeMsDelta: 'N/A',
          geometryTimeMsDelta: 'N/A',
          totalTimeMsDelta: 'N/A',
          totalTimeMsPercentageChange: 'N/A',
          geometryMemoryMbDelta: 'N/A',
          rssMbDelta: 'N/A',
          heapUsedMbDelta: 'N/A',
          heapTotalMbDelta: 'N/A',
        });
      }
    }
  }

  return deltas;
}

/**
 * Computes the numeric difference of a field between two entries (entry2 - entry1).
 * @param {string} field
 * @param {Object} entry2
 * @param {Object} entry1
 * @returns {number}
 */
function computeDelta(field, entry2, entry1) {
  return parseValue(entry2[field]) - parseValue(entry1[field]);
}

/**
 * Computes the percentage change from oldValue to newValue, e.g., ((new - old)/old)*100.
 * Returns a string like "12.34%".
 * @param {string | number} oldValue
 * @param {string | number} newValue
 * @returns {string}
 */
function computePercentageChange(oldValue, newValue) {
  const oldVal = parseValue(oldValue);
  const newVal = parseValue(newValue);

  if (oldVal === 0) {
    if (newVal > 0) {
      return 'Infinity';
    }
    return '0%';
  }

  const perc = ((newVal - oldVal) / oldVal) * 100;
  return `${perc.toFixed(2)}%`;
}

/**
 * Safely parse a string or number to float; 'N/A' or empty => 0.0
 * @param {string | number} value
 * @returns {number}
 */
function parseValue(value) {
  if (value == null) {
    return 0.0;
  }
  if (typeof value === 'number') {
    return value;
  }
  const trimmed = value.trim();
  if (trimmed === '' || trimmed.toUpperCase() === 'N/A') {
    return 0.0;
  }
  const floatVal = Number(trimmed);
  return isNaN(floatVal) ? 0.0 : floatVal;
}

// If you want to run it as a standalone script:
// node delta.js oldCsvPath newCsvPath outCsvPath [isWebIfc]
if (require.main === module) {
  if (process.argv.length < 5 || process.argv.length > 6) {
    console.error(
      `Usage: node ${process.argv[1]} <run_name1.csv> <run_name2.csv> <output_csv_filename> [isWebIfc]`
    );
    process.exit(1);
  }

  const [ , , runName1, runName2, outputCsv, isWebIfcArg ] = process.argv;
  const isWebIfc = isWebIfcArg ? true : false;
  generateDeltaCSV(runName1, runName2, outputCsv, isWebIfc);
}

// Export so we can use from benchmark.js or other modules
module.exports = { generateDeltaCSV };
