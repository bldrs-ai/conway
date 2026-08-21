import fs from 'fs'
import os from 'os'
import path from 'path'
import { describe, expect, test, beforeEach, afterEach } from '@jest/globals'
import { createRequire } from 'module'

/**
 * The rc-regression bless path's perf snapshot (scripts/bless_perf_snapshot.cjs).
 *
 * The `rebless` job measures the full corpus with
 * `ifc_regression_batch_main --perf`, whose 8-column perf.csv is a different
 * file from the 15-column `performance-detail.csv` the committed benchmark
 * snapshots use. This pins the mapping between them — the shape a delta and
 * GitHub's CSV viewer both depend on — and the choice of predecessor to diff
 * against.
 */
const require_ = createRequire(import.meta.url)

// Resolved from the repo root: the test runs from compiled/src/scripts, and
// scripts/ is not part of the tsc build. Jest's rootDir is the repo root.
const { DETAIL_COLUMNS, findPreviousSnapshot, writeDetailCsv, versionCompare } =
  require_(path.resolve(process.cwd(), 'scripts/bless_perf_snapshot.cjs')) as {
    DETAIL_COLUMNS: string[],
    findPreviousSnapshot: (dir: string, self: string) =>
      { name: string, version: string, engine: string } | null,
    writeDetailCsv: (
      rows: Record<string, string>[], out: string, engine: string,
      timestamp: string) => number,
    versionCompare: (a: string, b: string) => number,
  }

const { parseCsv } =
  require_(path.resolve(process.cwd(), 'scripts/csv_rfc4180.cjs')) as {
    parseCsv: (text: string) => string[][],
  }

let workDir: string

beforeEach(() => {
  workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bless-perf-'))
})

afterEach(() => {
  fs.rmSync(workDir, { recursive: true, force: true })
})

describe('writeDetailCsv', () => {

  test('maps perf.csv onto the 15-column convention, N/A for unmeasured', () => {
    const out = path.join(workDir, 'performance-detail.csv')

    writeDetailCsv(
      [{
        file: 'Snowdon Towers Sample Architectural_IFC4.ifc',
        status: 'OK',
        parseTimeMs: '1200',
        geometryTimeMs: '5400',
        totalTimeMs: '6600',
        rssMb: '812.50',
        heapUsedMb: '410.25',
        heapTotalMb: '450.00',
      }],
      out, 'conway1.543.1513-ci', '20260821221710')

    const records = parseCsv(fs.readFileSync(out, 'utf8'))

    expect(records[0]).toEqual(DETAIL_COLUMNS)
    expect(records).toHaveLength(2)

    const row = records[1]
    expect(row).toHaveLength(DETAIL_COLUMNS.length)

    /**
     * Read one column of the written row.
     *
     * @param column Column name.
     * @return The cell value.
     */
    const cell = (column: string) => row[DETAIL_COLUMNS.indexOf(column)]

    expect(cell('engine')).toBe('conway1.543.1513-ci')
    expect(cell('loadStatus')).toBe('OK')
    expect(cell('parseTimeMs')).toBe('1200')
    expect(cell('geometryTimeMs')).toBe('5400')
    expect(cell('totalTimeMs')).toBe('6600')
    expect(cell('rssMb')).toBe('812.50')

    // The committed snapshots URL-encode the filename and the delta joins on
    // it, so an unencoded name would simply fail to match the baseline row.
    expect(cell('filename'))
        .toBe('Snowdon%20Towers%20Sample%20Architectural_IFC4.ifc')

    // perf.csv does not carry these; they stay as placeholders rather than
    // being dropped, so the row keeps its 15-column shape.
    for (const column of
      ['schemaVersion', 'geometryMemoryMb', 'preprocessorVersion',
        'originatingSystem']) {
      expect(cell(column)).toBe('N/A')
    }
  })

  test('carries a FAIL row through instead of dropping it', () => {
    const out = path.join(workDir, 'fail.csv')

    writeDetailCsv(
      [{
        file: 'broken.ifc', status: 'FAIL', parseTimeMs: '90',
        geometryTimeMs: '0', totalTimeMs: '90', rssMb: '', heapUsedMb: '',
        heapTotalMb: '',
      }],
      out, 'conway1.543.1513-ci', '20260821221710')

    const row = parseCsv(fs.readFileSync(out, 'utf8'))[1]
    expect(row[DETAIL_COLUMNS.indexOf('loadStatus')]).toBe('FAIL')
    // An empty measurement becomes N/A, which gen_delta_csv.cjs reads as 0
    // rather than NaN.
    expect(row[DETAIL_COLUMNS.indexOf('rssMb')]).toBe('N/A')
  })
})

describe('findPreviousSnapshot', () => {

  /**
   * Create a benchmarks/ directory containing the named snapshot dirs, each
   * with a performance-detail.csv.
   *
   * @param names Snapshot directory names.
   * @param withoutCsv Names to create empty, without a CSV.
   * @return Path to the benchmarks directory.
   */
  function makeBenchmarks(names: string[], withoutCsv: string[] = []): string {
    const benchmarks = path.join(workDir, 'benchmarks')
    for (const name of [...names, ...withoutCsv]) {
      fs.mkdirSync(path.join(benchmarks, name), { recursive: true })
    }
    for (const name of names) {
      fs.writeFileSync(
        path.join(benchmarks, name, 'performance-detail.csv'), 'header\n')
    }
    return benchmarks
  }

  test('picks the highest version, comparing numerically not lexically', () => {
    // 0.9.789 sorts after 0.23.940 as a string; the corpus has both.
    const benchmarks = makeBenchmarks([
      'conway0.9.789_test-models',
      'conway0.23.940-ci_test-models',
      'conway1.451.1357-ci_test-models',
    ])

    const previous =
      findPreviousSnapshot(benchmarks, 'conway1.543.1513-ci_test-models')

    expect(previous).not.toBeNull()
    expect(previous!.name).toBe('conway1.451.1357-ci_test-models')
    // engine1 half of the delta filename, suffix included.
    expect(previous!.engine).toBe('conway1.451.1357-ci')
  })

  test('excludes the directory this run is writing', () => {
    // Re-running the same rc must not diff a snapshot against itself.
    const benchmarks = makeBenchmarks([
      'conway1.451.1357-ci_test-models',
      'conway1.543.1513-ci_test-models',
    ])

    const previous =
      findPreviousSnapshot(benchmarks, 'conway1.543.1513-ci_test-models')

    expect(previous!.name).toBe('conway1.451.1357-ci_test-models')
  })

  test('ignores webifc dirs and dirs with no performance-detail.csv', () => {
    const benchmarks = makeBenchmarks(
      ['conway0.23.940_test-models'],
      ['webifc0.0.67_test-models', 'conway9.9.9-ci_test-models'])

    const previous =
      findPreviousSnapshot(benchmarks, 'conway1.543.1513-ci_test-models')

    expect(previous!.name).toBe('conway0.23.940_test-models')
  })

  test('returns null when there is no prior snapshot', () => {
    expect(findPreviousSnapshot(path.join(workDir, 'nope'), 'x')).toBeNull()
    expect(findPreviousSnapshot(makeBenchmarks([]), 'x')).toBeNull()
  })
})

describe('versionCompare', () => {

  test('orders by numeric component, not string order', () => {
    expect(versionCompare('0.9.789', '0.23.940')).toBeLessThan(0)
    expect(versionCompare('1.543.1513', '1.451.1357')).toBeGreaterThan(0)
    expect(versionCompare('1.0.0', '1.0.0')).toBe(0)
  })
})
