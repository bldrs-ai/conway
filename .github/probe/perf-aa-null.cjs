#!/usr/bin/env node

'use strict';

/**
 * The A/A null test's analyser: difference N passes of the SAME engine over
 * the SAME corpus, run back to back inside one job, against each other.
 *
 * WHAT QUESTION THIS ANSWERS. conway#632 pairs two engine pins inside one rc
 * job so that the ~11.24% between-machine factor cancels
 * (design/new/perf-run-comparability.md). The residual noise floor that
 * pairing leaves behind is quoted as 0.111%, but that number came from the
 * perf-counter probe, whose workload header states it does
 * "no I/O, no network, no filesystem reads (page-cache state would leak in)".
 * The paired passes do exactly the I/O the probe excluded: both read the whole
 * corpus off disk, in a fixed order, first pass cold and second pass warm. So
 * 0.111% cannot bound the paired configuration, and this script measures what
 * does.
 *
 * Under perfect pairing, two passes of an identical engine must differ by ~0.
 * Every non-zero this reports is methodology bias — pass order, page cache,
 * machine warming — measured rather than argued.
 *
 * THE THIRD PASS IS WHAT MAKES IT DIAGNOSTIC. Two passes say only that an
 * effect exists. Three say what SHAPE it has, and the shape decides the fix:
 *
 *   P1 slow, P2 == P3      one-time cold-start cost. A single pre-warm pass,
 *                          or discarding pass 1, removes it completely.
 *   P1 > P2 > P3           something cumulative (thermal, allocator, host
 *                          scheduling). A pre-warm is NOT enough.
 *   all three equal        pairing's noise floor really is the probe's, and
 *                          the I/O objection is answered empirically.
 *
 * WHICH STATISTIC. The rc gate's headline number is the MEDIAN over models of
 * `totalTimeMsPercentageChange`, with p10/p90 either side — see the "Summarize
 * the paired delta" step in .github/workflows/rc-regression.yml and
 * `computePercentageChange` in scripts/gen_delta_csv.cjs, which is
 * `(newer - older) / older * 100` with NO small-model floor. This script's
 * primary table reproduces that statistic exactly, so its median is directly
 * readable against the gate's. A second table applies perf_ab_compare's 10 ms
 * floor, because a 3 ms stage carries a +/-1 ms `Date.now()` quantisation that
 * is a 33% "delta" of pure rounding; the two tables together separate a real
 * systematic shift from quantisation noise on the small end.
 *
 * WHY THE COLUMN SPLIT IS THE LOAD-BEARING PART. conway#562 redefined
 * `totalTimeMs` as the load's wall clock — `loadStartMs` is taken BEFORE
 * `readFileSync` (src/ifc/ifc_regression_main.ts, src/AP214E3_2010/
 * ap214_regression_main.ts), so `totalTimeMs` contains the model file read.
 * `parseStartMs` is taken after it, so `parseTimeMs`, `geometryTimeMs` and
 * `parsePlusGeometryMs` do not. That makes the two families a natural control
 * for each other: a P1->P2 gap that lands on `totalTimeMs` while
 * `parsePlusGeometryMs` stays flat is page-cache I/O and nothing else, which
 * is a far stronger conclusion than the totals alone can support. A gap that
 * shows up in BOTH is compute — machine warming, not the file read.
 *
 * Usage:
 *   node .github/probe/perf-aa-null.cjs --markdown <out.md> [--csv <out.csv>]
 *       [--label <text>] P1=perf-p1.csv P2=perf-p2.csv P3=perf-p3.csv ...
 *
 * Pass names are free-form and appear verbatim in the report; the order they
 * are given in is the order they ran in, and every ordered pair (i before j)
 * is reported. Analysis findings NEVER exit non-zero — this is an experiment's
 * reporter, and a run that produced numbers must hand them over even when the
 * numbers are bad.
 */

