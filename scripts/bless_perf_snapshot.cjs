#!/usr/bin/env node

'use strict';

/**
 * Turn the rc-regression run's perf.csv into a blessed benchmark snapshot,
 * and diff it against the previous blessed snapshot.
 *
 * The rc-regression `rebless` job already captures steady per-model timings
 * (`ifc_regression_batch_main --perf`, `--concurrency 1`) but only uploads
 * them as a run artifact, which expires. The blessed baselines it commits
 * therefore had no perf history to compare against — a release's numbers were
 * gone 90 days later, and no delta was ever produced. This writes the run into
 * the model repo under the same `benchmarks/<engine>_<repo>/` convention the
 * committed snapshots already use, then reuses scripts/gen_delta_csv.cjs to
 * emit `<engine1>_<engine2-short>_delta.csv` against the newest snapshot
 * already committed there.
 *
 * TWO COLUMN SETS ARE IN PLAY, and they are not the same file:
 *
 *   perf.csv (input, written by src/ifc/ifc_regression_main.ts)
 *     file,status,parseTimeMs,geometryTimeMs,totalTimeMs,geometryMemoryMb,
 *     rssMb,peakRssMb,heapUsedMb,heapTotalMb
 *
 *   performance-detail.csv (output, the committed convention)
 *     timestamp,loadStatus,uname,engine,filename,schemaVersion,parseTimeMs,
 *     geometryTimeMs,totalTimeMs,geometryMemoryMb,rssMb,peakRssMb,heapUsedMb,
 *     heapTotalMb,preprocessorVersion,originatingSystem
 *
 * The three columns perf.csv does not carry (schemaVersion,
 * preprocessorVersion, originatingSystem) are written as N/A rather than
 * omitted, so the file keeps the 16-column shape every existing consumer and
 * GitHub's CSV viewer expect. None of the three reaches the delta:
 * preprocessorVersion/originatingSystem are not in its column set, and
 * schemaVersion is carried through as a label.
 *
 * PEAK vs INSTANT (conway#552). `peakRssMb` is the child process's kernel
 * high-water mark; `rssMb`/`heapUsedMb`/`heapTotalMb` are single samples taken
 * at the end of the load with no GC first. They are not interchangeable — see
 * the column-by-column note on writePerfCsvIfRequested in
 * src/ifc/ifc_regression_main.ts.
 *
 * OLD SNAPSHOTS LACK `peakRssMb`, and `geometryMemoryMb` was N/A on every
 * conway-native snapshot before #552. gen_delta_csv.cjs propagates an absent
 * measurement instead of coercing it to 0, so those deltas read N/A rather
 * than a number. That guard is why baselines do not need re-blessing here.
 * Coercion is not a hypothetical: it produced a fabricated
 * `geometryMemoryMbDelta = -185.836` for SKYLARK250 — the entire baseline
 * allocation reported as a memory win (#548).
 *
 * HARNESS BOUNDARY. The committed `conway<version>-ci_*` snapshots to date
 * were produced by scripts/benchmark.cjs driving headless-three, i.e. conway
 * loading inside a three.js host. This produces conway-native CLI numbers.
 * parse/geometry/total are conway's own stage timings in both cases and are
 * broadly comparable on the same runner class, but the memory columns are
 * not: `rssMb` here excludes a GL context and a three.js scene graph, and
 * `geometryMemoryMb`, while measured on both sides now, counts only conway's
 * own vertex+index payload — the three.js host's copy of the same geometry is
 * not in it. The README written alongside the snapshot records which harness
 * produced it so nobody differences across the boundary without seeing it.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const { csvRow, parseCsv } = require('./csv_rfc4180.cjs');
const { generateDeltaCSV } = require('./gen_delta_csv.cjs');

const DETAIL_COLUMNS = [
  'timestamp', 'loadStatus', 'uname', 'engine', 'filename', 'schemaVersion',
  'parseTimeMs', 'geometryTimeMs', 'totalTimeMs', 'geometryMemoryMb',
  'rssMb', 'peakRssMb', 'heapUsedMb', 'heapTotalMb', 'preprocessorVersion',
  'originatingSystem',
];

/** Columns perf.csv does not measure; written as N/A to keep the 15-column shape. */
const UNMEASURED = 'N/A';

/**
 * Compare two dotted numeric version strings.
 *
 * @param {string} a Left version, e.g. '0.23.940'.
 * @param {string} b Right version.
 * @return {number} Negative if a < b, positive if a > b, 0 if equal.
 */
