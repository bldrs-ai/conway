import fs from 'fs'
import os from 'os'
import path from 'path'
import { execFileSync } from 'child_process'
import { describe, expect, test, beforeEach, afterEach } from '@jest/globals'
import { createRequire } from 'module'

/**
 * In-job pairing: the `measurementBasis` column, and how the rc job resolves
 * which previously-published engine to pair against.
 *
 * The rc's timing delta used to compare this run against numbers a previous
 * run froze into the committed snapshot. That comparison has a MEASURED
 * 13.66% median noise floor — two attempts of one job, same commit,
 * byte-identical digests, all 97 models faster on the second attempt —
 * against a 9.40% median regression it was reporting, because
 * `ubuntu-24.04-4vcpu-8gb-150gbssd` is a label spanning three CPU models
 * across two vendors. Full evidence in design/new/perf-run-comparability.md.
 *
 * Two things have to hold for the fix to be readable rather than merely
 * present, and both are pinned here:
 *
 *   1. A release directory now ships TWO deltas with identical column
 *      layouts. Each row must state which kind it is, or the whole change
 *      just doubles the number of files someone can misread.
 *   2. The paired pass and the cross-run delta must select the SAME
 *      predecessor. If they diverge, the two files describe different
 *      comparisons while looking interchangeable — strictly worse than the
 *      state this replaced.
 */
const require_ = createRequire(import.meta.url)

// Resolved from the repo root: the test runs from compiled/src/scripts and
// scripts/ is not part of the tsc build. Jest's rootDir is the repo root.
const { generateDeltaCSV, MEASUREMENT_BASIS } =
  require_(path.resolve(process.cwd(), 'scripts/gen_delta_csv.cjs')) as {
    generateDeltaCSV: (
      a: string, b: string, out: string, isWebIfc?: boolean,
      measurementBasis?: string) => void,
    MEASUREMENT_BASIS: { PAIRED: string, CROSS_RUN: string },
  }

const { publishedVersion } =
  require_(path.resolve(process.cwd(), 'scripts/resolve_previous_pin.cjs')) as {
    publishedVersion: (version: string, engine: string) => string,
  }

const { findPreviousSnapshot } =
  require_(path.resolve(process.cwd(), 'scripts/bless_perf_snapshot.cjs')) as {
    findPreviousSnapshot: (dir: string, self: string, version: string) =>
      { name: string, version: string, engine: string } | null,
  }

const { parseCsv } =
  require_(path.resolve(process.cwd(), 'scripts/csv_rfc4180.cjs')) as {
    parseCsv: (text: string) => string[][],
  }

const DETAIL_HEADER = [
  'timestamp', 'loadStatus', 'writer', 'uname', 'engine', 'filename',
  'schemaVersion', 'parseTimeMs', 'geometryTimeMs', 'totalTimeMs',
  'parsePlusGeometryMs', 'geometryMemoryMb', 'peakWasmHeapMb', 'rssMb',
  'peakRssMb', 'heapUsedMb', 'heapTotalMb', 'externalMb', 'arrayBuffersMb',
  'retainedRssMb', 'retainedHeapUsedMb', 'retainedExternalMb',
  'preprocessorVersion', 'originatingSystem',
]

/**
 * A performance-detail.csv in the committed convention.
 *
 * @param engine Engine label for the `engine` column.
 * @param models Filename -> that row's `totalTimeMs`, which is what the delta
 *   differences. Order is preserved, so a test can assert row order.
 * @return The whole file, header included.
 */
function detailCsvFor(
    engine: string, models: [string, string][]): string {
  const rows = models.map(([filename, totalTimeMs]) => [
    '20260828000000', 'OK', 'ifc-regression', 'x64', engine, filename,
    'IFC4', '10', '20', totalTimeMs, '30', '1.5', '64', '120', '130', '20',
    '30', '5', '4', '2', '1', '0.5', 'N/A', 'N/A',
  ].join(','))

  return `${DETAIL_HEADER.join(',')}\n${rows.join('\n')}\n`
}