const fs = require('fs');
const { csvRow } = require('../../scripts/csv_rfc4180.cjs');
const {
  median,
  numeric,
  percentile,
  readPerfCsv,
} = require('../../scripts/perf_ab_compare.cjs');

/**
 * The timing columns, ordered so the report reads as its own argument:
 * `totalTimeMs` is what the gate computes on and the only one containing the
 * file read; `parsePlusGeometryMs` is the same span minus the I/O and so is
 * the control; the two stages break that control down further.
 */
const TIMING_COLUMNS =
  ['totalTimeMs', 'parsePlusGeometryMs', 'parseTimeMs', 'geometryTimeMs'];

/** Below this, `Date.now()` quantisation dominates a percentage. */
const RATIO_FLOOR_MS = 10;

/** Movement thresholds the report counts models against, in percent. */
const MOVEMENT_THRESHOLDS = [1, 2, 5];

/** How many per-model rows the "biggest movers" table shows. */
const TOP_MOVERS = 12;

/**
 * Join every pass on `file`, keeping only models that came back OK in all of
 * them.
 *
 * A model that failed in one pass has a timing that measures how far it got,
 * not how long it takes, and a model missing from one pass has no pair at all.
 * Both are counted and reported rather than silently dropped — the point of an
 * A/A test is that nothing about it is allowed to be quietly asymmetric.
 *
 * @param {Array<{name: string, rows: Array<Record<string, string>>}>} passes
 *   The passes, in the order they ran.
 * @return {{models: Array<{file: string, byPass: Map<string,
 *   Record<string, string>>}>, dropped: Array<{file: string, why: string}>}}
 *   The models present and OK everywhere, plus why each other model is absent.
 */
function joinPasses(passes) {
  const byFile = new Map();

  for (const pass of passes) {
    for (const row of pass.rows) {
      if (!byFile.has(row.file)) {
        byFile.set(row.file, new Map());
      }

      byFile.get(row.file).set(pass.name, row);
    }
  }

  const models = [];
  const dropped = [];

  for (const [file, rowsByPass] of byFile) {
    const missing =
      passes.filter((pass) => !rowsByPass.has(pass.name)).map((p) => p.name);

    if (missing.length > 0) {
      dropped.push({ file, why: `missing from ${missing.join(', ')}` });
      continue;
    }

    const notOk = passes
        .filter((pass) => rowsByPass.get(pass.name).status !== 'OK')
        .map((p) => p.name);

    if (notOk.length > 0) {
      dropped.push({ file, why: `status not OK in ${notOk.join(', ')}` });
      continue;
    }

    models.push({ file, byPass: rowsByPass });
  }

  return { models, dropped };
}

/**
 * Every ordered pair of passes, earlier first.
 *
 * Consecutive pairs carry the shape question (is P2->P3 flat where P1->P2 is
 * not?); the non-consecutive ones are what say whether the effect accumulates.
 *
 * @param {Array<{name: string}>} passes Passes in run order.
 * @return {Array<{from: string, to: string, adjacent: boolean}>} The pairs.
 */
function orderedPairs(passes) {
  const pairs = [];

  for (let i = 0; i < passes.length; ++i) {
    for (let j = i + 1; j < passes.length; ++j) {
      pairs.push({
        from: passes[i].name,
        to: passes[j].name,
        adjacent: j === i + 1,
      });
    }
  }

  return pairs;
}

/**
 * Per-model percentage changes for one pass pair and one column.
 *
 * The percentage is the gate's own: `(later - earlier) / earlier * 100`, so a
 * positive number means the LATER pass was slower.
 *
 * @param {Array<object>} models Joined models from joinPasses.
 * @param {{from: string, to: string}} pair The pass pair.
 * @param {string} column Timing column.
 * @param {boolean} applyFloor Drop rows under RATIO_FLOOR_MS on either side.
 * @return {{values: Array<number>, files: Array<string>, floored: number,
 *           unmeasured: number}} The sample, aligned with its file names.
 */
