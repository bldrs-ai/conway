const fs = require('fs');
const { csvRow, parseCsv } = require('./csv_rfc4180.cjs');

/**
 * The two ways the left-hand side of a delta can have been obtained, and the
 * only legal values of the `measurementBasis` column.
 *
 * `crossRun` is the historical shape: `engine1`'s numbers are read out of a
 * `performance-detail.csv` a PREVIOUS run committed, on a machine nobody
 * recorded. That comparison has a measured 13.66% median noise floor —
 * see design/new/perf-run-comparability.md — so a `crossRun` timing row is a
 * lead, not a measurement.
 *
 * `paired` means both sides were measured in ONE job on ONE machine, which
 * cancels the machine factor exactly. What it leaves was measured by an A/A
 * null test (run 33192612782, .github/workflows/perf-aa-null.yml): the corpus
 * AGGREGATE is stable to 0.13-0.24%, but PER MODEL the floor is ~1.4% median
 * absolute change with p10/p90 near -3%/+4%. Read the median of a `paired`
 * file as the gate; a single `paired` row below ~5% is still inside the
 * floor. Those figures are the PUBLIC corpus's (97 of the 99 models the batch
 * walks there); no null test has run against the private corpus, so on a
 * private snapshot they are the best evidence available and not a measured
 * bound — see perf-run-comparability.md Evidence 4, "What this does not
 * bound".
 *
 * The label is per-file, not per-row, but it is written on every row on
 * purpose: rows get copied into summaries, issue comments and spreadsheets
 * without their filename, and the whole reason this column exists is that a
 * cross-run row was being read as signal.
 */
const MEASUREMENT_BASIS = { PAIRED: 'paired', CROSS_RUN: 'crossRun' };

/**
 * Generate a delta CSV from two performance-detail CSV files.
 *
 * @param {string} csvPath1 Path to first CSV file (older run).
 * @param {string} csvPath2 Path to second CSV file (newer run).
 * @param {string} outputCsvPath Where to write the resulting delta CSV.
 * @param {boolean} [isWebIfc=false] If true, compute only selected deltas and output a limited set of columns.
 * @param {string} [measurementBasis='crossRun'] One of MEASUREMENT_BASIS.
 *   Stamped into every row's `measurementBasis` column. A `paired` delta also
 *   DROPS its one-sided rows — see isTwoSided.
 */
function generateDeltaCSV(
    csvPath1, csvPath2, outputCsvPath, isWebIfc = false,
    measurementBasis = MEASUREMENT_BASIS.CROSS_RUN) {
  const data1 = readDataFromCsv(csvPath1);
  const data2 = readDataFromCsv(csvPath2);

  const deltas = computeDeltas(data1, data2, isWebIfc);

  // computeDeltas unions its two inputs, emitting an all-N/A row for a model
  // only one side measured. That is right for `crossRun` — the archive's
  // whole job is continuity, and a model added to or dropped from the corpus
  // between two releases is a fact about the corpus worth carrying — but it
  // is a false claim in a `paired` file, where the label asserts of EVERY ROW
  // that both engines were timed in one job on one machine. A row whose
  // `engine1` is `N/A` was not, so it is absent here rather than present and
  // mislabelled.
  const written = measurementBasis === MEASUREMENT_BASIS.PAIRED ?
    deltas.filter(isTwoSided) :
    deltas;

  writeDataToCsv(written, outputCsvPath, isWebIfc, measurementBasis);
}

/**
 * Did BOTH sides of the delta contribute a row to this one?
 *
 * computeDeltas marks the missing half of a one-sided row by writing `N/A`
 * into every column it would have filled from that side, `engine1`/`engine2`
 * included — and a real detail CSV always names its engine, so those two
 * cells are an unambiguous marker rather than a value that could occur.
 *
 * @param {Object} delta One row as built by computeDeltas.
 * @return {boolean} True when the row differences two measurements.
 */
function isTwoSided(delta) {
  return delta.engine1 !== 'N/A' && delta.engine2 !== 'N/A';
}

