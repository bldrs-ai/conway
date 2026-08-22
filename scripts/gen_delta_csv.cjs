const fs = require('fs');
const { csvRow, parseCsv } = require('./csv_rfc4180.cjs');

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
  // RFC 4180 rather than split(','): performance-detail.csv quotes the free
  // text it lifts from the IFC header (preprocessorVersion,
  // originatingSystem) and any model filename containing a comma, and a naive
  // split would tear a quoted field back into extra cells — shifting every
  // column after it and silently mis-joining the delta.
  const records = parseCsv(fs.readFileSync(filepath, 'utf8'));

  if (records.length < 2) {
    // Either empty or header-only => no data
    return [];
  }

  const headers = records[0].map((h) => h.trim());

  return records.slice(1).map((row) => {
    const rowObj = {};
    headers.forEach((header, index) => {
      // Trim whitespace for each cell
      rowObj[header] = row[index] !== undefined ? row[index].trim() : '';
    });
    return rowObj;
  });
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
        'peakWasmHeapMbDelta',
        'rssMbDelta',
        'peakRssMbDelta',
        'heapUsedMbDelta',
        'heapTotalMbDelta',
        'externalMbDelta',
        'arrayBuffersMbDelta',
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
        'peakWasmHeapMbDelta',
        'rssMbDelta',
        'peakRssMbDelta',
        'heapUsedMbDelta',
        'heapTotalMbDelta',
        'externalMbDelta',
        'arrayBuffersMbDelta',
      ];

  const lines = [];
  // write the header
  lines.push(csvRow(csvHeader));

  // write each row
  data.forEach((row) => {
    lines.push(csvRow(csvHeader.map((col) => (row[col] != null ? row[col] : ''))));
  });

  fs.writeFileSync(csvFilename, lines.join('\n'), 'utf8');
}

/**
 * Canonical form of a `filename` cell for joining, i.e. URL-decoded.
 *
 * scripts/benchmark.cjs URL-encodes the filename on its OK path but wrote the
 * raw name on its render-failure path, so one committed CSV can hold both
 * spellings of one model. That is fixed at the writer now, but the CSVs it
 * already wrote are history and this join still has to read them.
 *
 * @param {string} filename
 * @returns {string} The decoded name, or the input when it does not decode.
 */
function canonicalFilename(filename) {
  try {
    return decodeURIComponent(filename);
  } catch (e) {
    // A lone '%' that is not a valid escape throws here, and a real model
    // filename can contain one. Such a name is already its own canonical form.
    return filename;
  }
}

/**
 * Index one run's rows by filename, with a canonical-form fallback.
 *
 * The fallback is deliberately NOT a replacement for exact matching: an exact
 * hit always wins, and reconcileIndexes then strips any canonical key that is
 * ambiguous. So a corpus that really did contain both `a b.ifc` and
 * `a%20b.ifc` as distinct files still joins each to its own counterpart or to
 * nothing, rather than silently collapsing them.
 *
 * @param {Array<Object>} data Row objects for one run.
 * @returns {{exact: Object, canonical: Map<string, Object>,
 *            ambiguous: Set<string>}}
 */
function buildFilenameIndex(data) {
  const exact = {};
  data.forEach((entry) => {
    exact[entry.filename] = entry;
  });

  const canonical = new Map();
  const ambiguous = new Set();

  for (const filename of Object.keys(exact)) {
    const key = canonicalFilename(filename);
    if (canonical.has(key)) {
      ambiguous.add(key);
      continue;
    }
    canonical.set(key, exact[filename]);
  }

  return { exact, canonical, ambiguous };
}

/**
 * Drop every ambiguous canonical key from BOTH indexes.
 *
 * Ambiguity has to be judged across the pair, not per side. If one run holds
 * both `a b.ifc` and `a%20b.ifc` while the other holds only `a b.ifc`, then
 * the side with one row is locally unambiguous — and its single entry would be
 * matched twice, once exactly and once through the fallback, reporting the same
 * measurement as the counterpart of two different models. Removing the key
 * from both sides leaves the exact match intact and the other filename
 * correctly one-sided.
 *
 * @param {{canonical: Map<string, Object>, ambiguous: Set<string>}} index1
 * @param {{canonical: Map<string, Object>, ambiguous: Set<string>}} index2
 * @returns {void}
 */