function changesFor(models, pair, column, applyFloor) {
  const values = [];
  const files = [];
  let floored = 0;
  let unmeasured = 0;

  for (const model of models) {
    const earlier = numeric(model.byPass.get(pair.from)[column]);
    const later = numeric(model.byPass.get(pair.to)[column]);

    if (earlier === null || later === null) {
      ++unmeasured;
      continue;
    }

    // Floor before the divide-by-zero guard, so a 0 ms stage is accounted for
    // as floored rather than vanishing from both counts — the same ordering
    // fix perf_ab_compare.cjs carries, and for the same reason (box.ifc parses
    // in 1 ms; a zero-geometry model's geometryTimeMs is literally 0).
    if (applyFloor && (earlier < RATIO_FLOOR_MS || later < RATIO_FLOOR_MS)) {
      ++floored;
      continue;
    }

    if (earlier === 0) {
      ++unmeasured;
      continue;
    }

    values.push(((later - earlier) / earlier) * 100);
    files.push(model.file);
  }

  return { values, files, floored, unmeasured };
}

/**
 * Summarise one sample of percentage changes.
 *
 * @param {{values: Array<number>, floored: number, unmeasured: number}} sample
 *   Output of changesFor.
 * @return {object} n, the distribution, and the movement counts.
 */
function summarise(sample) {
  const { values } = sample;
  const moved = {};

  for (const threshold of MOVEMENT_THRESHOLDS) {
    moved[threshold] = values.filter((v) => Math.abs(v) > threshold).length;
  }

  return {
    n: values.length,
    floored: sample.floored,
    unmeasured: sample.unmeasured,
    median: median(values),
    p10: percentile(values, 0.1),
    p90: percentile(values, 0.9),
    min: values.length > 0 ? Math.min(...values) : null,
    max: values.length > 0 ? Math.max(...values) : null,
    // The median of |change| is the noise-floor number: it does not let a
    // symmetric scatter cancel itself into a reassuring ~0 median.
    medianAbs: median(values.map(Math.abs)),
    slower: values.filter((v) => v > 0).length,
    moved,
  };
}

/**
 * Corpus-total time per pass — the second, independent aggregate.
 *
 * The per-model median can sit at ~0 while the pass as a whole moved, if the
 * movement is concentrated in the few big models. Summing over exactly the
 * models the per-model tables use keeps the two views comparable.
 *
 * @param {Array<object>} models Joined models.
 * @param {Array<{name: string}>} passes Passes in run order.
 * @param {string} column Timing column.
 * @return {Array<{name: string, total: number}>} Totals in run order.
 */
function passTotals(models, passes, column) {
  return passes.map((pass) => ({
    name: pass.name,
    total: models.reduce((sum, model) => {
      const value = numeric(model.byPass.get(pass.name)[column]);

      return sum + (value ?? 0);
    }, 0),
  }));
}

/**
 * Format a number, or an em dash when there is nothing to format.
 *
 * @param {number|null} value The value.
 * @param {number} places Decimal places.
 * @param {boolean} [signed] Force a leading + on positives.
 * @return {string} Display text.
 */
function show(value, places, signed) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—';
  }

  const text = value.toFixed(places);

  return (signed && value > 0) ? `+${text}` : text;
}

/**
 * Render one statistics table over every pair, for one column set.
 *
 * @param {Array<object>} models Joined models.
 * @param {Array<object>} pairs Ordered pass pairs.
 * @param {boolean} applyFloor Whether the 10 ms floor is applied.
 * @return {Array<string>} Markdown lines.
 */