/**
 * The one-model case, which is what most of these tests need.
 *
 * @param engine Engine label for the `engine` column.
 * @param totalTimeMs The row's total.
 * @return The whole file, header included.
 */
function detailCsv(engine: string, totalTimeMs: string): string {
  return detailCsvFor(engine, [['index.ifc', totalTimeMs]])
}

let workDir: string

beforeEach(() => {
  workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'perf-pairing-'))
})

afterEach(() => {
  fs.rmSync(workDir, { recursive: true, force: true })
})

describe('measurementBasis', () => {

  /**
   * Write the two inputs and produce a delta from them.
   *
   * @param basis Value to pass through, or undefined to take the default.
   * @return The parsed delta CSV, header row included.
   */
  function delta(basis?: string): string[][] {
    const older = path.join(workDir, 'older.csv')
    const newer = path.join(workDir, 'newer.csv')
    const out = path.join(workDir, 'delta.csv')

    fs.writeFileSync(older, detailCsv('conway1.4.0-ci', '100'), 'utf8')
    fs.writeFileSync(newer, detailCsv('conway1.5.0-ci', '90'), 'utf8')
    generateDeltaCSV(older, newer, out, false, basis)

    return parseCsv(fs.readFileSync(out, 'utf8'))
  }

  test('defaults to crossRun, because that is what the archive is', () => {
    // Every historical delta in benchmarks/ was measured this way and none of
    // them recorded it. A default of `paired` would relabel that archive as
    // trustworthy on the next tool that regenerates it.
    const rows = delta()
    const columns = rows[0]
    const index = columns.indexOf('measurementBasis')

    expect(index).toBeGreaterThanOrEqual(0)
    expect(rows[1][index]).toBe('crossRun')
  })

  test('carries `paired` through to every row', () => {
    const rows = delta(MEASUREMENT_BASIS.PAIRED)
    const index = rows[0].indexOf('measurementBasis')

    expect(rows.length).toBeGreaterThan(1)
    for (const row of rows.slice(1)) {
      expect(row[index]).toBe('paired')
    }
  })

  test('is the last column, so an added column is not a reshuffle', () => {
    // The delta files are committed. Inserting mid-header would rewrite every
    // cell position in the diff of a re-blessed directory, hiding the actual
    // measurement churn the reviewer is there to read.
    const columns = delta()[0]

    expect(columns[columns.length - 1]).toBe('measurementBasis')
  })

  test('does not disturb the columns beside it', () => {
    // The point of the column is to make the OTHER columns readable; it must
    // not change what they say.
    const rows = delta(MEASUREMENT_BASIS.PAIRED)
    const at = (name: string): string => rows[1][rows[0].indexOf(name)]

    expect(at('engine1')).toBe('conway1.4.0-ci')
    expect(at('engine2')).toBe('conway1.5.0-ci')
    expect(at('engine1TotalTimeMs')).toBe('100')
    expect(at('engine2TotalTimeMs')).toBe('90')
    expect(at('totalTimeMsDelta')).toBe('-10')
    expect(at('comparability')).toBe('sameHarness')
  })
})

describe('publishedVersion', () => {

  test('strips the -ci marker bless_perf_snapshot added', () => {
    // `-ci` names the rc job that measured the snapshot; no such version was
    // ever published, so installing it would 404.
    expect(publishedVersion('1.543.1513', 'conway1.543.1513-ci'))
        .toBe('1.543.1513')
  })

  test('keeps a -g<shorthash> prerelease, which IS published', () => {
    // Since conway#533 every published version carries one, and `-ci` is
    // appended AFTER it. Stripping to the numeric components would resolve
    // `1.1556.546-g3eae7637-ci` to `1.1556.546` — a DIFFERENT release, or
    // more likely no release at all, silently paired against.
    expect(publishedVersion('1.1556.546', 'conway1.1556.546-g3eae7637-ci'))
        .toBe('1.1556.546-g3eae7637')
  })

  test('passes through an engine label with no -ci at all', () => {
    expect(publishedVersion('0.23.940', 'conway0.23.940')).toBe('0.23.940')
  })
})