/**
 * What each writer's columns mean, as two independent traits (#555, #570
 * review).
 *
 *   harness — which process the row was measured in, and therefore what
 *             else was resident. The three.js harness holds a GL context
 *             and a scene graph the regression children do not, and the
 *             loader builds a `ConwayGeometry` per load where the children
 *             initialise once in `main()` (a ~55-60 MB constant, see
 *             design/new/perf-measurement.md). Every process-level memory
 *             column is scoped to this.
 *   capture — `RegressionCaptureState.memoization`, which decides whether
 *             CSG temporaries are still in `model.geometry` when
 *             `calculateGeometrySize()` sizes it. Only `geometryMemoryMb`
 *             is scoped to this.
 *
 * Two traits rather than one writer-pair list because that is the shape of
 * the underlying causes: `ifc-regression` differs from `ap214-regression`
 * in capture but not harness, and from `loader` in harness but not capture.
 * A flat list of incomparable pairs would have to restate that product.
 */
const WRITER_TRAITS = {
  'ifc-regression': { harness: 'regression', capture: 'full' },
  'ap214-regression': { harness: 'regression', capture: 'optimal' },
  'ifc-cli': { harness: 'cli', capture: 'optimal' },
  'ap214-cli': { harness: 'cli', capture: 'optimal' },
  'loader': { harness: 'three', capture: 'optimal' },
  'ifc-web-ifc-proxy': { harness: 'proxy', capture: 'optimal' },
  'ap214-web-ifc-proxy': { harness: 'proxy', capture: 'optimal' },
};

/**
 * Every column that carries a MEASUREMENT rather than an identity.
 *
 * None of them is comparable across two harnesses, and after three review
 * rounds on this seam that is the whole of the answer rather than a list
 * with exceptions (#570 review, rounds 2 and 3). The matrix converged: **two
 * harnesses cannot be compared at all.** What survives a cross-harness join
 * is `filename`, `loadStatus`, `uname` and `schemaVersion` — which row is
 * which, not what it measured.
 *
 * The three findings that got here, each a different column family and the
 * same root cause — the harnesses bound their intervals and hold their
 * processes differently, and `writer` names the pipeline without saying
 * what its clocks and samples enclosed:
 *
 *   PROCESS MEMORY. A regression child's `rssMb` "excludes a GL context and
 *   a three.js scene graph" (the snapshot README's own words), and the
 *   loader carries a per-load `ConwayGeometry` the children do not.
 *
 *   TOTAL TIME. `ConwayModelLoader` opens `allTimeStart` and THEN builds and
 *   initialises that engine; the regression child initialises in `main()`
 *   and starts its clock immediately before the file read. Engine init is
 *   inside one window and outside the other — measured at ~195 ms, which is
 *   120% of index.ifc's own total, 24% of haus.ifc's and 4.3% of
 *   MB-Khaya's.
 *
 *   STAGE TIME. The child's parse clock opens before `parseHeader`
 *   (ifc_regression_main.ts:475) where the loader times the header
 *   separately and starts its parse clock at `parseDataToModel`
 *   (conway_model_loader.ts:418, :468). The child's geometry clock wraps
 *   `new IfcGeometryExtraction(...)` (:549 around :758) where the loader
 *   constructs it before its clock (:510 against :525) — and that
 *   constructor is not free: two native identity matrices
 *   (`getIdentity2DMatrix` / `getIdentity3DMatrix`) and four memory pools.
 *
 * That last one was left comparable for one round on the grounds that its
 * magnitude was unmeasured. That was the wrong test. **Unmeasured is not
 * zero, and comparability is categorical, not a matter of degree** — the
 * same standard that rejected `parsePlusGeometryMs` as a substitute for
 * `totalTimeMs`. Magnitude decides severity; it does not decide whether two
 * numbers are the same quantity.
 *
 * `geometryMemoryMb` and `peakWasmHeapMb` are in here too, though each is
 * arguably a property of the model rather than of the process. Keeping a
 * two-item exception list would mean a reader has to know which two, and
 * the loader reaches its geometry through a different call
 * (`extractIFCGeometryDataAsync` when cooperative) with its own allocation
 * pattern. One rule that is true beats a shorter one with a footnote.
 */