function renderTable(models, pairs, applyFloor) {
  const out = [];

  out.push(
      '| pair | column | n | median % | median abs % | p10 % | p90 % | ' +
      'min % | max % | >1% | >2% | >5% | later slower | < 10 ms |');
  out.push(
      '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: ' +
      '| ---: | ---: | ---: | ---: |');

  for (const pair of pairs) {
    for (const column of TIMING_COLUMNS) {
      const stat = summarise(changesFor(models, pair, column, applyFloor));

      out.push(
          `| ${pair.from}→${pair.to} | \`${column}\` | ${stat.n} | ` +
          `**${show(stat.median, 3, true)}** | ${show(stat.medianAbs, 3)} | ` +
          `${show(stat.p10, 3, true)} | ${show(stat.p90, 3, true)} | ` +
          `${show(stat.min, 2, true)} | ${show(stat.max, 2, true)} | ` +
          `${stat.moved[1]} | ${stat.moved[2]} | ${stat.moved[5]} | ` +
          `${stat.slower}/${stat.n} | ${stat.floored} |`);
    }
  }

  return out;
}

/**
 * The cold-cache shape verdict: is the first gap large and the second one not?
 *
 * Stated as a ratio of median absolute changes rather than of medians, because
 * a symmetric scatter has a ~0 median and would make any two passes look
 * identically flat.
 *
 * @param {Array<object>} models Joined models.
 * @param {Array<{name: string}>} passes Passes in run order.
 * @return {Array<string>} Markdown lines, empty when there are under 3 passes.
 */
function renderVerdict(models, passes) {
  if (passes.length < 3) {
    return [];
  }

  const first = { from: passes[0].name, to: passes[1].name };
  const second = { from: passes[1].name, to: passes[2].name };
  const out = [];

  out.push('### Is the effect cold-cache-shaped?');
  out.push('');
  out.push(
      `\`${first.from}→${first.to}\` is the gap a one-time warm-up would ` +
      `remove; \`${second.from}→${second.to}\` is what is left once ` +
      'everything is warm. A large first gap with a near-zero second one is ' +
      'a pure cold-start cost, and the fix for conway#632 is a discarded ' +
      'pre-warm pass. Two comparable gaps mean the drift is cumulative and a ' +
      'pre-warm does not fix it.');
  out.push('');
  out.push(
      '| column | median abs % first gap | median abs % second gap | ' +
      'first ÷ second |');
  out.push('| --- | ---: | ---: | ---: |');

  for (const column of TIMING_COLUMNS) {
    const a = summarise(changesFor(models, first, column, true)).medianAbs;
    const b = summarise(changesFor(models, second, column, true)).medianAbs;
    // A second gap of exactly 0 is the strongest possible cold-start result,
    // so it must not render as the same em dash that means "no sample".
    const ratio = (a === null || b === null) ? '—' :
      (b === 0 ? (a === 0 ? '1' : '∞') : show(a / b, 2));

    out.push(`| \`${column}\` | ${show(a, 3)} | ${show(b, 3)} | ${ratio} |`);
  }

  out.push('');
  out.push(
      'Read the `totalTimeMs` row against the `parsePlusGeometryMs` row ' +
      'directly beneath it. `totalTimeMs` starts before `readFileSync` and ' +
      '`parsePlusGeometryMs` starts after it, so a first gap that appears ' +
      'only in `totalTimeMs` is the model file read coming out of the page ' +
      'cache the second time — I/O, not compute. A first gap present in ' +
      'both is machine warming, which no amount of corpus pre-reading fixes.');

  return out;
}

/**
 * Render the whole report.
 *
 * @param {Array<{name: string, rows: Array<object>}>} passes Passes in order.
 * @param {{models: Array<object>, dropped: Array<object>}} joined Join result.
 * @param {string} label Corpus/run label for the heading.
 * @return {string} Markdown, newline terminated.
 */
