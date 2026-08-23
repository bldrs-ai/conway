#!/usr/bin/env node

'use strict';

/**
 * Difference the two perf passes an rc-regression job runs against each other:
 * the blessed pass (the shipped configuration, `--expose-gc` reaching every
 * regression child) and the control pass (`CONWAY_PERF_EXPOSE_GC=0`, so
 * `global.gc` is undefined, the settle cannot run and the retention columns
 * read `N/A`).
 *
 * WHAT QUESTION THIS ANSWERS. conway#554's retention columns are defined so
 * that both of their samples sit OUTSIDE the timed region — the baseline
 * before the load begins, the retained sample after `model.invalidate(true)`.
 * If that holds, the forced collections cannot touch `parseTimeMs` /
 * `geometryTimeMs` / `totalTimeMs`, and two passes of identical code differing
 * only in whether the settle executes must produce the same timing columns.
 *
 * The sign of any movement is what distinguishes the two ways that can fail,
 * so the report leads with it: gc-on SLOWER is the settle leaking into the
 * measured window, which is a bug; gc-on FASTER is the control pass carrying
 * pre-load garbage into the window the blessed pass entered clean, which is
 * not a defect in the blessed configuration but does break comparability with
 * pre-#554 snapshots.
 *
 * WHY BOTH PASSES LIVE IN ONE JOB. The obvious alternative — tag an rc, run,
 * flip the switch, run again — cannot answer it. Two `run-ifc-regression` jobs
 * an hour apart on near-identical code showed every model faster in the later
 * run by a median 1.55x (conway#554, comment 5381287618), and MB-Khaya's
 * `totalTimeMs` across three such runs read 8039 / 4745 / 7621 ms. The effect
 * under test is about 1%. A between-run comparison measures which runner the
 * job landed on and nothing else, so the two passes have to share a runner, a
 * machine and a moment for that scale factor to cancel.
 *
 * WHAT THE STATISTIC IS. One sample per model per pass, so there is no
 * within-pass spread to compare a difference against on a single model.
 * Across the corpus there is: run-to-run noise scatters the per-model
 * on-over-off ratios around 1.0 with no preferred direction, while a settle
 * that genuinely cost time inside the window would shift essentially every
 * model the same way. Hence the median ratio, the p10/p90 band around it, and
 * the count of models that came out slower with the flag on — a sign test the
 * scale factor cannot fake, because it applies to both passes equally.
 *
 * SMALL MODELS ARE EXCLUDED FROM THE RATIOS. The stage timings come from
 * `Date.now()`, so a model whose parse takes 3 ms carries a +/-1 ms
 * quantisation floor — a 33% "ratio" that is pure rounding. Rows under
 * RATIO_FLOOR_MS on either side are counted and reported, not silently
 * dropped.
 *
 * THE MEMORY COLUMNS ARE EXPECTED TO MOVE, and their movement is not a
 * finding. The flag-on pass settles the heap immediately before the load, so
 * its end-of-load `heapUsedMb` / `rssMb` sample starts from a collected floor
 * that the flag-off pass never gets. Measured locally over 12 interleaved
 * pairs on four models, `heapUsedMb` ran 5-11 MB lower with the flag on, every
 * time. They are reported for information and explicitly not read as a defect;
 * only the timing columns carry the question.
 *
 * Usage:
 *   node scripts/perf_ab_compare.cjs <blessed.csv> <control.csv> \
 *       <out.md> [<out.csv>] [--label <text>]
 *
 * Analysis findings NEVER exit non-zero. This runs inside the rc job ahead of
 * the steps that open the re-bless PR, and a methodology check must not be
 * able to withhold the release's regression report. A control pass that came
 * back with populated retention columns (i.e. the env switch did not take)
 * is reported as a `::warning::` and marks the comparison invalid in the
 * output.
 */

const fs = require('fs');
const { csvRow, parseCsv } = require('./csv_rfc4180.cjs');

/**
 * Timing columns the A/B is actually about.
 *
 * `parsePlusGeometryMs` joined the list with conway#562, which redefined
 * `totalTimeMs` as the load's wall clock — file read through teardown. That
 * is the more honest number for a release record and the noisier one for
 * this comparison, since it now carries I/O and teardown the settle has no
 * bearing on. `parsePlusGeometryMs` is the old `totalTimeMs` quantity, so
 * keeping both means the A/B's history stays readable across that boundary.
 */