function reconcileIndexes(index1, index2) {
  for (const key of [...index1.ambiguous, ...index2.ambiguous]) {
    index1.canonical.delete(key);
    index2.canonical.delete(key);
  }
}

/**
 * Look one filename up in an index: exact match first, canonical form second.
 *
 * @param {{exact: Object, canonical: Map<string, Object>}} index
 * @param {string} filename
 * @returns {Object | undefined} The matching row, or undefined.
 */
function lookupByFilename(index, filename) {
  if (Object.prototype.hasOwnProperty.call(index.exact, filename)) {
    return index.exact[filename];
  }
  return index.canonical.get(canonicalFilename(filename));
}

/**
 * Compute the difference rows between two CSV data sets.
 * @param {Array<Object>} data1
 * @param {Array<Object>} data2
 * @param {boolean} [isWebIfc=false] If true, compute only selected deltas and return limited fields.
 * @returns {Array<Object>} array of delta rows
 */
function computeDeltas(data1, data2, isWebIfc = false) {
  const index1 = buildFilenameIndex(data1);
  const index2 = buildFilenameIndex(data2);

  reconcileIndexes(index1, index2);

  // Kept as plain objects so the iteration order below is unchanged.
  const data1ByFile = index1.exact;
  const data2ByFile = index2.exact;

  const deltas = [];

  if (isWebIfc) {
    // Process files present in data1
    for (const filename of Object.keys(data1ByFile)) {
      const entry1 = data1ByFile[filename];
      const entry2 = lookupByFilename(index2, filename);

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
          // A different quantity from geometryMemoryMb, not a rescaling of it:
          // the wasm heap holds allocator overhead and boolean intermediates
          // the payload figure excludes. Also absent before #552.
          peakWasmHeapMbDelta: computeDelta('peakWasmHeapMb', entry2, entry1),
          rssMbDelta: computeDelta('rssMb', entry2, entry1),
          // Absent from every snapshot committed before #552; computeDelta
          // reports that as N/A rather than differencing against zero.
          peakRssMbDelta: computeDelta('peakRssMb', entry2, entry1),
          heapUsedMbDelta: computeDelta('heapUsedMb', entry2, entry1),
          heapTotalMbDelta: computeDelta('heapTotalMb', entry2, entry1),
          // Also absent before #552. arrayBuffersMb is a subset of externalMb,
          // so the two deltas are not independent — read them together.
          externalMbDelta: computeDelta('externalMb', entry2, entry1),
          arrayBuffersMbDelta: computeDelta('arrayBuffersMb', entry2, entry1),
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
          peakWasmHeapMbDelta: 'N/A',
          rssMbDelta: 'N/A',
          peakRssMbDelta: 'N/A',
          heapUsedMbDelta: 'N/A',
          heapTotalMbDelta: 'N/A',
          externalMbDelta: 'N/A',
          arrayBuffersMbDelta: 'N/A',
        });
      }
    }

    // Process files present in data2 but not in data1
    for (const filename of Object.keys(data2ByFile)) {
      if (!lookupByFilename(index1, filename)) {
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
          peakWasmHeapMbDelta: 'N/A',
          rssMbDelta: 'N/A',
          peakRssMbDelta: 'N/A',
          heapUsedMbDelta: 'N/A',
          heapTotalMbDelta: 'N/A',
          externalMbDelta: 'N/A',
          arrayBuffersMbDelta: 'N/A',
        });
      }
    }
  } else {
    // Original functionality (compute full delta)
    for (const filename of Object.keys(data1ByFile)) {
      const entry1 = data1ByFile[filename];
      const entry2 = lookupByFilename(index2, filename);

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
          // A different quantity from geometryMemoryMb, not a rescaling of it:
          // the wasm heap holds allocator overhead and boolean intermediates
          // the payload figure excludes. Also absent before #552.
          peakWasmHeapMbDelta: computeDelta('peakWasmHeapMb', entry2, entry1),
          rssMbDelta: computeDelta('rssMb', entry2, entry1),
          // Absent from every snapshot committed before #552; computeDelta
          // reports that as N/A rather than differencing against zero.
          peakRssMbDelta: computeDelta('peakRssMb', entry2, entry1),
          heapUsedMbDelta: computeDelta('heapUsedMb', entry2, entry1),
          heapTotalMbDelta: computeDelta('heapTotalMb', entry2, entry1),
          // Also absent before #552. arrayBuffersMb is a subset of externalMb,
          // so the two deltas are not independent — read them together.
          externalMbDelta: computeDelta('externalMb', entry2, entry1),
          arrayBuffersMbDelta: computeDelta('arrayBuffersMb', entry2, entry1),
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
          peakWasmHeapMbDelta: 'N/A',
          rssMbDelta: 'N/A',
          peakRssMbDelta: 'N/A',
          heapUsedMbDelta: 'N/A',
          heapTotalMbDelta: 'N/A',
          externalMbDelta: 'N/A',
          arrayBuffersMbDelta: 'N/A',
        });
      }
    }

    for (const filename of Object.keys(data2ByFile)) {
      if (!lookupByFilename(index1, filename)) {
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
          peakWasmHeapMbDelta: 'N/A',
          rssMbDelta: 'N/A',
          peakRssMbDelta: 'N/A',
          heapUsedMbDelta: 'N/A',
          heapTotalMbDelta: 'N/A',
          externalMbDelta: 'N/A',
          arrayBuffersMbDelta: 'N/A',
        });
      }
    }
  }

  return deltas;
}

