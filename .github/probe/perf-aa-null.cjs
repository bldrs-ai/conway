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
 *   all three equal        there is no pass-order term, and the I/O objection
 *                          is answered empirically.
 *
 * ANSWERED, run 33192612782: the third case. The corpus was already 100%
 * page-cache resident before P1 (actions/checkout with LFS writes it through
 * the cache), so there was no cold pass to decay from; a forced-cold P4 costs
 * +0.13% of corpus total and 0.000% on the median model. The floor this
 * measured is NOT the probe's 0.111% either -- it is 0.13-0.24% on the corpus
 * aggregate and ~1.4% median |delta| per model, which is the number that
 * matters and the reason a per-model call below ~5% is noise. See
 * design/new/perf-run-comparability.md Evidence 4.
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
 * WHERE THE DEMAND COMES FROM. The models this report is allowed to call the
 * corpus are read off a WALK OF THE CORPUS (`--corpus`, with the batch's own
 * `--corpus-exclude`), never off the pass outputs. Seeding the expected set
 * from the passes is the defect `pairedCoverage()` in
 * scripts/bless_perf_snapshot.cjs was rewritten to remove, and it has exactly
 * the same shape here: every pass runs the same batch driver over the same
 * tree, so a model no pass emits a row for is missing from all of them at
 * once, the join has nothing to notice, and the totals are published as
 * whole-corpus statistics over a corpus that is quietly smaller. The
 * filesystem is the one party in this chain that ran no pass.
 *
 * It is not a hypothetical: the public corpus at
 * baf0f87d (run 33192612782) walks 99 models under the batch's exclude and
 * every pass wrote 97 rows, because the per-model perf CSV is named
 * `<stem>.perf.csv` (`path.parse(ifcPath).name` in
 * src/ifc/ifc_regression_batch_main.ts) while the row inside it is keyed on
 * `path.basename()`. Two corpus models sharing a STEM therefore write one
 * file and one of them is lost before any analysis begins:
 * `ifc/index.ifc` vs `ifc/bldrs/index.ifc` (conway#633), and
 * `step/zoo.dev/a-gear.step` vs its `a-gear.stp` symlink. The measured
 * numbers are unaffected — the two lost models produce no rows to skew
 * anything — but "97 models" is 97 of 99, and this report now says which.
 *
 * Usage:
 *   node .github/probe/perf-aa-null.cjs --markdown <out.md> [--csv <out.csv>]
 *       [--label <text>] [--corpus <dir> [--corpus-exclude <regex>]]
 *       P1=perf-p1.csv P2=perf-p2.csv P3=perf-p3.csv ...
 *
 * Pass names are free-form and appear verbatim in the report; the order they
 * are given in is the order they ran in, and every ordered pair (i before j)
 * is reported. Analysis findings NEVER exit non-zero — this is an experiment's
 * reporter, and a run that produced numbers must hand them over even when the
 * numbers are bad. A coverage shortfall is not an exception to that: it is
 * reported at the top of the report, on `::warning::` and in the grep lines,
 * because a run that cost four corpus passes must still surrender them.
 */

const fs = require('fs');
const path = require('path');
const { csvRow } = require('../../scripts/csv_rfc4180.cjs');
// The SAME walk the paired gate's demand uses, rather than a second one
// written here: it already mirrors `collectIFCFiles()` in
// ifc_regression_batch_main.ts (recursive readdir, exclude tested against the
// resolved path before the dir/file split, extension-keyed), and two walks
// that are supposed to agree eventually will not.
const { collectCorpusModels } = require('../../scripts/bless_perf_snapshot.cjs');
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
 * What the corpus demands of every pass, keyed the way the perf CSVs are.
 *
 * TWO DIFFERENT KEYS ARE IN PLAY and the difference is the whole point:
 *
 *   the STEM   decides which file a child writes. `runForFile()` is handed
 *              `path.join(perfDir, `${path.parse(ifcPath).name}.perf.csv`)`,
 *              and the writer is `fsPromises.writeFile` — an overwrite. Two
 *              corpus models with the same stem therefore leave ONE file,
 *              whichever child finished last, and the other model is gone
 *              before `aggregatePerfCsvs()` reads the directory.
 *   the BASENAME is what lands in the row's `file` column
 *              (src/ifc/ifc_regression_main.ts), so it is what this analyser
 *              joins passes on.
 *
 * So the demand is expressed in basenames, but the collision that costs a
 * model is a STEM collision — which is strictly wider than the basename
 * collision `pairedCoverage()` reports: `a-gear.step` and `a-gear.stp` have
 * different basenames and the same stem, and only one of them is ever
 * measured. A colliding stem contributes NO expected basename, because which
 * of its models survived is not knowable from here; it is counted and named
 * instead, so the shortfall is stated rather than hidden inside a "missing"
 * count it would double.
 *
 * @param {Array<string>} corpusModels Model paths from collectCorpusModels().
 * @return {{models: number, expected: Array<string>,
 *   collisions: Array<{stem: string, paths: Array<string>}>,
 *   unmeasurable: number}} `expected` is what every pass must have written a
 *   row for; `unmeasurable` is how many corpus models the stem collisions
 *   cost, which no pass can ever recover.
 */
function corpusDemand(corpusModels) {
  const byStem = new Map();

  for (const modelPath of corpusModels) {
    const stem = path.parse(modelPath).name;

    byStem.set(stem, [...(byStem.get(stem) || []), modelPath]);
  }

  const expected = [];
  const collisions = [];
  let unmeasurable = 0;

  for (const [stem, paths] of byStem) {
    if (paths.length > 1) {
      collisions.push({ stem, paths: [...paths].sort() });
      unmeasurable += paths.length - 1;
      continue;
    }

    expected.push(path.basename(paths[0]));
  }

  return {
    models: corpusModels.length,
    expected: expected.sort(),
    collisions: collisions.sort((a, b) => (a.stem > b.stem ? 1 : -1)),
    unmeasurable,
  };
}

/**
 * Check the join against the corpus demand.
 *
 * `missing` says WHY as well as what: a model the passes dropped for a bad
 * status is a different failure from one that never appeared at all, and only
 * the second is the one the pass-seeded demand could not see.
 *
 * @param {{expected: Array<string>, collisions: Array<object>}} demand
 *   Output of corpusDemand.
 * @param {{models: Array<object>, dropped: Array<object>}} joined Join result.
 * @return {{missing: Array<{file: string, why: string}>,
 *   unexpected: Array<string>}} Empty arrays on full coverage.
 */
function corpusShortfall(demand, joined) {
  const measured = new Set(joined.models.map((model) => model.file));
  const droppedWhy = new Map(joined.dropped.map((d) => [d.file, d.why]));
  // A colliding stem's row is legitimately present under one of its
  // basenames, so neither of them is an unexpected row.
  const collided = new Set(demand.collisions.flatMap(
      (collision) => collision.paths.map((p) => path.basename(p))));
  const expected = new Set(demand.expected);

  return {
    missing: demand.expected
        .filter((file) => !measured.has(file))
        .map((file) => ({
          file,
          why: droppedWhy.get(file) ?? 'absent from every pass',
        })),
    unexpected: [...measured, ...droppedWhy.keys()]
        .filter((file) => !expected.has(file) && !collided.has(file))
        .sort(),
  };
}

/**
 * The coverage verdict, or a stated refusal to give one.
 *
 * @param {string} corpusRoot Corpus root, or '' when none was given.
 * @param {string} corpusExclude The batch's exclude regex source, or ''.
 * @param {{models: Array<object>, dropped: Array<object>}} joined Join result.
 * @return {object} `verified` false means the report may not describe its
 *   numbers as covering the corpus, and says which of the two reasons applies.
 */
function corpusCoverage(corpusRoot, corpusExclude, joined) {
  if (corpusRoot === '') {
    return { verified: false, corpusRoot, walkError: '' };
  }

  let corpusModels = null;

  try {
    corpusModels = collectCorpusModels(
        corpusRoot, corpusExclude !== '' ? new RegExp(corpusExclude) : undefined);
  } catch (e) {
    // A walk that throws leaves the demand unknown, which is a coverage
    // failure and not a reason to lose the report — the same call
    // bless_perf_snapshot.cjs makes on the same failure.
    return { verified: false, corpusRoot, walkError: e.message };
  }

  const demand = corpusDemand(corpusModels);
  const shortfall = corpusShortfall(demand, joined);

  return {
    verified: true,
    corpusRoot,
    walkError: '',
    ...demand,
    ...shortfall,
    measured: joined.models.length,
    complete: shortfall.missing.length === 0 &&
      shortfall.unexpected.length === 0 && demand.unmeasurable === 0,
  };
}

/**
 * The coverage section, which has to come before any statistic it qualifies.
 *
 * @param {object} coverage Output of corpusCoverage.
 * @return {Array<string>} Markdown lines.
 */
function renderCoverage(coverage) {
  const out = ['### Corpus coverage — what the passes were supposed to measure', ''];

  if (!coverage.verified) {
    out.push(
        coverage.walkError !== '' ?
          `**Coverage is unverified**: the corpus under \`${coverage.corpusRoot}\` ` +
          `could not be walked (${coverage.walkError}).` :
          '**Coverage is unverified**: no `--corpus` was given, so the only ' +
          'models this report knows about are the ones the passes themselves ' +
          'wrote rows for.',
        '',
        'A model absent from EVERY pass is invisible to a demand seeded that ' +
        'way — every pass shares one batch driver and one tree, so their ' +
        'losses are correlated. Read the numbers below as covering the models ' +
        'named in them, and **not** as whole-corpus statistics.',
        '');

    return out;
  }

  const collided = coverage.collisions.reduce(
      (sum, collision) => sum + collision.paths.length, 0);

  out.push(
      `Demanded of every pass by a walk of \`${coverage.corpusRoot}\` — the one ` +
      'input here that no pass produced.',
      '',
      '| | |',
      '|---|---:|',
      `| models in the corpus walk | ${coverage.models} |`,
      `| — of those, sharing a \`<stem>.perf.csv\` (${
        coverage.collisions.length} stem(s)) | ${collided} |`,
      `| — unmeasurable, lost to that sharing | ${coverage.unmeasurable} |`,
      `| demanded of every pass, one model to one row | ${
        coverage.expected.length} |`,
      `| — demanded and missing | ${coverage.missing.length} |`,
      `| measured but not in the corpus walk | ${coverage.unexpected.length} |`,
      `| **models carrying the statistics below** | **${
        coverage.measured} of ${coverage.models}** |`,
      '');

  if (coverage.collisions.length > 0) {
    out.push(
        `**${coverage.unmeasurable} corpus model(s) cannot be measured at ` +
        'all.** The per-model perf CSV is named after the model\'s stem and ' +
        'written with an overwrite, so models sharing a stem collapse to one ' +
        'row before any pass is analysed — and which of them survived is not ' +
        'recoverable from the row, so a colliding stem demands nothing and is ' +
        'counted here instead. This costs coverage, not accuracy: the lost ' +
        'models contribute no rows, so no statistic below is skewed by them — ' +
        'but the corpus is larger than the sample. Tracked as ' +
        '[conway#633](https://github.com/bldrs-ai/conway/issues/633).',
        '');

    for (const collision of coverage.collisions) {
      out.push(`- \`${collision.stem}\` ← ${
        collision.paths.map((p) => `\`${p}\``).join(', ')}`);
    }

    out.push('');
  }

  if (coverage.missing.length > 0) {
    out.push(
        `**Missing (${coverage.missing.length})** — demanded by the corpus ` +
        'walk, not delivered by the passes:',
        '');

    for (const entry of coverage.missing) {
      out.push(`- \`${entry.file}\` — ${entry.why}`);
    }

    out.push('');
  }

  if (coverage.unexpected.length > 0) {
    out.push(
        `**${coverage.unexpected.length} measured model(s) are not in the ` +
        'corpus walk**, so the walk and the passes disagree about what the ' +
        'corpus is and neither can be trusted as the denominator: ' +
        `${coverage.unexpected.map((f) => `\`${f}\``).join(', ')}.`,
        '');
  }

  return out;
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
 * @param {object} coverage Output of corpusCoverage — what the corpus walk
 *   demanded, or why the demand is unknown.
 * @return {string} Markdown, newline terminated.
 */
function renderMarkdown(passes, joined, label, coverage) {
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
      `statistics; ${dropped.length} did not.` +
      (coverage.verified ?
        ` The corpus walk finds ${coverage.models} model(s) under the ` +
        'batch\'s exclude, so every statistic below covers ' +
        `${models.length} of ${coverage.models} — see the coverage section ` +
        'directly beneath, and do not restate these numbers without it.' :
        ''));
  out.push('');
  out.push(...renderCoverage(coverage));
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
 * @param {object} coverage Output of corpusCoverage.
 * @return {Array<string>} The lines.
 */
function grepLines(passes, joined, coverage) {
  const lines = [`AA_MODELS_PAIRED=${joined.models.length}`];

  // Coverage first, and always present: a reader grepping AA_MEDIAN_* out of
  // a job log needs the denominator in the same place, or the median goes
  // into a document as a whole-corpus number again.
  lines.push(
      `AA_CORPUS_VERIFIED=${coverage.verified ? 1 : 0}`,
      `AA_CORPUS_MODELS=${coverage.verified ? coverage.models : 'N/A'}`,
      `AA_CORPUS_DEMANDED=${
        coverage.verified ? coverage.expected.length : 'N/A'}`,
      `AA_CORPUS_UNMEASURABLE=${
        coverage.verified ? coverage.unmeasurable : 'N/A'}`,
      `AA_CORPUS_MISSING=${
        coverage.verified ? coverage.missing.length : 'N/A'}`,
      `AA_CORPUS_UNEXPECTED=${
        coverage.verified ? coverage.unexpected.length : 'N/A'}`);

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
  // Flag -> option key, spelled out rather than derived from the flag text,
  // so `--corpus-exclude` lands somewhere addressable.
  const valueFlags = {
    '--label': 'label',
    '--markdown': 'markdown',
    '--csv': 'csv',
    '--corpus': 'corpus',
    '--corpus-exclude': 'corpusExclude',
  };
  const options =
    { label: 'aa', markdown: '', csv: '', corpus: '', corpusExclude: '' };
  const passes = [];

  for (let i = 0; i < args.length; ++i) {
    if (valueFlags[args[i]] !== undefined) {
      options[valueFlags[args[i]]] = args[++i] ?? '';
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
        '[--label <text>] [--corpus <dir> [--corpus-exclude <regex>]] ' +
        'P1=perf-p1.csv P2=perf-p2.csv ...');
    process.exit(2);
  }

  for (const pass of passes) {
    pass.rows = readPerfCsv(pass.path);
  }

  const joined = joinPasses(passes);
  const coverage =
    corpusCoverage(options.corpus, options.corpusExclude, joined);

  fs.writeFileSync(
      options.markdown,
      renderMarkdown(passes, joined, options.label, coverage));

  if (options.csv) {
    fs.writeFileSync(options.csv, renderCsv(passes, joined));
  }

  console.log(grepLines(passes, joined, coverage).join('\n'));

  // An annotation, not an exit code: the report is the deliverable of four
  // corpus passes and must survive its own bad news. It goes to the log the
  // same way `reportPairedSkipped()` announces a withheld paired delta.
  if (!coverage.verified) {
    console.warn(
        '::warning::A/A coverage is unverified' +
        `${coverage.walkError !== '' ? ` (${coverage.walkError})` : ''}; ` +
        'the report\'s numbers cover the models the passes wrote and cannot ' +
        'be described as whole-corpus.');
  } else if (!coverage.complete) {
    console.warn(
        `::warning::A/A coverage is ${joined.models.length} of ` +
        `${coverage.models} corpus model(s): ${coverage.unmeasurable} ` +
        `unmeasurable (shared perf-CSV stem), ${coverage.missing.length} ` +
        `missing, ${coverage.unexpected.length} not in the corpus walk.`);
  }

  console.log(
      `Paired ${joined.models.length} model(s) across ${passes.length} ` +
      `pass(es)` +
      `${coverage.verified ? ` of ${coverage.models} in the corpus` : ''}; ` +
      `wrote ${options.markdown}` +
      `${options.csv ? ` and ${options.csv}` : ''}.`);
}

if (require.main === module) {
  main();
}

module.exports = {
  RATIO_FLOOR_MS,
  changesFor,
  corpusCoverage,
  corpusDemand,
  corpusShortfall,
  joinPasses,
  orderedPairs,
  passTotals,
  renderCoverage,
  renderCsv,
  renderMarkdown,
  summarise,
};