const TIMING_COLUMNS =
  ['parseTimeMs', 'geometryTimeMs', 'totalTimeMs', 'parsePlusGeometryMs'];

/**
 * Memory columns reported alongside, purely so nobody reads their (expected)
 * movement as a defect. See the header note.
 */
const MEMORY_COLUMNS = ['heapUsedMb', 'rssMb', 'peakRssMb'];

/** The retention columns, present only when the settle could run. */
const RETENTION_COLUMNS =
  ['retainedRssMb', 'retainedHeapUsedMb', 'retainedExternalMb'];

/**
 * Below this, `Date.now()` quantisation dominates the ratio. 10 ms keeps a
 * +/-1 ms tick under 10% of the figure it is quantising.
 */
const RATIO_FLOOR_MS = 10;

/** How many per-model rows the markdown table shows, slowest first. */
const TOP_MODELS = 10;

/** The unmeasured marker every perf writer in the repo emits. */
const UNMEASURED = 'N/A';

/**
 * Read a perf CSV into rows keyed by column name.
 *
 * @param {string} file Path to a perf.csv written by ifc_regression_batch_main.
 * @return {Array<Record<string, string>>} One record per data row, in file order.
 */
function readPerfCsv(file) {
  const records = parseCsv(fs.readFileSync(file, 'utf8'));

  if (records.length === 0) {
    return [];
  }

  const header = records[0];

  return records.slice(1).map((fields) => {
    const row = {};

    header.forEach((name, index) => {
      row[name] = fields[index] === undefined ? '' : fields[index];
    });

    return row;
  });
}

/**
 * Parse a perf CSV cell as a number, treating `N/A` and blanks as absent.
 *
 * Deliberately does NOT coerce a missing value to 0 — that is the #548
 * fabrication this repo's perf tooling exists to avoid.
 *
 * @param {string|undefined} value Raw cell.
 * @return {number|null} The number, or null when the cell carries no measurement.
 */
function numeric(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const text = String(value).trim();

  if (text === '' || text === UNMEASURED) {
    return null;
  }

  const parsed = Number(text);

  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Linear-interpolated percentile of a numeric sample.
 *
 * @param {Array<number>} values Sample; not required to be sorted.
 * @param {number} fraction Percentile in [0, 1].
 * @return {number|null} The percentile, or null for an empty sample.
 */
function percentile(values, fraction) {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);

  if (lower === upper) {
    return sorted[lower];
  }

  return sorted[lower] + ((sorted[upper] - sorted[lower]) * (position - lower));
}

/**
 * Median of a numeric sample.
 *
 * @param {Array<number>} values Sample.
 * @return {number|null} The median, or null for an empty sample.
 */
function median(values) {
  return percentile(values, 0.5);
}

/**
 * Whether the two passes' retention columns look the way the switch says they
 * should: measured on the blessed side, `N/A` on the control side.
 *
 * A control pass carrying numbers means `CONWAY_PERF_EXPOSE_GC` did not reach
 * the children, so the two passes differ in nothing and every timing
 * comparison below is between two identical configurations.
 *
 * @param {Array<Record<string, string>>} blessed Rows from the blessed pass.
 * @param {Array<Record<string, string>>} control Rows from the control pass.
 * @return {{blessedMeasured: number, blessedTotal: number,
 *           controlMeasured: number, controlTotal: number, valid: boolean}}
 *   Counts of rows carrying a measured `retainedRssMb` on each side, and
 *   whether the pair is a usable A/B.
 */
function checkSwitch(blessed, control) {
  const measured = (rows) =>
    rows.filter((row) => numeric(row.retainedRssMb) !== null).length;

  const blessedMeasured = measured(blessed);
  const controlMeasured = measured(control);

  return {
    blessedMeasured,
    blessedTotal: blessed.length,
    controlMeasured,
    controlTotal: control.length,
    // The blessed side must have measured something (else the flag never
    // reached the children there either, and there is no "on" condition), and
    // the control side must have measured nothing.
    valid: blessedMeasured > 0 && controlMeasured === 0,
  };
}

/**
 * Per-column statistics over the models both passes measured.
 *
 * @param {Array<{file: string, blessed: Record<string, string>,
 *                control: Record<string, string>}>} pairs Joined rows.
 * @param {string} column Column to summarise.
 * @param {boolean} applyFloor Whether to drop rows under RATIO_FLOOR_MS.
 * @return {{column: string, n: number, floored: number, medianRatio: number|null,
 *           p10: number|null, p90: number|null, slower: number,
 *           medianDelta: number|null}} Summary for one column.
 */