function versionCompare(a, b) {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);
  const len = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < len; i++) {
    const diff = (aParts[i] || 0) - (bParts[i] || 0);
    if (diff !== 0) {
      return diff;
    }
  }
  return 0;
}

/**
 * Read perf.csv into row objects keyed by its own header.
 *
 * @param {string} perfPath Path to the run's perf.csv.
 * @return {Array<Object>} One object per measured model.
 */
function readPerfCsv(perfPath) {
  const records = parseCsv(fs.readFileSync(perfPath, 'utf8'));

  if (records.length < 2) {
    return [];
  }

  const headers = records[0].map((h) => h.trim());

  return records.slice(1).map((row) => {
    const entry = {};
    headers.forEach((header, index) => {
      entry[header] = row[index] !== undefined ? row[index].trim() : '';
    });
    return entry;
  });
}

/**
 * Write the run as a performance-detail.csv.
 *
 * @param {Array<Object>} rows perf.csv row objects.
 * @param {string} outPath Destination performance-detail.csv.
 * @param {string} engine Engine label for the `engine` column.
 * @param {string} timestamp Run timestamp, YYYYMMDDHHMMSS.
 * @return {number} Number of model rows written.
 */
function writeDetailCsv(rows, outPath, engine, timestamp) {
  const lines = [csvRow(DETAIL_COLUMNS)];

  for (const row of rows) {
    lines.push(csvRow([
      timestamp,
      row.status || UNMEASURED,
      os.arch(),
      engine,
      // The committed snapshots URL-encode the filename, and the delta joins
      // on it — an unencoded name would not match the baseline's row.
      encodeURIComponent(row.file || ''),
      UNMEASURED,
      row.parseTimeMs || UNMEASURED,
      row.geometryTimeMs || UNMEASURED,
      row.totalTimeMs || UNMEASURED,
      // Absent from every perf.csv written before #552, and from FAIL rows,
      // which is why this reads the column instead of assuming it.
      row.geometryMemoryMb || UNMEASURED,
      row.rssMb || UNMEASURED,
      row.peakRssMb || UNMEASURED,
      row.heapUsedMb || UNMEASURED,
      row.heapTotalMb || UNMEASURED,
      UNMEASURED,
      UNMEASURED,
    ]));
  }

  fs.writeFileSync(outPath, `${lines.join('\n')}\n`, 'utf8');
  return rows.length;
}

/**
 * Find the newest already-committed snapshot that PRECEDES this version.
 *
 * Only `conway<version>_<repo>` / `conway<version>-<suffix>_<repo>` names are
 * considered, and a candidate must sort strictly below `version`.
 *
 * The strict upper bound is the point. Excluding only the directory being
 * written is not enough: re-running an older `rc-*` tag after a newer release
 * has been blessed would find the newer directory eligible, take it as the
 * maximum, and write `conway1.600.1600-ci_1.543.1513_delta.csv` into the OLDER
 * release's own record — a delta claiming that release changed relative to its
 * own future. Bounding by version also subsumes the self-exclusion (a
 * directory cannot sort strictly below its own version), but `selfDirName` is
 * still passed and skipped so a same-version directory under a different name
 * cannot be picked either.
 *
 * Comparison is versionCompare, i.e. numeric per component. Lexicographic
 * order is wrong here and has bitten this repo before (#533): `1.394.1504`
 * sorts BELOW `1.530.1503` numerically but ABOVE it as a string, and both
 * spellings exist in the corpus.
 *
 * @param {string} benchmarksDir The repo's benchmarks/ directory.
 * @param {string} selfDirName Name of the directory this run is writing.
 * @param {string} version Version being blessed, e.g. '1.543.1513'.
 * @return {{name: string, version: string, engine: string} | null} Newest
 *   snapshot strictly below `version`, or null when there is none.
 */
function findPreviousSnapshot(benchmarksDir, selfDirName, version) {
  if (!fs.existsSync(benchmarksDir)) {
    return null;
  }

  const candidates = [];

  for (const entry of fs.readdirSync(benchmarksDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === selfDirName) {
      continue;
    }

    const match = entry.name.match(/^conway(\d+(?:\.\d+)*)(-[^_]+)?_/);
    if (!match) {
      continue;
    }

    // Strictly below, so a newer blessed release can never be reported as the
    // predecessor of an older one.
    if (versionCompare(match[1], version) >= 0) {
      continue;
    }

    if (!fs.existsSync(path.join(benchmarksDir, entry.name, 'performance-detail.csv'))) {
      continue;
    }

    candidates.push({
      name: entry.name,
      version: match[1],
      engine: `conway${match[1]}${match[2] || ''}`,
    });
  }

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => versionCompare(a.version, b.version));
  return candidates[candidates.length - 1];
}