function renderMarkdown(passes, joined, label) {
  const { models, dropped } = joined;
  const pairs = orderedPairs(passes);
  const out = [];

  out.push(`## A/A null test — identical engine, ${passes.length} passes, one job (${label})`);
  out.push('');
  out.push(
      'Same installed build, same corpus, same runner, back to back, with ' +
      'nothing varying but position in the sequence. Under perfect pairing ' +
      'every number below is 0. Whatever is not 0 is methodology bias — pass ' +
      'order, page cache, machine warming — and it bounds what conway#632\'s ' +
      'in-job pairing can resolve.');
  out.push('');
  out.push(
      `Passes, in run order: ${passes.map((p) => `\`${p.name}\` ` +
      `(${p.rows.length} rows)`).join(', ')}.`);
  out.push('');
  out.push(
      `${models.length} model(s) came back OK in every pass and carry the ` +
      `statistics; ${dropped.length} did not.`);
  out.push('');
  out.push(
      '### Per-model percentage change, as the rc gate computes it (no floor)');
  out.push('');
  out.push(
      'Positive = the later pass was slower. This is exactly ' +
      '`totalTimeMsPercentageChange` from `scripts/gen_delta_csv.cjs`, ' +
      'summarised the way the rc job\'s "Summarize the paired delta" step ' +
      'summarises it, so the median here is directly comparable with the ' +
      'median a real paired rc run reports.');
  out.push('');
  out.push(...renderTable(models, pairs, false));
  out.push('');
  out.push('### The same, with sub-10 ms stages excluded');
  out.push('');
  out.push(
      'Stage timings come from `Date.now()`, so a 3 ms parse carries a ' +
      '+/-1 ms quantisation — a 33% "change" that is pure rounding. Rows ' +
      'under 10 ms on either side are excluded here and counted in the last ' +
      'column. Where this table is quiet and the one above is not, the ' +
      'movement is small-model quantisation, not drift.');
  out.push('');
  out.push(...renderTable(models, pairs, true));
  out.push('');
  out.push(...renderVerdict(models, passes));
  out.push('');
  out.push('### Corpus totals — the aggregate view');
  out.push('');
  out.push(
      'The per-model median can sit at ~0 while the pass as a whole moved, ' +
      'if the movement is concentrated in the few large models the gate\'s ' +
      'median cannot see. Summed over the same models as the tables above.');
  out.push('');

  for (const column of TIMING_COLUMNS) {
    const totals = passTotals(models, passes, column);
    const base = totals[0].total;

    out.push(
        `\`${column}\`: ` +
        totals.map((t) => `${t.name} ${(t.total / 1000).toFixed(1)}s` +
          (t === totals[0] ? '' :
            ` (${show(((t.total - base) / base) * 100, 2, true)}% vs ` +
            `${totals[0].name})`)).join(', '));
    out.push('');
  }

  if (passes.length >= 2) {
    const pair = { from: passes[0].name, to: passes[passes.length - 1].name };
    const sample = changesFor(models, pair, 'totalTimeMs', true);
    const ordered = sample.values
        .map((value, index) => ({ value, file: sample.files[index] }))
        .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

    out.push(
        `### Biggest movers, ${pair.from}→${pair.to}, \`totalTimeMs\``);
    out.push('');
    out.push('| model | change % | ' +
      passes.map((p) => `${p.name} ms`).join(' | ') + ' |');
    out.push('| --- | ---: |' + passes.map(() => ' ---: |').join(''));

    for (const mover of ordered.slice(0, TOP_MOVERS)) {
      const model = models.find((m) => m.file === mover.file);

      out.push(
          `| ${mover.file} | ${show(mover.value, 2, true)} | ` +
          `${passes.map((p) =>
            model.byPass.get(p.name).totalTimeMs).join(' | ')} |`);
    }

    out.push('');
  }

  if (dropped.length > 0) {
    out.push(`Excluded models (${dropped.length}):`);
    out.push('');

    for (const entry of dropped) {
      out.push(`- \`${entry.file}\` — ${entry.why}`);
    }

    out.push('');
  }

  return `${out.join('\n')}\n`;
}

/**
 * Grep-friendly key=value lines, so the headline numbers are reachable from a
 * job log without parsing the markdown — the same affordance
 * perf-counter-probe.mjs's `PROBE_` lines give.
 *
 * @param {Array<{name: string}>} passes Passes in run order.
 * @param {{models: Array<object>}} joined Join result.
 * @return {Array<string>} The lines.
 */