function summariseColumn(pairs, column, applyFloor) {
  const ratios = [];
  const deltas = [];
  let floored = 0;
  let slower = 0;

  for (const pair of pairs) {
    const on = numeric(pair.blessed[column]);
    const off = numeric(pair.control[column]);

    if (on === null || off === null) {
      continue;
    }

    // Floor BEFORE the divide-by-zero guard. A 0 ms stage is below the floor
    // by definition, so testing `off === 0` first dropped such a row out of
    // both `n` and `floored` and left the report's counts unable to account
    // for every pair — which is exactly what the header promises they can.
    // Not hypothetical: box.ifc parses in 1 ms in the committed snapshots,
    // one `Date.now()` tick away from 0, and a zero-geometry model's
    // `geometryTimeMs` is the same story.
    if (applyFloor && (on < RATIO_FLOOR_MS || off < RATIO_FLOOR_MS)) {
      ++floored;
      continue;
    }

    if (off === 0) {
      continue;
    }

    const ratio = on / off;

    ratios.push(ratio);
    deltas.push(on - off);

    if (ratio > 1) {
      ++slower;
    }
  }

  return {
    column,
    n: ratios.length,
    floored,
    medianRatio: median(ratios),
    p10: percentile(ratios, 0.1),
    p90: percentile(ratios, 0.9),
    slower,
    medianDelta: median(deltas),
  };
}

/**
 * Join the two passes on `file` and summarise every column of interest.
 *
 * Only rows with `status` OK on both sides are joined: a model that failed in
 * one pass has a timing that measures how far it got, not how long it takes.
 *
 * @param {Array<Record<string, string>>} blessedRows Blessed-pass rows.
 * @param {Array<Record<string, string>>} controlRows Control-pass rows.
 * @return {{pairs: Array<object>, timing: Array<object>, memory: Array<object>,
 *           switchCheck: object, blessedOnly: Array<string>,
 *           controlOnly: Array<string>}} The comparison.
 */
function compareRuns(blessedRows, controlRows) {
  const controlByFile = new Map(controlRows.map((row) => [row.file, row]));
  const blessedByFile = new Map(blessedRows.map((row) => [row.file, row]));
  const pairs = [];
  const blessedOnly = [];

  for (const blessed of blessedRows) {
    const control = controlByFile.get(blessed.file);

    if (control === undefined) {
      blessedOnly.push(blessed.file);
      continue;
    }

    if (blessed.status !== 'OK' || control.status !== 'OK') {
      continue;
    }

    pairs.push({ file: blessed.file, blessed, control });
  }

  const controlOnly = controlRows
      .filter((row) => !blessedByFile.has(row.file))
      .map((row) => row.file);

  return {
    pairs,
    timing: TIMING_COLUMNS.map((column) => summariseColumn(pairs, column, true)),
    memory: MEMORY_COLUMNS.map((column) => summariseColumn(pairs, column, false)),
    switchCheck: checkSwitch(blessedRows, controlRows),
    blessedOnly,
    controlOnly,
  };
}

/**
 * Format a number for the markdown tables, or an em dash when absent.
 *
 * @param {number|null} value The value.
 * @param {number} places Decimal places.
 * @param {string} [sign] '+' to force a leading sign on positives.
 * @return {string} Display text.
 */
function show(value, places, sign) {
  if (value === null || value === undefined) {
    return '—';
  }

  const text = value.toFixed(places);

  return (sign === '+' && value > 0) ? `+${text}` : text;
}

/**
 * Render the comparison as a GitHub-flavoured markdown section.
 *
 * @param {object} comparison Result of compareRuns.
 * @param {string} label Corpus/run label for the heading.
 * @return {string} Markdown, newline terminated.
 */