const MEASUREMENT_COLUMNS = new Set([
  'parseTimeMs', 'geometryTimeMs', 'totalTimeMs', 'parsePlusGeometryMs',
  'geometryMemoryMb', 'peakWasmHeapMb',
  'rssMb', 'peakRssMb', 'heapUsedMb', 'heapTotalMb', 'externalMb',
  'arrayBuffersMb', 'retainedRssMb', 'retainedHeapUsedMb', 'retainedExternalMb',
]);

/**
 * Columns that only mean the same thing within one memoization capture mode,
 * which bites WITHIN a harness — the two regression children are separate
 * processes and only the IFC one raises `RegressionCaptureState.memoization`
 * to FULL.
 *
 * Just the one, and measured rather than assumed: MB-Khaya through a single
 * extraction reads `geometryMemoryMb` 16.82 MB at OPTIMAL against 22.26 MB
 * at FULL.
 *
 * `peakWasmHeapMb` is deliberately NOT here. The same measurement reads it
 * at **101.56 MB under both modes** — the linear memory is a grow-only
 * high-water and the temporaries are allocated either way; FULL only keeps
 * the JS-side handles. RSS moved 1 MB in 516, which is noise. So within a
 * harness it stays comparable.
 */
const CAPTURE_DEPENDENT_COLUMNS = new Set(['geometryMemoryMb']);

/**
 * Which writer produced a legacy row — one with no `writer` column at all,
 * i.e. every snapshot blessed before #555.
 *
 * Provenance IS recoverable, from the column set rather than from prose:
 * `bless_perf_snapshot.cjs` hardcodes `N/A` into `schemaVersion`,
 * `preprocessorVersion` and `originatingSystem` on every row it writes,
 * because perf.csv does not carry them. `benchmark.cjs` scrapes all three
 * out of the IFC header. So a file with ANY populated value in those
 * columns was written by the three.js harness, and one with none was
 * written by a regression child.
 *
 * Decided at FILE level, not per row: a FAIL row from either writer has
 * them all `N/A`, so a per-row test would classify a failed
 * three.js-harness row as a regression row. A file with no populated value
 * anywhere — every model failed — falls through to `regression`, which
 * costs nothing, since such a file has no timing or memory values to
 * difference either.
 *
 * This is inference, so it is confined to one function, applied only where
 * the explicit column is absent, and pinned by tests. It never overrides a
 * stated writer.
 *
 * @param {Array<Object>} rows Every row of one file.
 * @returns {string} A key of WRITER_TRAITS.
 */
function inferLegacyWriter(rows) {
  const scraped = ['schemaVersion', 'preprocessorVersion', 'originatingSystem'];

  for (const row of rows) {
    for (const column of scraped) {
      const value = row[column];
      if (value !== undefined && value !== '' && value !== 'N/A') {
        return 'loader';
      }
    }
  }

  return 'ifc-regression';
}

/**
 * The `writer` a row states, or undefined where it states none.
 *
 * @param {Object} entry A row object.
 * @returns {string | undefined} The writer.
 */
function statedWriter(entry) {
  const writer = entry.writer;

  return writer !== undefined && writer !== '' && writer !== 'N/A' ?
    writer : undefined;
}

/**
 * The traits of the writer behind a row, stated or inferred.
 *
 * @param {Object} entry A row object.
 * @returns {{harness: string, capture: string} | undefined} Traits, or
 * undefined for a writer this script has never heard of — which is treated
 * as "cannot tell", not as "comparable".
 */
function traitsOf(entry) {
  const writer = statedWriter(entry) ?? entry.inferredWriter;

  return writer !== undefined ? WRITER_TRAITS[writer] : undefined;
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

  const rows = records.slice(1).map((row) => {
    const rowObj = {};
    headers.forEach((header, index) => {
      // Trim whitespace for each cell
      rowObj[header] = row[index] !== undefined ? row[index].trim() : '';
    });
    return rowObj;
  });

  // Stamped as a SEPARATE field, never into `writer`: a guess and a
  // statement should not be indistinguishable downstream, and a future
  // reader of a delta should be able to tell which one a decision rested on.
  if (!headers.includes('writer')) {
    const inferred = inferLegacyWriter(rows);

    for (const row of rows) {
      row.inferredWriter = inferred;
    }
  }

  return rows;
}

