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
 *     file,status,writer,parseTimeMs,geometryTimeMs,totalTimeMs,
 *     parsePlusGeometryMs,geometryMemoryMb,
 *     peakWasmHeapMb,rssMb,peakRssMb,heapUsedMb,heapTotalMb,externalMb,
 *     arrayBuffersMb,retainedRssMb,retainedHeapUsedMb,retainedExternalMb
 *
 *   performance-detail.csv (output, the committed convention)
 *     timestamp,loadStatus,writer,uname,engine,filename,schemaVersion,
 *     parseTimeMs,geometryTimeMs,totalTimeMs,parsePlusGeometryMs,
 *     geometryMemoryMb,peakWasmHeapMb,rssMb,
 *     peakRssMb,heapUsedMb,heapTotalMb,externalMb,arrayBuffersMb,
 *     retainedRssMb,retainedHeapUsedMb,retainedExternalMb,
 *     preprocessorVersion,originatingSystem
 *
 * The three columns perf.csv does not carry (schemaVersion,
 * preprocessorVersion, originatingSystem) are written as N/A rather than
 * omitted, so the file keeps a fixed column shape every existing consumer and
 * GitHub's CSV viewer expect. None of the three reaches the delta:
 * preprocessorVersion/originatingSystem are not in its column set, and
 * schemaVersion is carried through as a label.
 *
 * WHICH PIPELINE PRODUCED THE ROW (conway#555). `writer` names it, and it is
 * not decoration: `geometryMemoryMb` and the three retention columns mean
 * different things per pipeline, so a delta that joins a CLI-produced
 * snapshot against a regression-produced one reports a ~30% geometry-memory
 * change that is pure methodology (MB-Khaya 16.8 vs 22.3 MB — the IFC
 * regression child runs at FULL memoization capture and keeps CSG
 * temporaries in the map `calculateGeometrySize()` sums). Rows written here
 * carry whatever the child reported; rows from an older snapshot have no
 * `writer` at all, and gen_delta_csv.cjs treats an unknown writer as
 * comparable rather than refusing every historical delta.
 *
 * TOTAL IS A WALL CLOCK (conway#562). `totalTimeMs` used to be
 * `parseTimeMs + geometryTimeMs` by construction on the regression children
 * — verified at 0-5 ms of slack across all 46 OK rows of the blessed 1.451
 * snapshot — while meaning a real file-read-through-teardown wall clock on
 * the loader path. It is the wall clock on both now, and `parsePlusGeometryMs`
 * carries the sum. The `totalTimeMs` column therefore MOVES ONCE, upward, on
 * regression-produced rows; older snapshots difference against it as a
 * change of methodology, not of the engine.
 *
 * PEAK vs INSTANT (conway#552). `peakRssMb` is the child process's kernel
 * high-water mark; `rssMb`/`heapUsedMb`/`heapTotalMb`/`externalMb`/
 * `arrayBuffersMb` are single samples taken at the end of the load with no GC
 * first. They are not interchangeable, `arrayBuffersMb` is a subset of
 * `externalMb`, and no JS-side sum of them sees the wasm heap. `peakWasmHeapMb`
 * is the column that does: emscripten's linear memory is grow-only, so a
 * single reading of it is already the high-water mark. It is a THIRD quantity,
 * distinct from `geometryMemoryMb` (the vertex+index payload) by an order of
 * magnitude — see the column-by-column note on writePerfCsvIfRequested in
 * src/ifc/ifc_regression_main.ts.
 *
 * PEAK vs DELTA (conway#554). `retainedRssMb`/`retainedHeapUsedMb`/
 * `retainedExternalMb` are none of the above: each is a settled sample taken
 * after the model was torn down minus a settled sample taken before the load
 * began, so they answer "do we leak?" where every other memory column answers
 * "does this survive?". They are signed, and `N/A` wherever the child ran
 * without `--expose-gc` to settle with. There is no `retainedWasmHeapMb`
 * because the wasm heap is grow-only and would just restate the peak.
 *
 * OLD SNAPSHOTS LACK the #554 retention columns as well as
 * `peakWasmHeapMb`/`peakRssMb`/`externalMb`/
 * `arrayBuffersMb`, and
 * `geometryMemoryMb` was N/A on every
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
const { execFileSync } = require('child_process');

const { csvRow, parseCsv } = require('./csv_rfc4180.cjs');
const { generateDeltaCSV, MEASUREMENT_BASIS } = require('./gen_delta_csv.cjs');

// Ordering lives in version_order.cjs, shared with run_gen_deltas.cjs so the
// two tools agree about which snapshot is newer. This used to be a local
// `split('.').map(Number)` with each component guarded by `|| 0`. `version`
// here comes straight off the rc-* tag, so since conway#533 it can be
// `1.1556.546-g3eae7637` — and `Number('546-g3eae7637')` is NaN, which `|| 0`
// coerced to 0. The gate in findPreviousSnapshot() stayed an ordinary number
// throughout; what broke is that the version being blessed READ AS `1.1556.0`,
// so a legitimate predecessor like `1.1556.100` failed the "strictly below"
// bound and was silently discarded — leaving an older snapshot, or none, as
// the predecessor. (Nothing could be wrongly ADMITTED as a predecessor: a
// bound that reads as .0 only ever rejects too much.)
const { versionCompare } = require('./version_order.cjs');

const DETAIL_COLUMNS = [
  'timestamp', 'loadStatus', 'writer', 'uname', 'engine', 'filename',
  'schemaVersion',
  'parseTimeMs', 'geometryTimeMs', 'totalTimeMs', 'parsePlusGeometryMs',
  'geometryMemoryMb',
  'peakWasmHeapMb', 'rssMb', 'peakRssMb', 'heapUsedMb', 'heapTotalMb',
  'externalMb', 'arrayBuffersMb', 'retainedRssMb', 'retainedHeapUsedMb',
  'retainedExternalMb', 'preprocessorVersion', 'originatingSystem',
];

/** Columns perf.csv does not measure; written as N/A to keep the 22-column shape. */
const UNMEASURED = 'N/A';

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
 * Read a one-model-per-line list in `regression/smoke_models.txt`'s format:
 * basenames with extensions, `#` comments and blank lines ignored.
 *
 * @param {string} listPath Path to the list.
 * @return {Array<string>} Model basenames, in file order.
 */
function readModelList(listPath) {
  return fs.readFileSync(listPath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'));
}

/** Model extensions the regression batch walks, from SUPPORTED_MODEL_EXTENSIONS. */
const MODEL_EXTENSIONS = ['.ifc', '.stp', '.step'];

/**
 * Every model in the corpus, walked the way the regression batch walks it.
 *
 * Mirrors `collectIFCFiles()` in src/ifc/ifc_regression_batch_main.ts: a
 * recursive readdir where the exclude regex is tested against each resolved
 * path BEFORE the directory/file split, so it prunes directories as well as
 * files, and a file counts as a model on its lowercased extension alone.
 *
 * It exists so `pairedCoverage()` can be told what the corpus holds by
 * something NEITHER PERF PASS PRODUCED. Both passes run the same batch driver
 * over the same tree and share its failure modes, so a model whose child is
 * killed in both is absent from both outputs — and an expected set read off
 * either output cannot see that it is short. The filesystem can.
 *
 * @param {string} rootDir Corpus root, the same path the batch was given.
 * @param {RegExp|undefined} excludeRegex Exclude filter, or undefined for
 *   none. An absent filter over-collects (the excluded models show up as
 *   expected and then as missing), which degrades the paired gate loudly
 *   rather than narrowing it silently.
 * @return {Array<string>} Model paths, in walk order.
 */
function collectCorpusModels(rootDir, excludeRegex) {
  const found = [];

  /**
   * @param {string} currentPath Directory to descend into.
   */
  function walk(currentPath) {
    const items = fs.readdirSync(currentPath, { withFileTypes: true });

    items.sort((a, b) => (a.name > b.name ? 1 : -1));

    for (const item of items) {
      const resolved = path.join(currentPath, item.name);

      if (excludeRegex && excludeRegex.test(resolved)) {
        continue;
      }

      if (item.isDirectory()) {
        walk(resolved);
      } else if (MODEL_EXTENSIONS.includes(path.extname(resolved).toLowerCase())) {
        found.push(resolved);
      }
    }
  }

  walk(rootDir);

  return found;
}

/**
 * The `file` values of the rows a perf pass actually MEASURED.
 *
 * `status` is the regression child's own verdict, and a `FAIL` row is a row:
 * both children write one when the parse returns no model
 * (`ifc_regression_main.ts` / `ap214_regression_main.ts`, the `model === void
 * 0` arm) and when extraction returns no scene, with the stages the load
 * never reached carried as `N/A`. So a failed load leaves a filename behind
 * in the perf CSV exactly as a successful one does, and a coverage check
 * keyed on the filename alone counts it as measured — while the paired delta
 * built from those two rows carries `N/A` for every timing column and
 * contributes nothing to the median the release is gated on.
 *
 * Anything that is not exactly `OK` is not a measurement here. That includes
 * a row with no `status` column at all: this reads a perf.csv the batch just
 * wrote, so an absent status means an input shape this script does not know,
 * and silently promoting it to `OK` would put the failure it is looking for
 * back in the covered set.
 *
 * @param {Array<Object>} rows perf.csv row objects.
 * @return {Array<string>} `file` values of the `OK` rows, duplicates kept.
 */
function okFiles(rows) {
  return rows
    .filter((row) => (row.status || '').trim() === 'OK')
    .map((row) => row.file || '');
}

/**
 * Which models the paired delta was SUPPOSED to cover, and which it misses.
 *
 * This is the gate's own integrity check, and it exists because nothing
 * upstream of here fails loudly when a perf pass loses models. A per-model
 * child that times out or is killed is recorded as a failure by `runForFile()`
 * with no per-file perf CSV to its name; `aggregatePerfCsvs()` then writes the
 * rows that DID survive and the batch ends `process.exit(0)`. So a truncated
 * `perf-paired.csv` is indistinguishable from a complete one by existence, by
 * exit status, or by "has at least one row" — and a paired delta over a
 * silently reduced corpus is worse than no paired delta at all, because the
 * README and the job summary present it as the release gate.
 *
 * A SET, not a count. Two children failing while two models the pin's walk
 * newly sees are added leaves the count intact and the comparison different;
 * the set difference also names what is missing, which is what makes the
 * degrade message actionable.
 *
 * WHAT IS EXPECTED comes from the CORPUS WALK, not from either pass. An
 * earlier revision read it off the blessed pass's own rows, on the reasoning
 * that both passes walk the same tree under the same exclude regex — which is
 * exactly why that was wrong: sharing a driver means sharing its failure
 * modes, so a model whose child dies in BOTH passes is absent from both row
 * sets, the difference is empty, and a paired median over a quietly smaller
 * corpus is published looking complete. `collectCorpusModels()` reads the
 * filesystem, which neither pass wrote.
 *
 * WHAT COUNTS AS COVERED is a model BOTH passes measured, because that is
 * exactly the set of rows a paired delta contains — `generateDeltaCSV` drops
 * one-sided rows under `MEASUREMENT_BASIS.PAIRED`, so a model only the paired
 * pass timed contributes nothing to the file this check is guarding.
 *
 * A `FAIL` ROW IS NOT A MEASUREMENT, AND IT IS NOT A LOSS EITHER. Both
 * regression children write a perf row on their failure paths (see
 * `okFiles`), so a model that neither engine could load is present in both
 * CSVs, survives `isTwoSided`, and reaches the paired delta with `N/A` in
 * every timing column. Counting it as covered lets the gate declare complete
 * coverage while its median is computed over fewer models than the count
 * beside it implies. It is reported as its OWN category rather than folded
 * into `missing`, and deliberately does not degrade the delta: `missing` is a
 * child that vanished — evidence the pass itself is untrustworthy — whereas a
 * `FAIL` is a load the harness ran and reported on. The case that makes the
 * distinction load-bearing is conway#634, a corpus model the published pin
 * cannot load at all: it will FAIL on the paired side of every release until
 * that lands, so degrading here would withhold the gate indefinitely for a
 * reason #634 owns. The count travels into the README and the job summary
 * instead, so the gate's real size is stated rather than implied.
 *
 * A smoke list narrows the demand (the `smoke` scope runs the paired pass over
 * `regression/smoke_models.txt` only). It narrows against the corpus, and an
 * entry matching nothing in the corpus is reported rather than dropped: a list
 * that names models which are not there is a misconfiguration, and silently
 * shrinking the gate to whatever happened to match is the failure mode this
 * whole check exists to prevent.
 *
 * Keyed on the perf CSV's `file` column, which the regression child writes as
 * `path.basename()`, so it is cwd-independent — the paired pass runs from
 * inside the installed package and the blessed pass from the workspace root.
 * That makes two corpus models sharing a basename indistinguishable here, and
 * the corpus has a live pair (`ifc/index.ifc` and `ifc/bldrs/index.ifc`), so
 * `collisions` reports them and the caller degrades. See conway#633 for the
 * real fix — path-qualified identities across the perf CSVs and the digest
 * stems — after which this field and its branch can go.
 *
 * @param {Array<string>} corpusModels Model paths from collectCorpusModels().
 * @param {Array<Object>} blessedRows perf.csv rows for this release.
 * @param {Array<Object>} pairedRows perf.csv rows from the previous pin.
 * @param {string} smokeListPath Model list narrowing the demand, or '' for
 *   "the whole corpus".
 * @return {{expected: Array<string>, missing: Array<string>,
 *   failed: Array<string>, listError: string, unmatched: Array<string>,
 *   collisions: Array<string>}}
 *   `missing` is empty on full coverage. `failed` names the expected models
 *   both passes produced a row for where at least one side is not `OK` —
 *   covered by the delta's row set, absent from its numbers. The other
 *   three
 *   are reasons the coverage cannot be verified at all rather than
 *   shortfalls: `listError` names a smoke list that could not be read,
 *   `unmatched` the smoke entries no corpus model matched, `collisions` the
 *   expected basenames more than one corpus model writes.
 */
function pairedCoverage(corpusModels, blessedRows, pairedRows, smokeListPath) {
  const measured = new Set(pairedRows.map((row) => row.file || ''));
  const blessed = new Set(blessedRows.map((row) => row.file || ''));
  // Present-and-measured, kept apart from present-at-all: the difference
  // between the two is `failed`, and folding it into either one loses the
  // distinction the caller acts on.
  const measuredOk = new Set(okFiles(pairedRows));
  const blessedOk = new Set(okFiles(blessedRows));

  // basename -> the corpus paths that write it, so a collision is visible.
  const corpus = new Map();

  for (const modelPath of corpusModels) {
    const name = path.basename(modelPath);

    corpus.set(name, [...(corpus.get(name) || []), modelPath]);
  }

  let expected = [...corpus.keys()];
  let unmatched = [];

  if (smokeListPath !== '') {
    if (!fs.existsSync(smokeListPath)) {
      return {
        expected: [], missing: [], failed: [], listError: smokeListPath,
        unmatched: [], collisions: [],
      };
    }

    const listed = readModelList(smokeListPath);

    expected = listed.filter((name) => corpus.has(name));
    unmatched = listed.filter((name) => !corpus.has(name)).sort();
  }

  return {
    expected,
    missing: expected.filter(
      (name) => !measured.has(name) || !blessed.has(name)).sort(),
    // Only models BOTH passes produced a row for: a model missing from a
    // pass is `missing`, and reporting it here as well would double-count
    // one model against two different remedies.
    failed: expected.filter(
      (name) => measured.has(name) && blessed.has(name) &&
        !(measuredOk.has(name) && blessedOk.has(name))).sort(),
    listError: '',
    unmatched,
    collisions: expected.filter((name) => corpus.get(name).length > 1).sort(),
  };
}

/** How many missing model names a degrade message spells out before eliding. */
const MAX_NAMED_MISSING = 10;

/**
 * The corpus the A/A null test measured the paired configuration's floor on,
 * as the repo directory name this script is passed — rc-regression.yml hands
 * it the last path segment of the matrix target's repo.
 *
 * `.github/workflows/perf-aa-null.yml` hardcodes `bldrs-ai/test-models`, and
 * the floor it produced is a property of that corpus on that runner — not of
 * pairing in the abstract. Every other target's README has to say so rather
 * than inherit the number, so this is compared against, never assumed.
 */
const AA_NULL_CORPUS = 'test-models';

/**
 * The commit of that corpus the floor was measured over, short-form, as
 * `perf-aa-null.yml` resolved `TEST_MODELS_REF` for run 33192612782.
 *
 * The floor is a property of a MODEL SET, not of a repo name, and the two
 * workflows do not agree on how they get one: `perf-aa-null.yml` pins its
 * checkout (`ref: ${{ steps.tmsha.outputs.sha }}`), while `rc-regression.yml`
 * checks the matrix target out with no `ref:` at all, i.e. whatever its
 * default branch holds at release time. So a snapshot can be the public
 * corpus by name and a different set of models by content, and nothing in
 * either job compares the two. The README states both commits instead of
 * asserting "same models" off a matching directory name.
 */
const AA_NULL_CORPUS_SHA = 'baf0f87d';

/**
 * The commit the model corpus is checked out at, short-form.
 *
 * Read off the checkout rather than passed down from the workflow so there is
 * no second place for it to go stale. Best-effort on purpose: a models root
 * that is not a git checkout (a local bless over a plain directory, every
 * unit test) yields '', and the README then says the commit is unrecorded
 * rather than a release failing over a missing `.git`.
 *
 * @param {string} modelsRoot Path the corpus was checked out into.
 * @return {string} Short SHA, or '' when it cannot be read.
 */
function corpusCommit(modelsRoot) {
  try {
    return execFileSync(
      'git',
      ['-C', modelsRoot, 'rev-parse',
        `--short=${AA_NULL_CORPUS_SHA.length}`, 'HEAD'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    // Not a checkout, no git, a detached worktree with no HEAD — all the
    // same answer here: the commit is not knowable, so do not claim one.
    return '';
  }
}

/**
 * One sentence saying the paired pass did not cover what it had to.
 *
 * @param {{expected: Array<string>, missing: Array<string>}} coverage
 * @return {string} Reason text, for the log, the job summary and the README.
 */
function coverageSkipReason(coverage) {
  const named = coverage.missing.slice(0, MAX_NAMED_MISSING).join(', ');
  const elided = coverage.missing.length - MAX_NAMED_MISSING;

  return `the paired delta covers ${
    coverage.expected.length - coverage.missing.length} of the ${
    coverage.expected.length} models it had to cover, missing ${named}${
    elided > 0 ? ` and ${elided} more` : ''}`;
}

/**
 * One sentence saying how much of the paired delta is actually a measurement.
 *
 * Written whenever `failed` is non-empty, which is a covered-but-unmeasured
 * state rather than a failure of the gate — see `pairedCoverage`. It exists
 * because the alternative is a README and a job summary that report the
 * corpus size beside a median computed over fewer models, with nothing on
 * either page saying so.
 *
 * @param {{expected: Array<string>, failed: Array<string>}} coverage
 * @return {string} Note text, for the log and the README.
 */
function coverageFailedNote(coverage) {
  const named = coverage.failed.slice(0, MAX_NAMED_MISSING).join(', ');
  const elided = coverage.failed.length - MAX_NAMED_MISSING;

  const measured = coverage.expected.length - coverage.failed.length;

  return `${coverage.failed.length} of the ${
    coverage.expected.length} covered ${
    coverage.failed.length === 1 ? 'models carries' : 'models carry'} a ` +
    `non-OK row on at least one side (${named}${
      elided > 0 ? ` and ${elided} more` : ''}), so the paired delta reports ` +
    'N/A for every timing column of those rows and the gate\'s median is ' +
    `over ${measured} model${measured === 1 ? '' : 's'}`;
}

/**
 * Report a discarded paired delta where a human will see it.
 *
 * The log is not enough: the paired delta IS the release gate, and its absence
 * has to reach the same two places its presence does — the job summary someone
 * reads during the release, and the README committed next to the snapshot,
 * which is all a reader has months later.
 *
 * @param {string} reason Why the paired delta was not written.
 */
function reportPairedSkipped(reason) {
  console.warn(`::warning::Paired delta withheld: ${reason}.`);

  const summaryPath = process.env.GITHUB_STEP_SUMMARY;

  if (!summaryPath) {
    return;
  }

  try {
    fs.appendFileSync(
      summaryPath,
      `\n> **No paired delta for this release.** Withheld because ${reason}. ` +
      'The release falls back to the `crossRun` delta, which has a 13.66% ' +
      'median noise floor and is a lead rather than a gate.\n',
      'utf8');
  } catch (e) {
    // A summary that cannot be written must not cost the snapshot.
    console.warn(`Could not write the job summary: ${e.message}`);
  }
}

/**
 * The three states the paired gate can end a run in, as this script decides
 * them. Spelled the same way `renderReadme` spells them in prose, because the
 * job summary and the re-bless PR body are generated from this and the README
 * from that, and a release that says different things on two pages is the
 * failure this vocabulary exists to prevent.
 *
 * `withheld` is "attempted and its result discarded"; `absent` is "did not
 * run". They are not the same claim about a release and must not collapse
 * into one "no paired delta" phrasing.
 */
const PAIRED_STATE = { PAIRED: 'paired', WITHHELD: 'withheld', ABSENT: 'absent' };

/**
 * Publish the paired gate's outcome as GitHub step outputs.
 *
 * The workflow has two more surfaces that describe the gate — the job summary
 * and the re-bless PR body — and until this existed both were written as if
 * the paired delta were always produced. That is not a rare path: the
 * conway#633 basename collision fires on every full-corpus release today, so
 * the DEFAULT outcome is `withheld` and the default messaging promised a
 * `paired` row that is not in the directory. Neither surface can re-derive
 * WHY from the files on disk; only this script knows, so it says so here
 * rather than leaving the workflow to parse the README's prose.
 *
 * Whether a `measurementBasis: paired` file was actually produced is
 * determined independently, by the summary step reading the CSVs it is about
 * to print. This output carries the reason, not the verdict.
 *
 * @param {string} state One of PAIRED_STATE.
 * @param {string} reason Clause completing "withheld because ...", or '' when
 *   the state is not `withheld`.
 */
function reportPairedOutcome(state, reason) {
  const outputPath = process.env.GITHUB_OUTPUT;

  if (!outputPath) {
    return;
  }

  try {
    fs.appendFileSync(
      outputPath,
      // `key=value` on one line, so any newline in the value would end the
      // record early and leave the rest of it parsed as another key. The
      // reasons this script builds are single-line; this is what keeps that
      // true of one built later.
      `paired-state=${state}\n` +
      `paired-reason=${reason.replace(/[\r\n]+/g, ' ')}\n`,
      'utf8');
  } catch (e) {
    // Same policy as the job summary: a report that cannot be written must
    // not cost the snapshot, which is the run's only durable record.
    console.warn(`Could not write the step output: ${e.message}`);
  }
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
      // Absent from every perf.csv written before #555. Read from the row
      // rather than hard-coded here: this script blesses whatever the batch
      // aggregated, and a mixed IFC/STEP corpus carries two writers.
      row.writer || UNMEASURED,
      os.arch(),
      engine,
      // The committed snapshots URL-encode the filename, and the delta joins
      // on it — an unencoded name would not match the baseline's row.
      encodeURIComponent(row.file || ''),
      UNMEASURED,
      row.parseTimeMs || UNMEASURED,
      row.geometryTimeMs || UNMEASURED,
      row.totalTimeMs || UNMEASURED,
      // Absent before #562, where totalTimeMs stopped being this sum.
      row.parsePlusGeometryMs || UNMEASURED,
      // Absent from every perf.csv written before #552, and from FAIL rows,
      // which is why this reads the column instead of assuming it.
      row.geometryMemoryMb || UNMEASURED,
      row.peakWasmHeapMb || UNMEASURED,
      row.rssMb || UNMEASURED,
      row.peakRssMb || UNMEASURED,
      row.heapUsedMb || UNMEASURED,
      row.heapTotalMb || UNMEASURED,
      row.externalMb || UNMEASURED,
      row.arrayBuffersMb || UNMEASURED,
      // Absent from every perf.csv written before #554, and N/A in any run
      // whose children had no --expose-gc to settle with.
      row.retainedRssMb || UNMEASURED,
      row.retainedHeapUsedMb || UNMEASURED,
      row.retainedExternalMb || UNMEASURED,
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
 *   conway1.451.1357-ci_1.543.1513_paired_delta.csv -> true for 1.543.1513
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
 * The `_paired` variant is matched for exactly the same reason the plain one
 * is: it is named after its predecessor, the predecessor is not fixed for a
 * given release, and a stale paired delta left behind would be a whole second
 * authoritative-looking file describing a comparison the README does not name.
 *
 * @param {string} name A directory entry name.
 * @param {string} version Version being blessed, e.g. '1.543.1513'.
 * @return {boolean} True when the file is this release's chronological delta,
 *   in either its cross-run or its paired spelling.
 */
function isChronologicalDelta(name, version) {
  const match = name.match(/^conway([^_]+)_(.+?)(_paired)?_delta\.csv$/);

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
 * Remove any previously written paired detail CSV before writing this run's.
 *
 * The file is named for the PREDECESSOR (`performance-detail-paired-conway
 * <prev>.csv`), and the predecessor is not fixed for a given release — the
 * same hazard `removeStaleDeltas` exists for. Matching the whole family
 * rather than one expected name is deliberate: this directory belongs to one
 * release, so any file of this shape in it is either the one about to be
 * rewritten or a stale one from a re-run that picked a different predecessor,
 * and leaving the latter would put a second engine's rows beside the delta
 * without anything naming them.
 *
 * @param {string} outDir This release's snapshot directory.
 * @return {Array<string>} Names removed, for logging.
 */
function removeStalePairedDetail(outDir) {
  const removed = [];

  for (const name of fs.readdirSync(outDir)) {
    if (!/^performance-detail-paired-.+\.csv$/.test(name)) {
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
 * @param {string} [info.corpusSha] Short SHA the corpus is checked out at,
 *   or '' when it could not be read. Printed beside the commit the A/A
 *   floor was measured over, so a reader can see whether the two match
 *   instead of inferring it from the repo name.
 * @param {number} info.modelCount Models measured.
 * @param {number} info.retentionCount Rows carrying a measured retention
 *   figure, i.e. rows whose child had `--expose-gc` to settle with. Reported
 *   on the snapshot's own face so a directory full of `N/A` retention says
 *   why without anyone having to find this script.
 * @param {string} info.deltaName Delta filename, or '' when none was produced.
 * @param {string} info.previousName Previous snapshot directory, or ''.
 * @param {string} [info.pairedDeltaName] Paired delta filename, or '' when the
 *   paired pass did not run.
 * @param {string} [info.pairedDetailName] Filename of the previous pin's own
 *   rows as measured by THIS job, or ''.
 * @param {string} [info.pairedEngine] Engine label given to those rows, e.g.
 *   'conway1.543.1513-paired'.
 * @param {string} [info.pairedScope] 'full' or 'smoke' — which models the
 *   paired pass covered. A narrower scope is a narrower gate and the README
 *   has to say so on its face.
 * @param {string} [info.pairedFailedNote] coverageFailedNote() for this run,
 *   or '' when every covered model produced an `OK` row on both sides. The
 *   paired delta carries a row for a model neither engine could load, with
 *   `N/A` in every timing column, so the file's row count is not the gate's
 *   sample size and the README has to say which is which.
 * @param {string} [info.pairedSkipReason] Why a requested paired delta was
 *   withheld, e.g. a pass that lost models. '' when none was requested or
 *   none was withheld. Printed for the same reason the scope is: the reader
 *   of this directory months later has nothing else to tell a paired pass
 *   that never ran from one that ran and was discarded.
 * @return {string} README body.
 */
function renderReadme(info) {
  const deltaLine = info.deltaName !== '' ?
    `\`${info.deltaName}\` diffs this run against \`../${info.previousName}/\`.` :
    'No previous snapshot was committed in this repo, so no delta was produced.';

  const pairedDeltaName = info.pairedDeltaName || '';
  const pairedScope = info.pairedScope || 'full';

  // Two different states, and a reader months from now cannot tell them apart
  // from the directory listing: no paired pass was asked for, versus one ran
  // and was thrown away. The second one names why on the snapshot's own face.
  const unpairedOpening = info.pairedSkipReason ?
    [
      'Only a `crossRun` delta was produced for this release. **A paired',
      'pass was attempted and its result was discarded** — withheld because',
      `${info.pairedSkipReason}. A partial paired delta is worse than none:`,
      'it would carry the `paired` label, and with it the claim to be this',
      "release's gate, over a subset of the corpus nobody chose.",
    ].join('\n') :
    'Only a `crossRun` delta was produced for this release: the paired pass\ndid not run.';

  // WHOSE CORPUS THE A/A FLOOR WAS MEASURED ON. The floor quoted below came
  // from `perf-aa-null.yml`, which hardcodes `bldrs-ai/test-models` — the
  // PUBLIC corpus. This README is generated for whichever matrix target ran,
  // and for the private one the same paragraph would be stamping a number
  // nobody measured onto the snapshot that actually gates the release. The
  // private corpus has a different model count and cost profile, and unlike
  // the public one it is not guaranteed to fit in the runner's page cache —
  // which is the exact property the null test found the current floor to rest
  // on. So the claim is qualified per target rather than generalised, and the
  // private floor is named as unmeasured until someone measures it.
  //
  // And on the PUBLIC target the qualification is about the commit, not the
  // repo: matching `bldrs-ai/test-models` by name says nothing about the
  // model set, because the null test pinned its checkout and this job does
  // not (see AA_NULL_CORPUS_SHA). Same-name-different-models is the case that
  // would otherwise assert a bound nobody measured, so the two commits are
  // printed side by side and only a match claims "same models".
  const blessedAt = info.corpusSha || '';
  const sameCommit =
    blessedAt !== '' && blessedAt.startsWith(AA_NULL_CORPUS_SHA);
  const aaCorpusCaveat = info.repoName !== AA_NULL_CORPUS ?
    `**This snapshot is \`${info.repoName}\`, which is NOT the corpus that was\n` +
    'measured, so the floor above is not a measured bound on this file.** The\n' +
    'A/A null test has only ever run against `bldrs-ai/test-models`. This\n' +
    'corpus holds a different number of models with a different cost profile,\n' +
    'and where the public corpus was 100% page-cache resident before the first\n' +
    'pass (which is *why* the measured cold-start term is 0.13%), a corpus\n' +
    'larger than the runner\'s RAM has no such guarantee. Read the numbers\n' +
    'above as the only floor anyone has measured for the paired configuration,\n' +
    'and as an order of magnitude here — not as a bound on this file. What it\n' +
    'would cost to measure this corpus\'s own floor is in conway\'s\n' +
    '[design/new/perf-run-comparability.md](https://github.com/bldrs-ai/conway/blob/main/design/new/perf-run-comparability.md)\n' +
    'Evidence 4, "What this does not bound".' :
    sameCommit ?
      '**This snapshot is that corpus, at the very commit the floor was\n' +
      `measured over** (\`${AA_NULL_CORPUS_SHA}\`). Same models, same runner\n` +
      'label, same harness, so the floor above is a measured bound on this\n' +
      'file.' :
      '**This snapshot is that corpus** — same repository, same runner label,\n' +
      'same harness. What is NOT established is that it is the same **model\n' +
      `set**: the floor was measured over \`${AA_NULL_CORPUS_SHA}\`, while this\n` +
      'snapshot was blessed at ' +
      `${blessedAt !== '' ? `\`${blessedAt}\`` : 'an unrecorded commit'}` +
      ' — `rc-regression.yml` checks the\n' +
      'target repo out at its default branch, with no pinned `ref:`, so the\n' +
      'corpus can gain or lose models between the two. Nothing in either job\n' +
      'compares them. Read the floor as a measured bound on this file to the\n' +
      'extent the corpus has not moved under it.';

  // WHICH COLUMNS ARE A MEASUREMENT AND WHICH ARE A LEAD. This is the half of
  // the directory a reader is most likely to get wrong, because the two delta
  // files share a column layout and differ only in how `engine1` was
  // obtained. Stated first, before any column definition, and repeated in the
  // `measurementBasis` cell of every row of both files.
  //
  // THE FLOOR NUMBERS BELOW ARE HAND-TRANSCRIBED from run 33192612782's
  // report (`AA_*` grep lines and aa-report.md in its artifact), and so are
  // the 97/99 model counts. Nothing checks them against the analyser: the rc
  // job has no access to that run's output, and re-deriving them would mean
  // an rc release reading another workflow's artifact. Treat them as a
  // maintained constant with a named provenance — when the A/A test is re-run
  // on a changed corpus, the new run's numbers have to be copied here, into
  // the `Summarize the paired delta` step of rc-regression.yml, and into
  // design/new/perf-run-comparability.md together.
  const pairedSection = pairedDeltaName !== '' ?
    `## Which delta to read

This directory holds **two** conway-to-conway deltas over the same pair of
releases. They are not interchangeable.

| file | \`engine1\` is | \`measurementBasis\` | read it as |
|---|---|---|---|
| \`${pairedDeltaName}\` | \`${info.pairedEngine}\` — the previous release, re-measured **in this job, on this machine, minutes before/after the numbers it is differenced against** | \`paired\` | **the gate.** Read its **median**, whose measured floor — on the public corpus — is below |
| \`${info.deltaName}\` | \`${info.previousName.replace(/_.*$/, '')}\` — the previous release **as recorded by its own run**, on a machine nobody recorded | \`crossRun\` | continuity with the historical archive **only** |

**A \`crossRun\` timing column is not a measurement of conway.** It was
measured at a **13.66% median** run-to-run drift across 97 models — two
attempts of one job, same commit, byte-identical digests, only the perf CSVs
differing — against a **9.40% median** regression that same delta was
reporting. The signal was smaller than the noise. The cause is that
\`ubuntu-24.04-4vcpu-8gb-150gbssd\` is a label spanning three CPU models
across two vendors, with an 11.24% CV of job means and a 32.8% max/min spread;
the full evidence, and why CPU time and instruction counts do not fix it, is
in conway's
[design/new/perf-run-comparability.md](https://github.com/bldrs-ai/conway/blob/main/design/new/perf-run-comparability.md).

The cross-run file is kept because the archive in \`../\` contains nothing
else and cannot be retrofitted — every historical snapshot was measured on an
unknown machine. Use it to place this release in a long trend; do not read one
of its rows as a regression.

### How much of the paired delta is signal

Pairing removes the machine. It does not remove everything, and the residual
was measured rather than assumed: an **A/A null test** — the identical engine
over the identical corpus, four passes in one job, one of them with the corpus
evicted from page cache ([run 33192612782](https://github.com/bldrs-ai/conway/actions/runs/33192612782),
\`.github/workflows/perf-aa-null.yml\`). Every delta it reports must be zero.
What it reports instead is a floor — **measured on the public corpus,
\`bldrs-ai/test-models\` at \`${AA_NULL_CORPUS_SHA}\`, over 97 of the 99 models the batch
walks there** (two pairs share a \`<stem>.perf.csv\` and collapse to one row —
conway#633):

| quantity | floor under a null, public corpus |
|---|---|
| whole-corpus aggregate (corpus total, pass wall clock) | **0.13% – 0.24%** |
| **per model**, median absolute change over 97 models | **1.27% – 1.58%** |
| per model, p10 / p90 | **≈ −3% / +4%** |
| median change over six pairings that must all be zero | **0.000% to +0.743%** |

**So per-model regression calls below ~5% are inside the noise floor.** With
no code change at all, 10 of 97 models moved more than 5%, ~38 moved more than
2% and ~60 moved more than 1%. The p10/p90 columns printed beside the median
in the rc job summary are that floor, **not engine signal at per-model scale.**
Read a single row of this file as a lead and re-run the model before believing
it; read the **median** as the gate.

These are two different quantities and they must not be swapped: the corpus
aggregate is stable because 97 models' independent jitter averages out of it,
which is help a single row does not get.

${aaCorpusCaveat}

\`${info.pairedDetailName}\` holds the previous pin's own rows from this
job, so the paired \`engine1\` numbers stay inspectable after the run's
\`perf-serial-*\` artifact expires.

**Memory columns are paired too, and they did not need to be.** RSS and heap
figures are far less machine-sensitive than timings; they are in the paired
file because the pass measures whole rows, not because a cross-run memory
delta was suspect.

${pairedScope === 'full' ?
  'The paired pass covered the **full corpus**, the same models as the blessed pass.' :
  '**Scope: the smoke subset only.** The paired pass ran over `regression/smoke_models.txt`, not the full corpus, so the paired delta covers roughly a dozen models. Every model outside that subset has a `crossRun` row and no `paired` row — which is a narrower gate, deliberately chosen for this run, not a failure.'}
${info.pairedFailedNote ?
  `\n**Not every covered row is a measurement.** ${
    info.pairedFailedNote[0].toUpperCase()}${info.pairedFailedNote.slice(1)}.\n` +
  'A regression child writes a perf row on its failure paths too, so a model\n' +
  'neither engine could load is present on both sides and reaches this file\n' +
  'with `N/A` for every timing column. Read the row count of the delta as the\n' +
  "models it covers and the `n` in the rc job summary as the gate's sample\n" +
  'size; they are not the same number. A model the *previous pin* cannot load\n' +
  'is conway#634; a model that fails in *this* release is caught by the\n' +
  'digest gate, not here.\n' :
  ''}
` :
    `## Which delta to read

${unpairedOpening} **A \`crossRun\` timing column is not a measurement of conway** —
\`engine1\` comes from a previous run on a machine nobody recorded, and that
comparison has a measured 13.66% median noise floor against a 9.40% median
reported regression. Read it as a lead. Why, and what pairing does about it:
conway's
[design/new/perf-run-comparability.md](https://github.com/bldrs-ai/conway/blob/main/design/new/perf-run-comparability.md).

`;

  // Which condition of the rc job's two-pass A/B produced this directory.
  // Always the settle-on pass — the control pass is never blessed — but a
  // snapshot whose retention columns are all N/A needs to say so itself,
  // rather than leaving a reader to guess between "no leak" and "not
  // measured".
  const retentionLine = info.retentionCount > 0 ?
    [
      `Retention is measured on ${info.retentionCount} of ${info.modelCount}`,
      'rows here, so the settle ran. conway\'s `rc-regression` job runs the',
      'corpus **twice** in one job — this blessed pass in the shipped',
      'configuration, then a control pass with `CONWAY_PERF_EXPOSE_GC=0` whose',
      'only purpose is to check that the settle does not perturb the timing',
      'columns. The control pass is never blessed and none of its numbers are',
      'in this directory; its comparison is in that run\'s job summary and',
      '`perf-serial-*` artifact.',
    ].join('\n') :
    [
      'Retention is `N/A` on every row here: this run\'s children had no',
      '`--expose-gc`, so the settle could not run. Read that as *not',
      'measured*, not as *nothing retained*.',
    ].join('\n');

  return `# ${info.engine} — ${info.repoName}, rc-regression baseline

Steady per-model load timings captured by the \`rebless\` job of conway's
\`rc-regression\` workflow, over the full corpus at \`--concurrency 1\`.

${info.modelCount} models measured. ${deltaLine}

${pairedSection}## Harness

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
perf writer does not capture them. Every other column is measured, with two
exceptions. A row whose \`loadStatus\` is not \`OK\` carries \`N/A\` for the
stages the load never reached. And the three retention columns carry \`N/A\`
whenever the run had no \`--expose-gc\` to settle with, on an \`OK\` row as
much as a failed one — see below.

**"Comparable on the same runner class" is doing real work in that sentence.**
Two conway CI regression jobs an hour apart, on near-identical code, came out
with every model faster in the later run by a median 1.55x (conway#554). A
timing delta between two releases carries that factor as well as any change in
conway, so treat a cross-version timing move as a lead rather than a
measurement unless it is far larger than 1.5x.

\`parseTimeMs\` additionally is **not** comparable across the conway#554
boundary. From #554 on, a forced collection settles the heap immediately
before the parse clock starts, so the parse runs from a collected floor
instead of collecting engine-init garbage inside the timed window. **That is
an absolute cost, not a percentage.** Measured locally over 12 interleaved
pairs it was 9-12 ms per load on two 2.5 MB models — 13-16% only because
their parse takes about 60 ms — and it is not resolvable at all against
MB-Khaya's 578 ms parse. So it tilts a fast model's parse in the direction of
the newer snapshot looking faster with nothing in the parser having changed,
and leaves a slow model's alone.

\`peakRssMb\` is the load's high-water mark (the kernel's, via
\`resourceUsage().maxRSS\`); \`rssMb\`, \`heapUsedMb\`, \`heapTotalMb\`,
\`externalMb\` and \`arrayBuffersMb\` are single samples taken at the end of the
load with no GC first. Do not read the instants as peaks, or \`heapUsedMb\` as a
live set — it includes garbage GC has not collected.

\`externalMb\` is off-heap memory V8 knows about and \`arrayBuffersMb\` is its
ArrayBuffer subset — that is where the source buffer and the parse structures
live, invisible to \`heapUsedMb\`. Neither sees the wasm heap, so
\`heapUsedMb + externalMb\` is not a substitute for RSS: on a 31 MB model it
reads 284 MB against an RSS of 510 MB.

\`retainedRssMb\`, \`retainedHeapUsedMb\` and \`retainedExternalMb\` are the only
columns here that answer *do we leak?* rather than *does this survive?*: each
is a settled sample taken after the model was torn down minus a settled sample
taken before the load began, so it is what one full load/teardown cycle left
behind. They are signed — a cycle can end below its baseline — and they read
\`N/A\` wherever the run had no \`--expose-gc\` to settle with, because an
unsettled difference is GC timing rather than retention.

**They are not a pure leak metric**, and this is the column most likely to be
misread. Teardown is exactly \`model.invalidate(true)\`: it drops the vtable
builder, the descriptor cache, the scratch parsing buffer and lazy entity
fields, and it does **not** drop \`geometry\`, \`voidGeometry\`, \`curves\`,
\`profiles\`, \`materials\` or the source buffer — the digest iterates all of
those after it runs, so it cannot. A retention figure is therefore *the
still-live model plus anything genuinely leaked*, and a change that makes the
live model bigger moves it in the same direction a leak does. Read a movement
alongside \`geometryMemoryMb\`, against this corpus's own history. It is a good
regression signal for a fixed model; it is not a number to quote on its own.

${retentionLine}

\`peakWasmHeapMb\` is the wasm linear memory conway's geometry engine runs in,
which nothing else here can see. It is grow-only, so one reading is the
high-water mark. Do not read it as \`geometryMemoryMb\`: that column is the
vertex+index payload a consumer would copy out, and the heap around it also
holds allocator overhead, fragmentation and boolean intermediates — 8 MB of
payload under an 85 MB heap on one model in this corpus. A **third** native
quantity exists and is deliberately not a column here: the native's own live
allocation (\`getAllocationSize\`), which is what a residency budget governs.
The three differ by an order of magnitude and none of them converts into
another.

**\`geometryMemoryMb\` is comparable only within one writer, which is why
every row now carries a \`writer\` column.** The IFC **CLI** and the IFC
regression child read 16.8 vs 22.3 MB for the same model — the same
\`calculateGeometrySize()\`, sampled in two pipelines that capture different
things ([conway#555](https://github.com/bldrs-ai/conway/issues/555)). The
mechanism is \`RegressionCaptureState.memoization\`: the IFC regression child
raises it to \`FULL\`, which stops \`deleteTemporaries()\` and leaves every CSG
intermediate and boolean operand in the map \`calculateGeometrySize()\` sums.
The digest walks those temporaries, so the two are not going to be made to
agree; the divergence is named instead. \`gen_delta_csv.cjs\` reads \`writer\`
and reports \`N/A\` rather than a number when it differences
\`geometryMemoryMb\` or a retention column across two of them.

IFC rows against STEP rows within this file are a **third** pair, and they do
disagree in principle for the same reason: \`memoization\` is a process-global
and the two regression children are separate processes, so only the IFC one
runs at \`FULL\`. That was true before the column existed too; the column is
what makes it visible. It has not been measured on a shared model, because
none of the corpus loads through both children.

**\`totalTimeMs\` is the load's wall clock — and it was not always**
([conway#562](https://github.com/bldrs-ai/conway/issues/562)). On the
regression children it used to be \`geomEndMs - parseStartMs\`, with
\`geomStartMs\` taken on the line after \`parseEndMs\`, so it was
\`parseTimeMs + geometryTimeMs\` by construction and excluded the file read,
the wasm init and the teardown. It now runs from before the file read to
after \`model.invalidate(true)\`, and \`parsePlusGeometryMs\` carries the old
sum. So **\`totalTimeMs\` steps up once at this boundary** and a delta across
it is a change of methodology, not of the engine — read
\`parsePlusGeometryMs\` for continuity, which works between two
regression-produced snapshots. Neither column is time-to-first-mesh: these
rows come from a resident, fully-extracted open, not the windowed deferred
pump Share drives (conway#562 §2).

**Do not read that as "the loader writes the same thing".** It does not, and
this is the one caveat most likely to be acted on by mistake, because both
now answer to the word "total". \`ConwayModelLoader\` opens its clock and
THEN builds and initialises a per-load \`ConwayGeometry\`; a regression child
initialises before its clock starts. Engine init — about 195 ms — is inside
one window and outside the other, which is 120% of \`index.ifc\`'s own total,
24% of \`haus.ifc\`'s and 4.3% of \`MB-Khaya\`'s. \`parsePlusGeometryMs\` is
not a way round it either: the loader emits no such column at all, and the
stage clocks it would sum are not the same intervals (the child's parse
clock includes \`parseHeader\` and its geometry clock includes constructing
\`IfcGeometryExtraction\`, where the loader excludes both).

So **\`gen_delta_csv.cjs\` withholds EVERY measurement column when the two
rows come from different harnesses** — every timing column, every memory
column, \`geometryMemoryMb\` and \`peakWasmHeapMb\` included. What survives
such a join is \`filename\`, \`loadStatus\`, \`uname\`, \`schemaVersion\` and
\`engine\`: identity, not data. The row says so on its face — a
**\`comparability\`** column reading \`crossHarness\`, so a page of \`N/A\` is
distinguishable from "not measured" and from "absent from that older
snapshot". Whether a single file should mix harnesses at all is
[conway#572](https://github.com/bldrs-ai/conway/issues/572).

**The retention columns carried a second, unrelated split until conway#557
([conway#557](https://github.com/bldrs-ai/conway/issues/557)).** The IFC
regression child used to build a *second* \`ConwayGeometry\` inside
\`geometryExtraction\`, so that engine's linear memory was allocated inside
the retention window and never released while the engine \`main()\` had
initialised sat idle. It measured as a ~55-60 MB constant on every IFC row
regardless of model size, plus its \`initialize()\` inside \`geometryTimeMs\`.
From #557 on both regression children extract on the single engine they
initialised before the baseline, so their retention columns are the same shape
and an IFC row here no longer carries a term a STEP row cannot. What does NOT
survive that boundary is a comparison with an older snapshot: IFC \`retainedRssMb\`,
\`peakRssMb\` and \`geometryTimeMs\` all step down once at #557 on unchanged
geometry — MB-Khaya's \`retainedRssMb\` 379-389 to 326-333, \`index.ifc\` 58.96
to 2.38, \`IfcOpenHouse_IFC4\`'s \`geometryTimeMs\` 156 to 70 ms, with digests
byte-identical throughout. The one cross-pipeline split left is the loader
path, which brings up a \`ConwayGeometry\` per load inside its own timed
region; nothing in this file comes from there.

Snapshots blessed before conway#552 carry none of \`peakWasmHeapMb\`,
\`peakRssMb\`, \`externalMb\` or \`arrayBuffersMb\`, nor a measured
\`geometryMemoryMb\`, and nothing blessed before conway#554 carries the three
retention columns, so those columns come out \`N/A\` in a delta against them. That is a missing
measurement, not a zero: do not read it as "no change". A snapshot blessed
before conway#557 carries those columns but populated differently on its IFC
rows; see the #557 note above before differencing one.

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

/**
 * Read the optional paired-pass flags off argv.
 *
 * Flags rather than positionals because they are optional and arrive
 * together: `--paired <csv>` is the previous pin's perf.csv as measured by
 * THIS job, `--paired-engine` is the label its rows get, `--paired-scope` is
 * `full` or `smoke`, `--paired-expected <list>` narrows the coverage demand
 * to a model list (the `smoke` scope's subset), and `--corpus-exclude
 * <regex>` is the batch's own exclude filter, so the corpus walk that derives
 * the demand sees the same tree the passes did (see pairedCoverage). All
 * absent is the ordinary un-paired run.
 *
 * @param {Array<string>} argv process.argv.
 * @return {{csv: string, engine: string, scope: string, expected: string,
 *   corpusExclude: string}} Empty strings where a flag was not supplied.
 */
function parsePairedFlags(argv) {
  const read = (flag) => {
    const at = argv.indexOf(flag);
    // `at + 1 < argv.length` so a trailing `--paired` with no value reads as
    // absent instead of `undefined` reaching fs.existsSync.
    return at !== -1 && at + 1 < argv.length ? argv[at + 1] : '';
  };

  return {
    csv: read('--paired'),
    engine: read('--paired-engine'),
    scope: read('--paired-scope') || 'full',
    expected: read('--paired-expected'),
    corpusExclude: read('--corpus-exclude'),
  };
}

/** Entry point. */
function main() {
  const [, , perfPath, modelsRoot, version, repoName] = process.argv;

  if (!perfPath || !modelsRoot || !version || !repoName) {
    console.error(
      `Usage: node ${path.basename(process.argv[1])} ` +
      '<perf.csv> <models-checkout-root> <conway-version> <repo-name> ' +
      '[--paired <previous-pin-perf.csv>] [--paired-engine <label>] ' +
      '[--paired-scope full|smoke] [--paired-expected <model-list>] ' +
      '[--corpus-exclude <regex>]');
    process.exit(1);
  }

  const paired = parsePairedFlags(process.argv);

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

  // Unconditional, and beside the delta cleanup rather than inside the paired
  // branch below: this run owns the directory's paired state whatever it
  // decides to do with it, and the case that motivated hoisting it out of the
  // success arm is only half the hazard. Re-blessing an already-blessed
  // snapshot whose paired step produced nothing this time omits `--paired`
  // ENTIRELY, so a cleanup living under `paired.csv !== ''` never runs —
  // `removeStaleDeltas` takes the old paired delta (it matches the `_paired`
  // spelling) and the regenerated README says the paired pass did not run,
  // while the previous run's `performance-detail-paired-*.csv` sits there
  // unnamed by anything.
  const removedDetail = removeStalePairedDetail(outDir);
  if (removedDetail.length > 0) {
    console.log(
      `Removed superseded paired detail: ${removedDetail.join(', ')}`);
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

  // THE PAIRED DELTA, which is the one the release is gated on. It is written
  // after the cross-run delta rather than instead of it: the historical
  // archive in benchmarks/ is entirely cross-run and cannot be retrofitted, so
  // the old file survives for continuity while the paired file carries the
  // signal. See design/new/perf-run-comparability.md.
  //
  // Its `engine1` label deliberately does NOT match the cross-run file's. The
  // rows come from the published package at the previous version, measured in
  // this job — not from that release's own blessed snapshot — so they are
  // labelled `conway<version>-paired` against the other file's
  // `conway<version>-ci`. Two files that share a column layout must not also
  // share an engine label.
  let pairedDeltaName = '';
  let pairedDetailName = '';
  // Why the paired delta is absent, in a clause that completes "withheld
  // because ...". '' means it is not absent, or that no paired pass was asked
  // for at all.
  let pairedSkipReason = '';
  // How much of a produced paired delta is actually a measurement, or '' when
  // all of it is. Not a skip reason: these rows are IN the file — see
  // pairedCoverage's note on `failed`.
  let pairedFailedNote = '';

  if (paired.csv !== '' && previous !== null) {
    const pairedRows =
      fs.existsSync(paired.csv) ? readPerfCsv(paired.csv) : null;
    // What the corpus holds, read off the filesystem rather than off either
    // pass's output — see pairedCoverage. A walk that throws (a models root
    // that is not there, an exclude regex that will not compile) leaves the
    // demand unknown, which degrades: an unverifiable gate is not a gate.
    let corpusModels = null;
    let corpusError = '';

    try {
      corpusModels = collectCorpusModels(
        modelsRoot,
        paired.corpusExclude !== '' ?
          new RegExp(paired.corpusExclude) : undefined);
    } catch (e) {
      corpusError = e.message;
    }

    const coverage = pairedRows === null || corpusModels === null ? null :
      pairedCoverage(corpusModels, rows, pairedRows, paired.expected);

    if (pairedRows === null) {
      pairedSkipReason = `the paired pass produced no ${path.basename(paired.csv)}`;
    } else if (pairedRows.length === 0) {
      pairedSkipReason = `${path.basename(paired.csv)} has no model rows`;
    } else if (corpusModels === null) {
      pairedSkipReason =
        `the corpus under ${modelsRoot} could not be walked (${corpusError}), ` +
        'so the paired delta\'s coverage cannot be verified';
    } else if (coverage.listError !== '') {
      pairedSkipReason =
        `the expected-model list ${coverage.listError} could not be read, ` +
        'so the paired delta\'s coverage cannot be verified';
    } else if (coverage.unmatched.length > 0) {
      // A list naming models the corpus does not hold is a misconfiguration,
      // and the alternative — quietly narrowing the gate to whichever entries
      // happened to match — is the exact failure this check exists to stop.
      pairedSkipReason =
        `the expected-model list names ${coverage.unmatched.length} model(s) ` +
        `no corpus file matches (${
          coverage.unmatched.slice(0, MAX_NAMED_MISSING).join(', ')}), so ` +
        'what the paired delta had to cover is not what was asked for';
    } else if (coverage.expected.length === 0) {
      // Nothing to be short of, so `missing` is necessarily empty and any
      // paired CSV at all would pass. That is not coverage, it is the absence
      // of a measurement — an empty corpus walk, or a scope that selected
      // nothing.
      pairedSkipReason =
        'the set of models the paired delta had to cover came out empty, so ' +
        'its coverage cannot be verified';
    } else if (coverage.collisions.length > 0) {
      // INTERIM GUARD for conway#633. Perf rows and digest stems are keyed on
      // basename, so two corpus models sharing one (`ifc/index.ifc` and
      // `ifc/bldrs/index.ifc` are a live pair) write the same
      // `<stem>.perf.csv` and one row is simply lost — and being keyed on the
      // same basename, this check cannot see it go. So today this branch
      // fires on every release and the gate falls back to cross-run — which
      // is the honest state, and the point: degrading explicitly beats
      // under-covering in silence. The real fix is path-qualified identities
      // across the perf CSVs and the digest stems, which moves the benchmarks
      // layout and needs its own bless cycle. Remove this branch, and
      // `collisions`, when #633 lands.
      pairedSkipReason =
        `${coverage.collisions.length} model basename(s) are written by more ` +
        `than one corpus file (${coverage.collisions.join(', ')}), so a row ` +
        'lost to that collision cannot be detected — see conway#633';
    } else if (coverage.missing.length > 0) {
      // The finding this branch exists for: a partial paired pass used to be
      // blessed as the gate, because the only test applied to it was that the
      // file existed with a row in it. Degrading to the cross-run delta is the
      // same branch every other pairing failure already lands in.
      pairedSkipReason = coverageSkipReason(coverage);
    } else {
      const pairedEngine =
        paired.engine !== '' ? paired.engine : `conway${previous.version}-paired`;
      pairedDetailName = `performance-detail-paired-${pairedEngine}.csv`;
      const pairedDetailPath = path.join(outDir, pairedDetailName);

      // Covered but not measured: rows both passes produced with a non-OK
      // status on at least one side. They do not withhold the delta — see
      // pairedCoverage — but they are not in its median either, so the count
      // travels to the README and the log rather than being dropped here.
      if (coverage.failed.length > 0) {
        pairedFailedNote = coverageFailedNote(coverage);
        console.warn(`::notice::Paired delta partly unmeasured: ${pairedFailedNote}.`);
      }

      writeDetailCsv(pairedRows, pairedDetailPath, pairedEngine, timestamp);
      console.log(
        `Wrote ${pairedRows.length} paired rows to ${pairedDetailPath}`);

      pairedDeltaName = `${previous.engine}_${version}_paired_delta.csv`;

      // Same failure policy as the cross-run delta above: losing the delta
      // must not lose the rows, which are the run's only durable record
      // once the artifact expires.
      try {
        generateDeltaCSV(
          pairedDetailPath, detailPath,
          path.join(outDir, pairedDeltaName), false,
          MEASUREMENT_BASIS.PAIRED);
        console.log(`Wrote paired delta ${pairedDeltaName}`);
      } catch (e) {
        console.warn(`Failed to generate paired delta: ${e.message}`);
        pairedDeltaName = '';
        pairedFailedNote = '';
        pairedSkipReason = `the paired delta could not be generated: ${e.message}`;
      }
    }
  } else if (paired.csv !== '') {
    pairedSkipReason =
      'no predecessor snapshot exists to pair against';
  }

  if (pairedSkipReason !== '') {
    reportPairedSkipped(pairedSkipReason);
  }

  // The workflow's other two surfaces read this. `withheld` and `absent` are
  // different claims about the release and the PR body says which; see
  // reportPairedOutcome.
  reportPairedOutcome(
    pairedDeltaName !== '' ? PAIRED_STATE.PAIRED :
      pairedSkipReason !== '' ? PAIRED_STATE.WITHHELD : PAIRED_STATE.ABSENT,
    pairedSkipReason);

  fs.writeFileSync(
    path.join(outDir, 'README.md'),
    renderReadme({
      engine,
      repoName,
      // Best-effort, and read here rather than plumbed through the workflow:
      // see corpusCommit(). '' just means the README says so.
      corpusSha: corpusCommit(modelsRoot),
      modelCount,
      // Counted from the input rows rather than assumed from the workflow:
      // the same script blesses a run whose children had no --expose-gc, and
      // that snapshot's README must say so on its own face.
      retentionCount: rows.filter(
        (row) => (row.retainedRssMb || UNMEASURED) !== UNMEASURED).length,
      deltaName,
      previousName: previous !== null ? previous.name : '',
      pairedDeltaName,
      pairedDetailName,
      pairedEngine:
        paired.engine !== '' ? paired.engine :
          (previous !== null ? `conway${previous.version}-paired` : ''),
      pairedScope: paired.scope,
      pairedFailedNote,
      pairedSkipReason,
    }),
    'utf8');
}

if (require.main === module) {
  main();
}

module.exports = {
  AA_NULL_CORPUS,
  AA_NULL_CORPUS_SHA,
  DETAIL_COLUMNS,
  PAIRED_STATE,
  collectCorpusModels,
  corpusCommit,
  coverageFailedNote,
  coverageSkipReason,
  okFiles,
  reportPairedOutcome,
  findPreviousSnapshot,
  pairedCoverage,
  parsePairedFlags,
  isChronologicalDelta,
  removeStaleDeltas,
  removeStalePairedDetail,
  readPerfCsv,
  renderReadme,
  versionCompare,
  writeDetailCsv,
};
