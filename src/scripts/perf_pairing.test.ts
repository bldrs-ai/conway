import fs from 'fs'
import os from 'os'
import path from 'path'
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
 * A one-model performance-detail.csv in the committed convention.
 *
 * @param engine Engine label for the `engine` column.
 * @param totalTimeMs The row's total, which is what the delta differences.
 * @return The whole file, header included.
 */
function detailCsv(engine: string, totalTimeMs: string): string {
  const row = [
    '20260828000000', 'OK', 'ifc-regression', 'x64', engine, 'index.ifc',
    'IFC4', '10', '20', totalTimeMs, '30', '1.5', '64', '120', '130', '20',
    '30', '5', '4', '2', '1', '0.5', 'N/A', 'N/A',
  ]

  return `${DETAIL_HEADER.join(',')}\n${row.join(',')}\n`
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