function renderMarkdown(comparison, label) {
  const { switchCheck, pairs, timing, memory } = comparison;
  const out = [];

  out.push(`### GC-settle A/B — two passes, one job (${label})`);
  out.push('');
  out.push(
      'Pass 1 is the blessed pass (shipped configuration, the settle runs and ' +
      'the retention columns are measured). Pass 2 is the control ' +
      '(`CONWAY_PERF_EXPOSE_GC=0`, no `global.gc`, retention `N/A`). Same ' +
      'runner, same checkout, same corpus, minutes apart — which is the only ' +
      'way this comparison is valid: between two separate CI runs the timing ' +
      'columns carry a ~1.5x runner scale factor, two orders of magnitude ' +
      'larger than the ~1% effect under test (conway#554).');
  out.push('');

  if (switchCheck.valid) {
    out.push(
        `**Switch check: OK.** Retention measured on ` +
        `${switchCheck.blessedMeasured}/${switchCheck.blessedTotal} blessed ` +
        `rows, on 0/${switchCheck.controlTotal} control rows.`);
  } else {
    out.push(
        `**Switch check: INVALID — the two passes were not in different ` +
        `configurations.** Retention measured on ` +
        `${switchCheck.blessedMeasured}/${switchCheck.blessedTotal} blessed ` +
        `rows and ${switchCheck.controlMeasured}/${switchCheck.controlTotal} ` +
        `control rows; the control pass should measure none. Everything ` +
        `below is a comparison of two identical configurations and answers ` +
        `nothing about the settle.`);
  }

  out.push('');
  out.push(`${pairs.length} model(s) measured OK in both passes.`);
  out.push('');
  out.push('| timing column | n | median on÷off | p10 | p90 | slower with gc on | median Δ ms | under 10 ms floor |');
  out.push('| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');

  for (const stat of timing) {
    out.push(
        `| \`${stat.column}\` | ${stat.n} | ${show(stat.medianRatio, 3)} | ` +
        `${show(stat.p10, 3)} | ${show(stat.p90, 3)} | ` +
        `${stat.slower}/${stat.n} | ${show(stat.medianDelta, 1, '+')} | ` +
        `${stat.floored} |`);
  }

  out.push('');
  out.push(
      '**How to read it — the sign matters.** A median ratio near 1.00 with ' +
      'the slower-count near half the models, and a p10/p90 band that ' +
      'straddles 1.00, is the design holding: both retention samples sit ' +
      'outside the timed region, so the settle cannot reach ' +
      '`parseTimeMs`/`geometryTimeMs`/`totalTimeMs`.');
  out.push('');
  out.push(
      'Above 1.00 across nearly every model (gc on SLOWER) is the settle ' +
      'leaking INTO the measured window — a bug to fix before anything is ' +
      'blessed against these numbers, not a tolerance to widen.');
  out.push('');
  out.push(
      'Below 1.00 across nearly every model (gc on FASTER) is the opposite ' +
      'and is not a defect in the blessed pass: the settle collects ' +
      'immediately before `parseStartMs`, so the blessed pass enters the ' +
      'timed region with the init garbage already paid for while the control ' +
      'pass carries it in and collects it inside the window. **That is an ' +
      'absolute cost, not a percentage.** Measured locally over 12 ' +
      'interleaved pairs it was 9-12 ms of `parseTimeMs` on two 2.5 MB ' +
      'models — 13-16% only because their parse takes about 60 ms — while ' +
      'MB-Khaya\'s 578 ms parse showed no resolvable effect at n=5, in the ' +
      'other direction and well inside its own spread. Expect this median to ' +
      'sit far nearer 1.00 than 0.85 for that reason, and read a per-model ' +
      'ratio against that model\'s own parse time rather than against the ' +
      'percentage; see design/new/perf-measurement.md. What it does mean is ' +
      'that a `parseTimeMs` from a post-conway#554 blessed snapshot is not ' +
      'comparable with one from before it — materially so on a fast parse, ' +
      'unresolvably on a slow one.');
  out.push('');
  out.push(
      'Model file I/O is outside all three columns (`parseStartMs` is taken ' +
      'after `readFileSync`), so pass order buys the second pass only warmer ' +
      'node/wasm module loads, not a warmer model read.');
  out.push('');
  out.push('| memory column (expected to move) | n | median on÷off | median Δ MB |');
  out.push('| --- | ---: | ---: | ---: |');

  for (const stat of memory) {
    out.push(
        `| \`${stat.column}\` | ${stat.n} | ${show(stat.medianRatio, 3)} | ` +
        `${show(stat.medianDelta, 2, '+')} |`);
  }

  out.push('');
  out.push(
      'The memory rows are information, not a finding: the blessed pass ' +
      'settles the heap immediately before the load, so its end-of-load ' +
      'sample starts from a collected floor the control pass never gets. ' +
      'Lower with the flag on is the expected direction.');
  out.push('');

  const slowest = [...pairs].sort((a, b) =>
    (numeric(b.blessed.totalTimeMs) ?? 0) - (numeric(a.blessed.totalTimeMs) ?? 0));

  out.push(`Slowest ${Math.min(TOP_MODELS, slowest.length)} model(s) by blessed total time:`);
  out.push('');
  out.push('| model | total on | total off | on÷off | parse on | parse off | geometry on | geometry off |');
  out.push('| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');

  for (const pair of slowest.slice(0, TOP_MODELS)) {
    const on = numeric(pair.blessed.totalTimeMs);
    const off = numeric(pair.control.totalTimeMs);
    const ratio = (on !== null && off !== null && off !== 0) ? on / off : null;

    out.push(
        `| ${pair.file} | ${pair.blessed.totalTimeMs} | ` +
        `${pair.control.totalTimeMs} | ${show(ratio, 3)} | ` +
        `${pair.blessed.parseTimeMs} | ${pair.control.parseTimeMs} | ` +
        `${pair.blessed.geometryTimeMs} | ${pair.control.geometryTimeMs} |`);
  }

  if (comparison.blessedOnly.length > 0 || comparison.controlOnly.length > 0) {
    out.push('');
    out.push(
        `Unpaired rows — blessed only: ${comparison.blessedOnly.length}, ` +
        `control only: ${comparison.controlOnly.length}.`);
  }

  out.push('');

  return `${out.join('\n')}\n`;
}