/**
 * Computes the numeric difference of a field between two entries (entry2 - entry1),
 * or 'N/A' when either side has no measurement.
 *
 * The N/A guard is load-bearing, not defensive. Treating an absent measurement
 * as 0 does not produce a missing number, it produces a WRONG one: a matched
 * row whose newer side has no geometryMemoryMb reported
 * `geometryMemoryMbDelta = -185.836` for SKYLARK250 — a fabricated 100%
 * memory win, on the single model someone would most want a real memory
 * number for. The same coercion made every FAIL row lie: the committed
 * conway0.22.921_0.23.940_delta.csv reports `totalTimeMsDelta = 12` and
 * `Infinity` for bath-csg-solid.ifc going FAIL -> OK, and `0` / `0%` for
 * KIT-Simple-Road-Test-Web-IFC4x3_RC2.ifc failing at both versions — "no
 * change" where the truth is "no data".
 *
 * @param {string} field
 * @param {Object} entry2
 * @param {Object} entry1
 * @returns {number | string} The difference, or 'N/A'.
 */
function computeDelta(field, entry2, entry1) {
  const newVal = parseValue(entry2[field]);
  const oldVal = parseValue(entry1[field]);

  if (newVal === null || oldVal === null) {
    return 'N/A';
  }

  return newVal - oldVal;
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

  // Same reasoning as computeDelta: an absent measurement is not zero.
  if (oldVal === null || newVal === null) {
    return 'N/A';
  }

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
 * Parse a string or number to float, or null when there is no measurement.
 *
 * Returns null — NOT 0 — for absent/'N/A'/unparseable input, so callers can
 * tell "the value is zero" apart from "there is no value". A real 0 is
 * meaningful here: web-ifc rows carry parseTimeMs/geometryTimeMs of literally
 * 0 because that engine does not split the stages.
 *
 * @param {string | number} value
 * @returns {number | null}
 */
function parseValue(value) {
  if (value == null) {
    return null;
  }
  if (typeof value === 'number') {
    return value;
  }
  const trimmed = value.trim();
  if (trimmed === '' || trimmed.toUpperCase() === 'N/A') {
    return null;
  }
  const floatVal = Number(trimmed);
  return isNaN(floatVal) ? null : floatVal;
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