/**
 * Is `name` a chronological conway-to-conway delta for THIS release?
 *
 * Matches `conway<engine1>_<version>_delta.csv`, i.e. the naming convention
 * `main` writes, with this release's own version on the right-hand side.
 *
 * Deliberately narrow, because this predicate authorises deletion:
 *
 *   conway0.22.921_0.23.940_delta.csv        -> true  for 0.23.940
 *   conway1.451.1357-ci_1.543.1513_delta.csv -> true  for 1.543.1513
 *   webifc0.0.67_conway0.23.940_delta.csv    -> FALSE, does not start `conway`
 *   performance-detail.csv / performance.csv -> false
 *   README.md / index.html / 00-*.log.txt    -> false
 *   conway0.22.921_0.23.940_delta.csv        -> FALSE for 1.543.1513
 *
 * The webifc case is the one that matters: a release directory legitimately
 * holds one chronological delta AND one cross-engine delta per web-ifc version
 * — conway0.23.940_test-models/ ships all three today — and those are a
 * different comparison that this script does not own and must not touch.
 *
 * @param {string} name A directory entry name.
 * @param {string} version Version being blessed, e.g. '1.543.1513'.
 * @return {boolean} True when the file is this release's chronological delta.
 */
function isChronologicalDelta(name, version) {
  const match = name.match(/^conway([^_]+)_(.+)_delta\.csv$/);

  return match !== null && match[2] === version;
}

/**
 * Remove this release's chronological delta(s) before writing the new one.
 *
 * The predecessor is not fixed for a given release: re-running an already
 * blessed rc after an intermediate older snapshot has been backfilled selects
 * a different predecessor and writes a differently NAMED file. Without this,
 * the old one survives — the workflow stages the whole `benchmarks` directory
 * — and the release ends up permanently carrying two deltas against different
 * predecessors, while its regenerated README names only one of them. Whichever
 * a reader opened would look authoritative.
 *
 * @param {string} outDir This release's snapshot directory.
 * @param {string} version Version being blessed.
 * @return {Array<string>} Names removed, for logging.
 */
function removeStaleDeltas(outDir, version) {
  const removed = [];

  for (const name of fs.readdirSync(outDir)) {
    if (!isChronologicalDelta(name, version)) {
      continue;
    }

    fs.rmSync(path.join(outDir, name), { force: true });
    removed.push(name);
  }

  return removed;
}

/**
 * README recording which harness produced the snapshot.
 *
 * @param {Object} info Snapshot description.
 * @param {string} info.engine Engine label.
 * @param {string} info.repoName Model repo directory name.
 * @param {number} info.modelCount Models measured.
 * @param {string} info.deltaName Delta filename, or '' when none was produced.
 * @param {string} info.previousName Previous snapshot directory, or ''.
 * @return {string} README body.
 */
function renderReadme(info) {
  const deltaLine = info.deltaName !== '' ?
    `\`${info.deltaName}\` diffs this run against \`../${info.previousName}/\`.` :
    'No previous snapshot was committed in this repo, so no delta was produced.';

  return `# ${info.engine} — ${info.repoName}, rc-regression baseline

Steady per-model load timings captured by the \`rebless\` job of conway's
\`rc-regression\` workflow, over the full corpus at \`--concurrency 1\`.

${info.modelCount} models measured. ${deltaLine}

## Harness

Produced by \`ifc_regression_batch_main --perf\` — conway loading in a plain
node process. This is **not** the same harness as the older
\`conway<version>-ci_*\` snapshots, which ran \`scripts/benchmark.cjs\` against
headless-three, i.e. conway inside a three.js host.

\`parseTimeMs\` / \`geometryTimeMs\` / \`totalTimeMs\` are conway's own stage
timings in both harnesses and are broadly comparable on the same runner class.
The memory columns are not: \`rssMb\` here excludes a GL context and a three.js
scene graph, and \`geometryMemoryMb\` counts only conway's own vertex+index
payload, without the host's copy of the same geometry. \`schemaVersion\`,
\`preprocessorVersion\` and \`originatingSystem\` are \`N/A\` — the conway-native
perf writer does not capture them.

\`peakRssMb\` is the load's high-water mark (the kernel's, via
\`resourceUsage().maxRSS\`); \`rssMb\`, \`heapUsedMb\` and \`heapTotalMb\` are
single samples taken at the end of the load with no GC first. Do not read the
instants as peaks, or \`heapUsedMb\` as a live set — it includes garbage GC has
not collected.

Snapshots blessed before conway#552 carry neither \`peakRssMb\` nor a measured
\`geometryMemoryMb\`, so those columns come out \`N/A\` in a delta against them.
That is a missing measurement, not a zero: do not read it as "no change".

## Regenerating

Push an \`rc-*\` tag.

To re-run without cutting a tag: Actions → *RC regression (full corpus +
baseline bless)* → Run workflow, and in **"Use workflow from"** pick the
\`rc-*\` **tag**, not a branch. The snapshot step gates on the ref being an
\`rc-*\` tag — it takes the version from the tag name and has nothing to name the
directory after otherwise — so dispatching from \`main\` runs the digest
regression and **silently skips the perf snapshot**, finishing green having
regenerated nothing. It says so in the job log:

    ::notice::Ref 'main' is not an rc-* tag; skipping the blessed perf snapshot.

If this directory is what you came to regenerate, that notice is the thing to
check for.
`;
}