describe('the paired pass and the cross-run delta agree on the predecessor', () => {

  test('resolve_previous_pin delegates to findPreviousSnapshot', () => {
    // Not a tautology: it is the property that stops the two deltas in one
    // directory from describing different comparisons under identical column
    // layouts. resolve_previous_pin.cjs imports the function rather than
    // re-deriving the rule, and this pins that it is still the same function
    // producing the same answer over a realistic directory listing —
    // including the strict-upper-bound behaviour that keeps a NEWER release
    // from being reported as an older one's predecessor.
    const benchmarks = path.join(workDir, 'benchmarks')

    for (const name of [
      'conway0.23.940_test-models',
      'conway1.451.1357-ci_test-models',
      'conway1.543.1513-ci_test-models',
      'conway1.700.1700-ci_test-models',
      'webifc1.4_test-models',
    ]) {
      fs.mkdirSync(path.join(benchmarks, name), { recursive: true })
      fs.writeFileSync(
        path.join(benchmarks, name, 'performance-detail.csv'),
        detailCsv('whatever', '1'), 'utf8')
    }

    const previous = findPreviousSnapshot(
      benchmarks, 'conway1.600.1600-ci_test-models', '1.600.1600')

    expect(previous).not.toBeNull()
    expect(previous?.name).toBe('conway1.543.1513-ci_test-models')
    expect(previous?.engine).toBe('conway1.543.1513-ci')
    // And that is the version the paired pass installs.
    expect(publishedVersion(previous!.version, previous!.engine))
        .toBe('1.543.1513')
  })

  test('no predecessor is a real state, not an error', () => {
    // The first blessed release in a repo. The workflow skips the paired pass
    // and blesses the cross-run snapshot as before, so this must not throw.
    const benchmarks = path.join(workDir, 'benchmarks')
    fs.mkdirSync(benchmarks, { recursive: true })

    expect(findPreviousSnapshot(
      benchmarks, 'conway1.0.0-ci_test-models', '1.0.0')).toBeNull()
  })
})

describe('a paired delta carries only two-sided rows', () => {

  /**
   * Difference two model sets and read the result back.
   *
   * @param older Models the previous pin measured, filename -> totalTimeMs.
   * @param newer Models this release measured.
   * @param basis Value to stamp, or undefined to take the crossRun default.
   * @return The parsed delta CSV, header row included.
   */
  function deltaOver(
      older: [string, string][], newer: [string, string][],
      basis?: string): string[][] {
    const olderPath = path.join(workDir, 'older.csv')
    const newerPath = path.join(workDir, 'newer.csv')
    const out = path.join(workDir, 'delta.csv')

    fs.writeFileSync(olderPath, detailCsvFor('conway1.4.0-paired', older), 'utf8')
    fs.writeFileSync(newerPath, detailCsvFor('conway1.5.0-ci', newer), 'utf8')
    generateDeltaCSV(olderPath, newerPath, out, false, basis)

    return parseCsv(fs.readFileSync(out, 'utf8'))
  }

  /**
   * The `filename` cell of every data row.
   *
   * @param rows Parsed delta CSV, header row included.
   * @return Filenames, in file order.
   */
  function filenames(rows: string[][]): string[] {
    const at = rows[0].indexOf('filename')

    return rows.slice(1).map((row) => row[at])
  }

  test('drops a model the previous pin never measured', () => {
    // The bug: computeDeltas unions its two inputs, so a model present only in
    // the newer pass was emitted with `engine1` and every delta set to N/A —
    // and writeDataToCsv stamped that row `paired` like any other. A `paired`
    // row asserts both engines were timed in one job on one machine, which is
    // the one thing that row cannot claim. `smoke` scope produces this on
    // every model outside the subset; a lost or skipped child produces it
    // under `full`.
    const rows = deltaOver(
      [['index.ifc', '100']],
      [['index.ifc', '90'], ['duplex.ifc', '200']],
      MEASUREMENT_BASIS.PAIRED)

    expect(filenames(rows)).toEqual(['index.ifc'])
    expect(fs.readFileSync(path.join(workDir, 'delta.csv'), 'utf8'))
        .not.toContain('duplex.ifc')
  })

  test('drops a model only the previous pin measured', () => {
    // The other direction, which the corpus produces when a model is removed
    // between the pin and this release. Same reasoning: no counterpart, no
    // paired claim.
    const rows = deltaOver(
      [['index.ifc', '100'], ['gone.ifc', '400']],
      [['index.ifc', '90']],
      MEASUREMENT_BASIS.PAIRED)

    expect(filenames(rows)).toEqual(['index.ifc'])
  })

  test('every surviving paired row differences two real measurements', () => {
    const rows = deltaOver(
      [['index.ifc', '100']],
      [['index.ifc', '90'], ['duplex.ifc', '200']],
      MEASUREMENT_BASIS.PAIRED)
    const engine1 = rows[0].indexOf('engine1')
    const engine2 = rows[0].indexOf('engine2')

    expect(rows.length).toBeGreaterThan(1)
    for (const row of rows.slice(1)) {
      expect(row[engine1]).not.toBe('N/A')
      expect(row[engine2]).not.toBe('N/A')
    }
  })

  test('crossRun keeps its one-sided rows — the archive is continuity', () => {
    // The union is RIGHT for the historical file: a model added to or dropped
    // from the corpus between two releases is a fact about the corpus, and
    // every consumer of the archive has read it that way for as long as the
    // archive has existed. Only the `paired` label makes a one-sided row a
    // false claim, so only the paired file drops them.
    const rows = deltaOver(
      [['index.ifc', '100']],
      [['index.ifc', '90'], ['duplex.ifc', '200']])

    expect(filenames(rows).sort()).toEqual(['duplex.ifc', 'index.ifc'])
  })
})