function grepLines(passes, joined) {
  const lines = [`AA_MODELS_PAIRED=${joined.models.length}`];

  for (const pair of orderedPairs(passes)) {
    for (const column of TIMING_COLUMNS) {
      const raw = summarise(changesFor(joined.models, pair, column, false));
      const floored = summarise(changesFor(joined.models, pair, column, true));
      const key = `${pair.from}_${pair.to}_${column}`;

      lines.push(
          `AA_MEDIAN_${key}=${show(raw.median, 3)}`,
          `AA_MEDIANABS_${key}=${show(raw.medianAbs, 3)}`,
          `AA_P10_${key}=${show(raw.p10, 3)}`,
          `AA_P90_${key}=${show(raw.p90, 3)}`,
          `AA_MEDIANABS_FLOORED_${key}=${show(floored.medianAbs, 3)}`,
          `AA_OVER1PCT_${key}=${raw.moved[1]}/${raw.n}`);
    }
  }

  return lines;
}

/**
 * The per-model numbers behind the tables, so the artifact carries the raw
 * join and not only its summary.
 *
 * @param {Array<{name: string}>} passes Passes in run order.
 * @param {{models: Array<object>}} joined Join result.
 * @return {string} CSV text, newline terminated.
 */
function renderCsv(passes, joined) {
  const pairs = orderedPairs(passes);
  const header = ['file'];

  for (const pass of passes) {
    for (const column of TIMING_COLUMNS) {
      header.push(`${column}_${pass.name}`);
    }
  }

  for (const pair of pairs) {
    for (const column of TIMING_COLUMNS) {
      header.push(`${column}_pct_${pair.from}_${pair.to}`);
    }
  }

  const lines = [csvRow(header)];

  for (const model of joined.models) {
    const fields = [model.file];

    for (const pass of passes) {
      for (const column of TIMING_COLUMNS) {
        fields.push(model.byPass.get(pass.name)[column] ?? 'N/A');
      }
    }

    for (const pair of pairs) {
      for (const column of TIMING_COLUMNS) {
        const earlier = numeric(model.byPass.get(pair.from)[column]);
        const later = numeric(model.byPass.get(pair.to)[column]);

        fields.push(
            (earlier === null || later === null || earlier === 0) ?
              'N/A' : (((later - earlier) / earlier) * 100).toFixed(4));
      }
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
  const options = { label: 'aa', markdown: '', csv: '' };
  const passes = [];

  for (let i = 0; i < args.length; ++i) {
    if (args[i] === '--label' || args[i] === '--markdown' ||
        args[i] === '--csv') {
      options[args[i].slice(2)] = args[++i] ?? '';
      continue;
    }

    const split = args[i].indexOf('=');

    if (split < 0) {
      console.error(`Not a NAME=path pass argument: ${args[i]}`);
      process.exit(2);
    }

    passes.push({
      name: args[i].slice(0, split),
      path: args[i].slice(split + 1),
    });
  }

  if (passes.length < 2 || !options.markdown) {
    console.error(
        'usage: perf-aa-null.cjs --markdown <out.md> [--csv <out.csv>] ' +
        '[--label <text>] P1=perf-p1.csv P2=perf-p2.csv ...');
    process.exit(2);
  }

  for (const pass of passes) {
    pass.rows = readPerfCsv(pass.path);
  }

  const joined = joinPasses(passes);

  fs.writeFileSync(options.markdown, renderMarkdown(passes, joined, options.label));

  if (options.csv) {
    fs.writeFileSync(options.csv, renderCsv(passes, joined));
  }

  console.log(grepLines(passes, joined).join('\n'));
  console.log(
      `Paired ${joined.models.length} model(s) across ${passes.length} ` +
      `pass(es); wrote ${options.markdown}` +
      `${options.csv ? ` and ${options.csv}` : ''}.`);
}

if (require.main === module) {
  main();
}

module.exports = {
  RATIO_FLOOR_MS,
  changesFor,
  joinPasses,
  orderedPairs,
  passTotals,
  renderCsv,
  renderMarkdown,
  summarise,
};