/** Entry point. */
function main() {
  const [, , perfPath, modelsRoot, version, repoName] = process.argv;

  if (!perfPath || !modelsRoot || !version || !repoName) {
    console.error(
      `Usage: node ${path.basename(process.argv[1])} ` +
      '<perf.csv> <models-checkout-root> <conway-version> <repo-name>');
    process.exit(1);
  }

  if (!fs.existsSync(perfPath)) {
    console.warn(`No perf CSV at ${perfPath}; nothing to bless.`);
    return;
  }

  const rows = readPerfCsv(perfPath);
  if (rows.length === 0) {
    console.warn(`${perfPath} has no model rows; nothing to bless.`);
    return;
  }

  const engine = `conway${version}-ci`;
  const dirName = `${engine}_${repoName}`;
  const benchmarksDir = path.join(modelsRoot, 'benchmarks');
  const outDir = path.join(benchmarksDir, dirName);

  fs.mkdirSync(outDir, { recursive: true });

  const timestamp =
    new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
  const detailPath = path.join(outDir, 'performance-detail.csv');
  const modelCount = writeDetailCsv(rows, detailPath, engine, timestamp);
  console.log(`Wrote ${modelCount} rows to ${detailPath}`);

  // Before choosing a predecessor, not after: the new delta may be named
  // differently from the committed one, so writing first and cleaning second
  // would delete the file just written.
  const removed = removeStaleDeltas(outDir, version);
  if (removed.length > 0) {
    console.log(`Removed superseded delta(s): ${removed.join(', ')}`);
  }

  const previous = findPreviousSnapshot(benchmarksDir, dirName, version);
  let deltaName = '';

  if (previous === null) {
    // Correct, not a fallback: the first blessed release in a repo, or a
    // re-run of the oldest one, genuinely has no predecessor. Emitting no
    // delta is right; reaching for the nearest snapshot in either direction
    // would manufacture a comparison nobody asked for.
    console.warn(
      `No snapshot below ${version} in ${benchmarksDir}; delta not generated.`);
  } else {
    // Convention from the committed deltas, e.g.
    // conway0.22.921_0.23.940_delta.csv — engine1 in full, engine2 as the
    // bare version.
    deltaName = `${previous.engine}_${version}_delta.csv`;
    const deltaPath = path.join(outDir, deltaName);
    const previousDetail =
      path.join(benchmarksDir, previous.name, 'performance-detail.csv');

    // A delta failure must not lose the snapshot itself: the perf rows are
    // the run's only durable record once the artifact expires, and they are
    // already on disk by this point.
    try {
      generateDeltaCSV(previousDetail, detailPath, deltaPath);
      console.log(
        `Wrote delta ${deltaPath} (${previous.name} -> ${dirName})`);
    } catch (e) {
      console.warn(`Failed to generate delta: ${e.message}`);
      deltaName = '';
    }
  }

  fs.writeFileSync(
    path.join(outDir, 'README.md'),
    renderReadme({
      engine,
      repoName,
      modelCount,
      deltaName,
      previousName: previous !== null ? previous.name : '',
    }),
    'utf8');
}

if (require.main === module) {
  main();
}

module.exports = {
  DETAIL_COLUMNS,
  findPreviousSnapshot,
  isChronologicalDelta,
  removeStaleDeltas,
  readPerfCsv,
  versionCompare,
  writeDetailCsv,
};