/**
 * Writes an array of row-objects to CSV.
 * @param {Array<Object>} data
 * @param {string} csvFilename
 * @param {boolean} [isWebIfc=false] If true, use the limited CSV header.
 * @param {string} [measurementBasis='crossRun'] One of MEASUREMENT_BASIS,
 *   stamped into every row's `measurementBasis` column.
 */
function writeDataToCsv(
    data, csvFilename, isWebIfc = false,
    measurementBasis = MEASUREMENT_BASIS.CROSS_RUN) {
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
        'totalTimeMsBasis',
        'comparability',
        'geometryMemoryMbDelta',
        'peakWasmHeapMbDelta',
        'rssMbDelta',
        'peakRssMbDelta',
        'heapUsedMbDelta',
        'heapTotalMbDelta',
        'externalMbDelta',
        'arrayBuffersMbDelta',
        'retainedRssMbDelta',
        'retainedHeapUsedMbDelta',
        'retainedExternalMbDelta',
        'measurementBasis',
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
        'totalTimeMsBasis',
        'comparability',
        'geometryMemoryMbDelta',
        'peakWasmHeapMbDelta',
        'rssMbDelta',
        'peakRssMbDelta',
        'heapUsedMbDelta',
        'heapTotalMbDelta',
        'externalMbDelta',
        'arrayBuffersMbDelta',
        'retainedRssMbDelta',
        'retainedHeapUsedMbDelta',
        'retainedExternalMbDelta',
        'measurementBasis',
      ];

  const lines = [];
  // write the header
  lines.push(csvRow(csvHeader));

  // write each row. `measurementBasis` is stamped here rather than carried on
  // every delta object because it is a property of HOW THE TWO FILES WERE
  // OBTAINED, which computeDeltas cannot see: it is handed two arrays of rows
  // and has no idea whether they came off one machine or two.
  data.forEach((row) => {
    lines.push(csvRow(csvHeader.map((col) => {
      if (col === 'measurementBasis') {
        return measurementBasis;
      }
      return row[col] != null ? row[col] : '';
    })));
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
        const totals = comparableTotals(entry1, entry2);

        deltas.push({
          loadStatus1: entry1.loadStatus,
          loadStatus2: entry2.loadStatus,
          uname: entry1.uname,
          engine1: entry1.engine,
          engine2: entry2.engine,
          filename,
          // The values actually differenced, which are not always the raw
          // `totalTimeMs` cells — see comparableTotals. Reported rather than
          // the raw pair so the printed row is self-consistent: build.yml
          // prints these three columns side by side.
          engine1TotalTimeMs: totals.older,
          engine2TotalTimeMs: totals.newer,
          totalTimeMsDelta: totalsDelta(totals),
          totalTimeMsPercentageChange: totalsPercentage(totals),
          totalTimeMsBasis: totals.basis,
          comparability: comparability(entry1, entry2),
          geometryMemoryMbDelta: computePipelineDelta('geometryMemoryMb', entry2, entry1),
          // A different quantity from geometryMemoryMb, not a rescaling of it:
          // the wasm heap holds allocator overhead and boolean intermediates
          // the payload figure excludes. Also absent before #552.
          peakWasmHeapMbDelta:
            computePipelineDelta('peakWasmHeapMb', entry2, entry1),
          rssMbDelta: computePipelineDelta('rssMb', entry2, entry1),
          // Absent from every snapshot committed before #552; computeDelta
          // reports that as N/A rather than differencing against zero.
          peakRssMbDelta: computePipelineDelta('peakRssMb', entry2, entry1),
          heapUsedMbDelta: computePipelineDelta('heapUsedMb', entry2, entry1),
          heapTotalMbDelta: computePipelineDelta('heapTotalMb', entry2, entry1),
          // Also absent before #552. arrayBuffersMb is a subset of externalMb,
          // so the two deltas are not independent — read them together.
          externalMbDelta: computePipelineDelta('externalMb', entry2, entry1),
          arrayBuffersMbDelta: computePipelineDelta('arrayBuffersMb', entry2, entry1),
          // A delta OF a delta: each side is already retained-minus-baseline
          // for its own run, so this is "did the cycle get leakier". Absent
          // from every snapshot before #554, and N/A in any run whose
          // children had no --expose-gc, both of which computeDelta reports
          // as N/A rather than differencing against zero.
          retainedRssMbDelta: computePipelineDelta('retainedRssMb', entry2, entry1),
          retainedHeapUsedMbDelta:
            computePipelineDelta('retainedHeapUsedMb', entry2, entry1),
          retainedExternalMbDelta:
            computePipelineDelta('retainedExternalMb', entry2, entry1),
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
          totalTimeMsBasis: 'N/A',
          comparability: 'N/A',
          geometryMemoryMbDelta: 'N/A',
          peakWasmHeapMbDelta: 'N/A',
          rssMbDelta: 'N/A',
          peakRssMbDelta: 'N/A',
          heapUsedMbDelta: 'N/A',
          heapTotalMbDelta: 'N/A',
          externalMbDelta: 'N/A',
          arrayBuffersMbDelta: 'N/A',
          retainedRssMbDelta: 'N/A',
          retainedHeapUsedMbDelta: 'N/A',
          retainedExternalMbDelta: 'N/A',
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
          totalTimeMsBasis: 'N/A',
          comparability: 'N/A',
          geometryMemoryMbDelta: 'N/A',
          peakWasmHeapMbDelta: 'N/A',
          rssMbDelta: 'N/A',
          peakRssMbDelta: 'N/A',
          heapUsedMbDelta: 'N/A',
          heapTotalMbDelta: 'N/A',
          externalMbDelta: 'N/A',
          arrayBuffersMbDelta: 'N/A',
          retainedRssMbDelta: 'N/A',
          retainedHeapUsedMbDelta: 'N/A',
          retainedExternalMbDelta: 'N/A',
        });
      }
    }
  } else {
    // Original functionality (compute full delta)
    for (const filename of Object.keys(data1ByFile)) {
      const entry1 = data1ByFile[filename];
      const entry2 = lookupByFilename(index2, filename);

      if (entry2) {
        const totals = comparableTotals(entry1, entry2);
        const totalTimeDelta = totalsDelta(totals);
        const totalTimePercentageChange = totalsPercentage(totals);

        deltas.push({
          timestamp: entry1.timestamp,
          loadStatus1: entry1.loadStatus,
          loadStatus2: entry2.loadStatus,
          uname: entry1.uname,
          engine1: entry1.engine,
          engine2: entry2.engine,
          filename,
          schemaVersion: entry1.schemaVersion,
          // See comparableTotals: not always the raw `totalTimeMs` cells.
          engine1TotalTimeMs: totals.older,
          engine2TotalTimeMs: totals.newer,
          parseTimeMsDelta: computePipelineDelta('parseTimeMs', entry2, entry1),
          geometryTimeMsDelta: computePipelineDelta('geometryTimeMs', entry2, entry1),
          totalTimeMsDelta: totalTimeDelta,
          totalTimeMsPercentageChange: totalTimePercentageChange,
          totalTimeMsBasis: totals.basis,
          comparability: comparability(entry1, entry2),
          geometryMemoryMbDelta: computePipelineDelta('geometryMemoryMb', entry2, entry1),
          // A different quantity from geometryMemoryMb, not a rescaling of it:
          // the wasm heap holds allocator overhead and boolean intermediates
          // the payload figure excludes. Also absent before #552.
          peakWasmHeapMbDelta:
            computePipelineDelta('peakWasmHeapMb', entry2, entry1),
          rssMbDelta: computePipelineDelta('rssMb', entry2, entry1),
          // Absent from every snapshot committed before #552; computeDelta
          // reports that as N/A rather than differencing against zero.
          peakRssMbDelta: computePipelineDelta('peakRssMb', entry2, entry1),
          heapUsedMbDelta: computePipelineDelta('heapUsedMb', entry2, entry1),
          heapTotalMbDelta: computePipelineDelta('heapTotalMb', entry2, entry1),
          // Also absent before #552. arrayBuffersMb is a subset of externalMb,
          // so the two deltas are not independent — read them together.
          externalMbDelta: computePipelineDelta('externalMb', entry2, entry1),
          arrayBuffersMbDelta: computePipelineDelta('arrayBuffersMb', entry2, entry1),
          // A delta OF a delta: each side is already retained-minus-baseline
          // for its own run, so this is "did the cycle get leakier". Absent
          // from every snapshot before #554, and N/A in any run whose
          // children had no --expose-gc, both of which computeDelta reports
          // as N/A rather than differencing against zero.
          retainedRssMbDelta: computePipelineDelta('retainedRssMb', entry2, entry1),
          retainedHeapUsedMbDelta:
            computePipelineDelta('retainedHeapUsedMb', entry2, entry1),
          retainedExternalMbDelta:
            computePipelineDelta('retainedExternalMb', entry2, entry1),
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
          totalTimeMsBasis: 'N/A',
          comparability: 'N/A',
          geometryMemoryMbDelta: 'N/A',
          peakWasmHeapMbDelta: 'N/A',
          rssMbDelta: 'N/A',
          peakRssMbDelta: 'N/A',
          heapUsedMbDelta: 'N/A',
          heapTotalMbDelta: 'N/A',
          externalMbDelta: 'N/A',
          arrayBuffersMbDelta: 'N/A',
          retainedRssMbDelta: 'N/A',
          retainedHeapUsedMbDelta: 'N/A',
          retainedExternalMbDelta: 'N/A',
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
          totalTimeMsBasis: 'N/A',
          comparability: 'N/A',
          geometryMemoryMbDelta: 'N/A',
          peakWasmHeapMbDelta: 'N/A',
          rssMbDelta: 'N/A',
          peakRssMbDelta: 'N/A',
          heapUsedMbDelta: 'N/A',
          heapTotalMbDelta: 'N/A',
          externalMbDelta: 'N/A',
          arrayBuffersMbDelta: 'N/A',
          retainedRssMbDelta: 'N/A',
          retainedHeapUsedMbDelta: 'N/A',
          retainedExternalMbDelta: 'N/A',
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
 * computeDelta, refusing the difference when the two rows were measured
 * somewhere the column does not mean the same thing (#555, #570 review).
 *
 * The trait tables above carry the reasoning; this is only the lookup. A
 * column is withheld when it is scoped to a trait, both sides resolve to a
 * writer, and the two disagree on that trait.
 *
 * **An unresolvable writer withholds nothing.** Legacy rows are inferred
 * (see inferLegacyWriter) so this is rarer than it was, but a writer this
 * script has never heard of — a newer conway writing into an older delta
 * script — leaves the traits undefined, and blanking on that would turn
 * every column of every such delta into N/A. The guard fires only where we
 * positively know two numbers are not the same quantity.
 *
 * @param {string} field
 * @param {Object} entry2
 * @param {Object} entry1
 * @returns {number | string} The difference, or 'N/A'.
 */
function computePipelineDelta(field, entry2, entry1) {
  const traits1 = traitsOf(entry1);
  const traits2 = traitsOf(entry2);

  if (traits1 !== undefined && traits2 !== undefined) {

    // Cross-harness withholds every measurement, not a subset of them.
    if (MEASUREMENT_COLUMNS.has(field) && traits1.harness !== traits2.harness) {
      return 'N/A';
    }

    if (CAPTURE_DEPENDENT_COLUMNS.has(field) &&
        traits1.capture !== traits2.capture) {
      return 'N/A';
    }
  }

  return computeDelta(field, entry2, entry1);
}

/**
 * What a row's `totalTimeMs` actually measures (#562 §1, #570 review).
 *
 * Before #562 the regression children wrote `parseTimeMs + geometryTimeMs`
 * into that column — an identity by construction — while the loader path
 * wrote a real file-read-through-teardown wall clock into the same name.
 * From #562 both write the wall clock and the sum moves to
 * `parsePlusGeometryMs`.
 *
 * So a delta spanning that boundary subtracts two different quantities and
 * reports the difference in methodology as a slowdown. It is not a corner
 * case: it fires on the FIRST bless after #562, on every model, and
 * `.github/workflows/build.yml` sorts its regression table by exactly that
 * column.
 *
 * @param {Object} entry A row object.
 * @returns {string} 'wallClock' or 'stageSum'.
 */
function totalTimeBasis(entry) {
  // The column only exists on a writer that has already split the two, so
  // its presence is direct evidence. Checked before the traits, so a row
  // states its own basis wherever it can.
  if (parseValue(entry.parsePlusGeometryMs) !== null) {
    return 'wallClock';
  }

  // No split column: the three.js harness was always a wall clock (the
  // loader's allTimeStart -> allTimeEnd), a regression child was always the
  // stage sum. An unknown writer is treated as a regression child, which is
  // what every pre-#555 blessed snapshot lacking the scraped columns is.
  const traits = traitsOf(entry);

  return traits !== undefined && traits.harness === 'three' ?
    'wallClock' : 'stageSum';
}

/**
 * The pair of total-time values that are actually comparable between two
 * rows, and which quantity they are.
 *
 * **No total is comparable across two harnesses** (#570 review, round 2).
 * Making `totalTimeMs` a wall clock everywhere did not finish the job #562
 * started, because "wall clock" is itself two quantities: the harnesses
 * bound the interval differently, and `writer` says which pipeline produced
 * a row but not what its clock enclosed.
 *
 * Specifically, `ConwayModelLoader` opens `allTimeStart` and THEN builds and
 * initialises a per-load `ConwayGeometry` (conway_model_loader.ts:158 then
 * :194/:406), while the regression child initialises its engine in `main()`
 * and starts `loadStartMs` immediately before the file read
 * (ifc_regression_main.ts:361 then :454). Engine init is inside one window
 * and outside the other.
 *
 * Measured, because "structurally different" does not say whether it
 * matters: a fresh `new ConwayGeometry()` + `initialize()` runs about
 * **195 ms** (six runs: 178/182/189/195/232/655, the outlier being the
 * first wasm compile). Against the regression child's own totals that is
 * **120% of index.ifc's 162 ms, 24% of haus.ifc's 796 ms and 4.3% of
 * MB-Khaya's 4528 ms**. Differencing across the harnesses reports the
 * removal of engine initialisation as an engine speedup, at a scale far
 * above anything the release table exists to flag.
 *
 * **And `parsePlusGeometryMs` is not the escape hatch**, which was the
 * other candidate. The loader path does not emit it at all (benchmark.cjs
 * writes N/A — it has no such log line), so it would have to be
 * manufactured from a sum; and the stage clocks it would sum are not the
 * same intervals either. The child's parse clock opens before `parseHeader`
 * where the loader times the header separately, and the child's geometry
 * clock wraps `new IfcGeometryExtraction(...)` where the loader constructs
 * it outside. Substituting it would put a smaller version of the same
 * defect back under a new name, which is the thing this file exists to
 * prevent.
 *
 * So the cross-harness cell is blank and says why. The cost is one
 * historical comparison — the transition from `benchmark.cjs`-produced
 * snapshots to bless-produced ones — and that is exactly the comparison
 * that has no answer. Every release from here is regression-against-
 * regression and differences normally.
 *
 * WITHIN one harness the #562 seam still needs bridging, and there the
 * stage sum IS a common quantity: a post-#562 row carries it in
 * `parsePlusGeometryMs` and a pre-#562 regression row carries it in
 * `totalTimeMs`. Preferred over blanking, because the release spanning that
 * change is where a reader most wants to see that nothing moved.
 *
 * `parseTimeMs` and `geometryTimeMs` are deliberately left alone. They
 * carry the smaller boundary differences noted above, but that residual has
 * not been measured and the snapshot README's standing claim is that the
 * stage clocks are broadly comparable — so this withholds what there is
 * evidence for and records the rest as a caveat rather than acting on it.
 *
 * @param {Object} entry1 Older row.
 * @param {Object} entry2 Newer row.
 * @returns {{older: string, newer: string, basis: string}} The values to
 * difference and what they are. `basis` is 'crossHarness' when the two
 * harnesses bound their clocks differently, and 'N/A' when there is no
 * common quantity for some other reason.
 */
function comparableTotals(entry1, entry2) {
  const traits1 = traitsOf(entry1);
  const traits2 = traitsOf(entry2);

  // Both sides must resolve before this can fire, on the same rule the
  // column guard uses: withhold only where we positively know, so an
  // unrecognised writer is "cannot tell" rather than "not comparable".
  if (traits1 !== undefined && traits2 !== undefined &&
      traits1.harness !== traits2.harness) {
    return { older: 'N/A', newer: 'N/A', basis: 'crossHarness' };
  }

  const basis1 = totalTimeBasis(entry1);
  const basis2 = totalTimeBasis(entry2);

  if (basis1 === basis2) {
    return {
      older: entry1.totalTimeMs,
      newer: entry2.totalTimeMs,
      basis: basis1,
    };
  }

  /**
   * A row's stage sum, wherever it holds one.
   *
   * @param {Object} entry The row.
   * @returns {string | undefined} The value, or undefined.
   */
  const stageSum = (entry) => (totalTimeBasis(entry) === 'stageSum' ?
    entry.totalTimeMs : entry.parsePlusGeometryMs);

  const older = stageSum(entry1);
  const newer = stageSum(entry2);

  if (parseValue(older) !== null && parseValue(newer) !== null) {
    return { older, newer, basis: 'stageSum' };
  }

  return { older: 'N/A', newer: 'N/A', basis: 'N/A' };
}

/**
 * Whether two rows are comparable at all, as a cell the reader can see.
 *
 * Every measurement column blanks at once when this reads `crossHarness`,
 * so one cell explains a whole row of `N/A` rather than leaving a reader to
 * guess whether a column was unmeasured, absent from an old snapshot, or
 * incomparable. Those are three different facts and they must not share a
 * spelling — the same obligation #548 established for a missing value.
 *
 * @param {Object} entry1 Older row.
 * @param {Object} entry2 Newer row.
 * @returns {string} 'sameHarness', 'crossHarness' or 'unknown'.
 */
function comparability(entry1, entry2) {
  const traits1 = traitsOf(entry1);
  const traits2 = traitsOf(entry2);

  if (traits1 === undefined || traits2 === undefined) {
    return 'unknown';
  }

  return traits1.harness === traits2.harness ? 'sameHarness' : 'crossHarness';
}

/**
 * The delta of a comparable-total pair.
 *
 * @param {{older: string, newer: string, basis: string}} totals From
 * comparableTotals.
 * @returns {number | string} The difference, or 'N/A'.
 */
function totalsDelta(totals) {
  return totals.basis === 'N/A' || totals.basis === 'crossHarness' ?
    'N/A' :
    computeDelta('value', { value: totals.newer }, { value: totals.older });
}

/**
 * The percentage change of a comparable-total pair.
 *
 * @param {{older: string, newer: string, basis: string}} totals From
 * comparableTotals.
 * @returns {string} The percentage, or 'N/A'.
 */
function totalsPercentage(totals) {
  return totals.basis === 'N/A' || totals.basis === 'crossHarness' ?
    'N/A' : computePercentageChange(totals.older, totals.newer);
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
  if (process.argv.length < 5 || process.argv.length > 7) {
    console.error(
      `Usage: node ${process.argv[1]} <run_name1.csv> <run_name2.csv> <output_csv_filename> [isWebIfc] [measurementBasis]`
    );
    process.exit(1);
  }

  const [ , , runName1, runName2, outputCsv, isWebIfcArg, basisArg ] =
    process.argv;
  const isWebIfc = isWebIfcArg ? true : false;
  // Unknown labels are rejected rather than written through: this column's
  // whole job is to let a reader trust one word, so a typo that lands
  // 'pared' in the archive would be worse than no column.
  const basis = basisArg || MEASUREMENT_BASIS.CROSS_RUN;
  if (!Object.values(MEASUREMENT_BASIS).includes(basis)) {
    console.error(
      `measurementBasis must be one of ${Object.values(MEASUREMENT_BASIS).join('|')}, got '${basis}'.`
    );
    process.exit(1);
  }
  generateDeltaCSV(runName1, runName2, outputCsv, isWebIfc, basis);
}

// Export so we can use from benchmark.js or other modules
// MEASUREMENT_COLUMNS is exported so a test can drive itself from the set
// rather than from a hand-listed copy of it. That is not tidiness: the
// round-3 rule said every measurement blanks across two harnesses, but
// `peakWasmHeapMb` still called computeDelta directly, and the test that
// should have caught it asserted N/A against a fixture whose header did not
// carry the column at all — so it passed because the value was ABSENT, not
// because it was withheld, and could never have failed. A set the test
// iterates cannot drift from the set the code enforces.
module.exports = { generateDeltaCSV, MEASUREMENT_COLUMNS, MEASUREMENT_BASIS };