/**
 * The gate's own integrity: a paired pass that lost models must not be blessed
 * as one that did not.
 *
 * Nothing upstream of the bless step fails loudly on a truncated paired pass.
 * A per-model child that times out or is killed is recorded as a failure with
 * no per-file perf CSV to its name, `aggregatePerfCsvs()` writes the rows that
 * survived, and the batch still ends `process.exit(0)` — so the artifact looks
 * exactly like a complete one. These run the real CLI end to end, because the
 * behaviour under test spans the coverage check, the degrade, and the two
 * places the reason has to surface.
 */
describe('a partial paired pass is not blessed as the gate', () => {

  const PERF_HEADER = [
    'file', 'status', 'writer', 'parseTimeMs', 'geometryTimeMs', 'totalTimeMs',
    'parsePlusGeometryMs', 'geometryMemoryMb', 'peakWasmHeapMb', 'rssMb',
    'peakRssMb', 'heapUsedMb', 'heapTotalMb', 'externalMb', 'arrayBuffersMb',
    'retainedRssMb', 'retainedHeapUsedMb', 'retainedExternalMb',
  ]

  const SCRIPT = path.resolve(process.cwd(), 'scripts/bless_perf_snapshot.cjs')
  const OUT_DIR = 'models/benchmarks/conway1.5.0-ci_test-models'

  /**
   * A batch-written perf.csv.
   *
   * @param models Filename -> totalTimeMs, in the order the batch sorted them.
   * @return The whole file, header included.
   */
  function perfCsv(models: [string, string][]): string {
    const rows = models.map(([file, totalTimeMs]) => [
      file, 'OK', 'ifc-regression', '10', '20', totalTimeMs, '30', '1.5', '64',
      '120', '130', '20', '30', '5', '4', '2', '1', '0.5',
    ].join(','))

    return `${PERF_HEADER.join(',')}\n${rows.join('\n')}\n`
  }

  /**
   * Lay out a workspace with one committed predecessor snapshot to pair
   * against, this release's blessed perf.csv, the paired pass's output, and
   * — separately from both — the corpus on disk that the coverage demand is
   * derived from.
   *
   * `corpus` defaults to the union of the two passes' rows, i.e. a tree that
   * lost nothing. A test that wants a model NEITHER pass measured, or two
   * files writing one basename, passes it explicitly.
   *
   * @param blessed Models this release measured.
   * @param pairedRows Models the previous pin's pass came back with.
   * @param corpus Corpus-relative model paths, or undefined for the union.
   */
  function seed(
      blessed: [string, string][], pairedRows: [string, string][],
      corpus?: string[]): void {
    const previous = path.join(
      workDir, 'models/benchmarks/conway1.4.0-ci_test-models')

    fs.mkdirSync(previous, { recursive: true })
    fs.writeFileSync(
      path.join(previous, 'performance-detail.csv'),
      detailCsvFor('conway1.4.0-ci', blessed), 'utf8')
    fs.writeFileSync(
      path.join(workDir, 'perf.csv'), perfCsv(blessed), 'utf8')
    fs.writeFileSync(
      path.join(workDir, 'perf-paired.csv'), perfCsv(pairedRows), 'utf8')

    const files = corpus ?? [...new Set(
      [...blessed, ...pairedRows].map(([file]) => file))]

    for (const rel of files) {
      const full = path.join(workDir, 'models', rel)

      fs.mkdirSync(path.dirname(full), { recursive: true })
      fs.writeFileSync(full, 'model bytes', 'utf8')
    }
  }

  /**
   * Run the bless script over the seeded workspace.
   *
   * @param extraArgs Flags beyond the paired trio, e.g. --paired-expected.
   *   Pass `--corpus-exclude` here to override the default.
   * @return The job summary the run wrote, '' when it wrote none.
   */
  function bless(extraArgs: string[] = []): string {
    const summaryPath = path.join(workDir, 'summary.md')
    // The workflow's own exclude. Present on every run because the corpus
    // walk is what the demand is derived from, and it has to see the tree the
    // passes saw.
    const corpusExclude = extraArgs.includes('--corpus-exclude') ?
      [] : ['--corpus-exclude', 'sp-.*\\.ifc|cg4.*-cylinder\\.stp']

    execFileSync(
        process.execPath,
        [
          SCRIPT, 'perf.csv', 'models', '1.5.0', 'test-models',
          '--paired', 'perf-paired.csv',
          '--paired-engine', 'conway1.4.0-paired',
          ...corpusExclude,
          ...extraArgs,
        ],
        {
          cwd: workDir,
          env: { ...process.env, GITHUB_STEP_SUMMARY: summaryPath },
          stdio: 'pipe',
        })

    return fs.existsSync(summaryPath) ?
      fs.readFileSync(summaryPath, 'utf8') : ''
  }

  /**
   * What the run left in the release's snapshot directory.
   *
   * @return Entry names.
   */
  function snapshotFiles(): string[] {
    return fs.readdirSync(path.join(workDir, OUT_DIR))
  }

  test('a complete pass is blessed, so the degrade is not vacuous', () => {
    // The positive control. Without it, a check that rejected everything
    // would pass every test below while removing the feature.
    seed(
      [['index.ifc', '100'], ['duplex.ifc', '200']],
      [['index.ifc', '102'], ['duplex.ifc', '210']])

    const summary = bless(['--paired-scope', 'full'])

    expect(snapshotFiles()).toContain('conway1.4.0-ci_1.5.0_paired_delta.csv')
    expect(snapshotFiles())
        .toContain('performance-detail-paired-conway1.4.0-paired.csv')
    expect(summary).toBe('')
  })

  test('a pass missing a model is withheld, not published narrowed', () => {
    seed(
      [['index.ifc', '100'], ['duplex.ifc', '200']],
      [['index.ifc', '102']])

    const summary = bless(['--paired-scope', 'full'])

    // No paired delta, and no orphaned paired rows beside it either.
    expect(snapshotFiles())
        .not.toContain('conway1.4.0-ci_1.5.0_paired_delta.csv')
    expect(snapshotFiles().filter(
        (name) => name.startsWith('performance-detail-paired-'))).toEqual([])

    // Degraded, not aborted: the cross-run delta and the blessed rows are the
    // release's regression report and must survive a withheld gate.
    expect(snapshotFiles()).toContain('conway1.4.0-ci_1.5.0_delta.csv')
    expect(snapshotFiles()).toContain('performance-detail.csv')

    // And the reason reaches both places a human reads, naming the model.
    expect(summary).toContain('duplex.ifc')
    expect(summary).toContain('No paired delta for this release')

    const readme =
      fs.readFileSync(path.join(workDir, OUT_DIR, 'README.md'), 'utf8')

    expect(readme).toContain('discarded')
    expect(readme).toContain('duplex.ifc')
    expect(readme).not.toContain('This directory holds **two**')
  })

  test('coverage is a set, so two failures cannot cancel', () => {
    // A count would pass this: two models measured, two expected. The pin's
    // pass lost duplex.ifc and picked up a model the blessed pass never ran.
    seed(
      [['index.ifc', '100'], ['duplex.ifc', '200']],
      [['index.ifc', '102'], ['stray.ifc', '300']])

    const summary = bless(['--paired-scope', 'full'])

    expect(snapshotFiles())
        .not.toContain('conway1.4.0-ci_1.5.0_paired_delta.csv')
    expect(summary).toContain('duplex.ifc')
  })

  test('smoke scope demands its subset, not the whole corpus', () => {
    // The narrowed gate is a deliberate choice, not a failure — so the check
    // has to measure the paired pass against what it was ASKED to cover, or
    // it would degrade every smoke run.
    seed(
      [['index.ifc', '100'], ['duplex.ifc', '200']],
      [['index.ifc', '102']])
    fs.writeFileSync(
      path.join(workDir, 'smoke.txt'),
      '# curated PR-time subset\n\nindex.ifc\n', 'utf8')

    const summary = bless(
      ['--paired-scope', 'smoke', '--paired-expected', 'smoke.txt'])

    expect(snapshotFiles()).toContain('conway1.4.0-ci_1.5.0_paired_delta.csv')
    expect(summary).toBe('')
  })

  test('an unreadable expected list degrades — an unverifiable gate is none', () => {
    seed(
      [['index.ifc', '100'], ['duplex.ifc', '200']],
      [['index.ifc', '102'], ['duplex.ifc', '210']])

    const summary = bless(
      ['--paired-scope', 'smoke', '--paired-expected', 'nonexistent.txt'])

    expect(snapshotFiles())
        .not.toContain('conway1.4.0-ci_1.5.0_paired_delta.csv')
    expect(summary).toContain('nonexistent.txt')
  })

  test('a model BOTH passes lost is still demanded', () => {
    // THE CORRELATED-LOSS HOLE, end to end. Both passes run the same batch
    // driver over the same tree, so they share its failure modes: a model
    // whose child is killed in both is absent from both CSVs. A demand read
    // off either output drops it at the same moment the measurement does, and
    // a paired median over a quietly smaller corpus goes out as the release
    // gate. The corpus on disk is the one input neither pass wrote.
    seed(
      [['index.ifc', '100']],
      [['index.ifc', '102']],
      ['ifc/index.ifc', 'ifc/duplex.ifc'])

    const summary = bless(['--paired-scope', 'full'])

    expect(snapshotFiles())
        .not.toContain('conway1.4.0-ci_1.5.0_paired_delta.csv')
    expect(summary).toContain('duplex.ifc')
    expect(snapshotFiles()).toContain('conway1.4.0-ci_1.5.0_delta.csv')
  })

  test('the corpus walk honours the exclude, so it does not over-demand', () => {
    // The negative control for the test above: an excluded model is not in
    // the corpus the passes walked, so demanding it would degrade every run.
    seed(
      [['index.ifc', '100']],
      [['index.ifc', '102']],
      ['ifc/index.ifc', 'ifc/sp-concat.ifc', 'step/cg4-cylinder.stp'])

    expect(bless(['--paired-scope', 'full'])).toBe('')
    expect(snapshotFiles()).toContain('conway1.4.0-ci_1.5.0_paired_delta.csv')
  })

  test('a smoke list matching nothing degrades, rather than passing empty', () => {
    // With no entry matching, the demand is empty, nothing can be missing,
    // and any paired CSV at all clears a check that only looks at `missing` —
    // while the README goes on calling the result the smoke gate.
    seed(
      [['index.ifc', '100'], ['duplex.ifc', '200']],
      [['index.ifc', '102']])
    fs.writeFileSync(
      path.join(workDir, 'smoke.txt'), 'renamed-since.ifc\n', 'utf8')

    const summary = bless(
      ['--paired-scope', 'smoke', '--paired-expected', 'smoke.txt'])

    expect(snapshotFiles())
        .not.toContain('conway1.4.0-ci_1.5.0_paired_delta.csv')
    expect(summary).toContain('renamed-since.ifc')
  })

  test('a smoke entry no corpus file matches degrades', () => {
    // The rest of the list matching is not enough: dropping the entry would
    // narrow the gate silently, which is the failure this check exists for.
    seed(
      [['index.ifc', '100']],
      [['index.ifc', '102']])
    fs.writeFileSync(
      path.join(workDir, 'smoke.txt'), 'index.ifc\ntypo.ifc\n', 'utf8')

    const summary = bless(
      ['--paired-scope', 'smoke', '--paired-expected', 'smoke.txt'])

    expect(snapshotFiles())
        .not.toContain('conway1.4.0-ci_1.5.0_paired_delta.csv')
    expect(summary).toContain('typo.ifc')
  })

  test('a basename collision degrades and names conway#633', () => {
    // Two corpus files write one `index.perf.csv`, so one row is lost and a
    // check keyed on basename cannot see it. Interim guard: the gate says it
    // is unverifiable instead of under-covering in silence. The real fix —
    // path-qualified identities across the perf CSVs and digest stems — is
    // conway#633, and this test goes when that lands.
    seed(
      [['index.ifc', '100']],
      [['index.ifc', '102']],
      ['ifc/index.ifc', 'ifc/bldrs/index.ifc'])

    const summary = bless(['--paired-scope', 'full'])

    expect(snapshotFiles())
        .not.toContain('conway1.4.0-ci_1.5.0_paired_delta.csv')
    expect(summary).toContain('index.ifc')
    expect(summary).toContain('#633')

    const readme =
      fs.readFileSync(path.join(workDir, OUT_DIR, 'README.md'), 'utf8')

    expect(readme).toContain('#633')
    // Degraded, not aborted, like every other pairing failure.
    expect(snapshotFiles()).toContain('conway1.4.0-ci_1.5.0_delta.csv')
  })

  test('a rerun with no paired pass at all clears the last one’s rows', () => {
    // `--paired` is omitted entirely when the paired step produced no CSV, so
    // a cleanup living inside the paired branch never runs. removeStaleDeltas
    // still takes the old paired DELTA (it matches the `_paired` spelling)
    // and the regenerated README says the paired pass did not run — leaving
    // the previous run's paired rows in the directory with nothing naming
    // them.
    seed(
      [['index.ifc', '100'], ['duplex.ifc', '200']],
      [['index.ifc', '102'], ['duplex.ifc', '210']])
    bless(['--paired-scope', 'full'])

    expect(snapshotFiles())
        .toContain('performance-detail-paired-conway1.4.0-paired.csv')

    // The rerun: same snapshot, no perf-paired.csv this time.
    fs.rmSync(path.join(workDir, 'perf-paired.csv'))
    execFileSync(
        process.execPath,
        [SCRIPT, 'perf.csv', 'models', '1.5.0', 'test-models'],
        { cwd: workDir, stdio: 'pipe' })

    expect(snapshotFiles().filter(
        (name) => name.startsWith('performance-detail-paired-'))).toEqual([])
    expect(snapshotFiles())
        .not.toContain('conway1.4.0-ci_1.5.0_paired_delta.csv')
    expect(snapshotFiles()).toContain('performance-detail.csv')
  })
})