/**
 * Render the joined per-model comparison as a CSV, so the run's artifact
 * carries the numbers the markdown table summarises.
 *
 * @param {object} comparison Result of compareRuns.
 * @return {string} CSV text, newline terminated.
 */
function renderCsv(comparison) {
  const columns = [...TIMING_COLUMNS, ...MEMORY_COLUMNS];
  const header = ['file'];

  for (const column of columns) {
    header.push(`${column}_gcOn`, `${column}_gcOff`, `${column}_ratio`);
  }

  for (const column of RETENTION_COLUMNS) {
    header.push(`${column}_gcOn`);
  }

  const lines = [csvRow(header)];

  for (const pair of comparison.pairs) {
    const fields = [pair.file];

    for (const column of columns) {
      const on = numeric(pair.blessed[column]);
      const off = numeric(pair.control[column]);

      fields.push(
          on === null ? UNMEASURED : String(on),
          off === null ? UNMEASURED : String(off),
          (on === null || off === null || off === 0) ?
            UNMEASURED : (on / off).toFixed(4));
    }

    for (const column of RETENTION_COLUMNS) {
      fields.push(pair.blessed[column] ?? UNMEASURED);
    }

    lines.push(csvRow(fields));
  }

  return `${lines.join('\n')}\n`;
}

/**
 * CLI entry point.
 *
 * @return {void}
 */
function main() {
  const args = process.argv.slice(2);
  const labelIndex = args.indexOf('--label');
  let label = 'rc';

  if (labelIndex >= 0) {
    label = args[labelIndex + 1] ?? label;
    args.splice(labelIndex, 2);
  }

  const [blessedPath, controlPath, markdownPath, csvPath] = args;

  if (!blessedPath || !controlPath || !markdownPath) {
    console.error(
        'usage: perf_ab_compare.cjs <blessed.csv> <control.csv> <out.md> ' +
        '[<out.csv>] [--label <text>]');
    process.exit(2);
  }

  const comparison =
    compareRuns(readPerfCsv(blessedPath), readPerfCsv(controlPath));

  fs.writeFileSync(markdownPath, renderMarkdown(comparison, label));

  if (csvPath) {
    fs.writeFileSync(csvPath, renderCsv(comparison));
  }

  if (!comparison.switchCheck.valid) {
    console.log(
        '::warning::CONWAY_PERF_EXPOSE_GC A/B is invalid: the control pass ' +
        `measured retention on ${comparison.switchCheck.controlMeasured} row(s) ` +
        '(expected 0), so both passes ran in the same configuration.');
  }

  console.log(
      `Compared ${comparison.pairs.length} model(s); wrote ${markdownPath}` +
      `${csvPath ? ` and ${csvPath}` : ''}.`);
}

if (require.main === module) {
  main();
}

module.exports = {
  RATIO_FLOOR_MS,
  checkSwitch,
  compareRuns,
  median,
  numeric,
  percentile,
  readPerfCsv,
  renderCsv,
  renderMarkdown,
  summariseColumn,
};
