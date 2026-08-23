/* eslint-disable no-magic-numbers */
import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, test } from '@jest/globals'
import { createRequire } from 'module'

/**
 * Two perf-CSV defects that are the same shape: one column, two meanings.
 *
 * **conway#555 — `geometryMemoryMb` depends on which pipeline wrote the row.**
 * The IFC regression child sets
 * `RegressionCaptureState.memoization = MemoizationCapture.FULL`, which is
 * what stops `deleteTemporaries()` running and leaves every CSG intermediate
 * and boolean operand in `model.geometry` — the map `calculateGeometrySize()`
 * sums. MB-Khaya therefore reads 22.3 MB there against the CLI's 16.8: a ~30%
 * gap with no change behind it. The digest walks those temporaries, so making
 * the numbers agree is not on the table; the divergence gets NAMED instead,
 * with a `writer` column, and the delta refuses to difference the
 * pipeline-dependent columns across two writers.
 *
 * It is not only CLI-vs-regression, which is worth pinning because it is
 * easy to assume otherwise: `memoization` is a process-global and the two
 * regression children are separate processes, so only the IFC one sets FULL.
 * A mixed IFC/STEP corpus aggregates two capture modes into one column.
 *
 * **conway#562 §1 — `totalTimeMs` was not the load's total.** On the
 * regression children it was `geomEndMs - parseStartMs` with `geomStartMs`
 * taken on the line after `parseEndMs`, so it was
 * `parseTimeMs + geometryTimeMs` by construction (0-5 ms of slack on all 46
 * OK rows of the blessed 1.451 snapshot) — while `ConwayModelLoader` wrote a
 * real file-read-through-teardown wall clock into the same column name. It is
 * the wall clock on both now, and the sum lives in `parsePlusGeometryMs`.
 *
 * The children are asserted against their SOURCE TEXT, for the reason
 * `ifc_regression_single_engine.test.ts` records: both are process entry
 * points that call `main()` at module scope and drive `yargs` off
 * `process.argv`, so importing either from a test starts a regression run.
 */
const require_ = createRequire(import.meta.url)

// Resolved from the repo root: this runs from compiled/src/scripts, and
// neither scripts/ nor the TypeScript sources are in the tsc output.
// Jest's rootDir is the repo root.
const { DETAIL_COLUMNS, writeDetailCsv } =
  require_(path.resolve(process.cwd(), 'scripts/bless_perf_snapshot.cjs')) as {
    DETAIL_COLUMNS: string[],
    writeDetailCsv: (
      rows: Record<string, string>[], out: string, engine: string,
      timestamp: string) => number,
  }

const { generateDeltaCSV } =
  require_(path.resolve(process.cwd(), 'scripts/gen_delta_csv.cjs')) as {
    generateDeltaCSV: (a: string, b: string, out: string) => void,
  }

const { parseCsv } =
  require_(path.resolve(process.cwd(), 'scripts/csv_rfc4180.cjs')) as {
    parseCsv: (text: string) => string[][],
  }

const ifcSource = fs.readFileSync(
    path.resolve(process.cwd(), 'src/ifc/ifc_regression_main.ts'), 'utf8')
const ap214Source = fs.readFileSync(
    path.resolve(
        process.cwd(), 'src/AP214E3_2010/ap214_regression_main.ts'), 'utf8')

/**
 * The `header` string literal a regression child emits, with the source's
 * string concatenation and escapes resolved.
 *
 * @param source The child's source text.
 * @return {string} The comma-separated column list.
 */
function perfHeaderOf(source: string): string {
  const match = /const header =\n((?:\s+'[^']*' \+\n)*\s+'[^']*'\n)/.exec(source)

  expect(match).not.toBeNull()

  return (match![1].match(/'([^']*)'/g) ?? [])
      .map((part) => part.slice(1, -1))
      .join('')
      .replace(/\\n$/, '')
}

let workDir: string

beforeEach(() => {
  workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'perf-writer-'))
})

afterEach(() => {
  fs.rmSync(workDir, { recursive: true, force: true })
})

describe('the perf row says which pipeline measured it (conway#555)', () => {

  test('both regression children write the identical header', () => {
    // `aggregatePerfCsvs` in ifc_regression_batch_main.ts keeps the header of
    // whichever per-file CSV it reads first and concatenates the rest as
    // rows, so a mixed IFC/STEP corpus mislabels every column the moment
    // these two drift. That is the whole reason to pin equality rather than
    // to check each one separately.
    expect(perfHeaderOf(ifcSource)).toBe(perfHeaderOf(ap214Source))
  })

  test('the header carries writer and parsePlusGeometryMs', () => {
    const columns = perfHeaderOf(ifcSource).split(',')

    expect(columns).toContain('writer')
    expect(columns).toContain('parsePlusGeometryMs')
    expect(columns).toContain('totalTimeMs')
  })

  test('every perf column the children write has a home in the snapshot', () => {
    // bless_perf_snapshot.cjs maps perf.csv onto performance-detail.csv by
    // name. A column added to a child but not to DETAIL_COLUMNS is measured
    // and then silently dropped on the way to the blessed file, which is the
    // failure mode #552's missing geometryMemoryMb had for several releases.
    for (const column of perfHeaderOf(ifcSource).split(',')) {

      if (column === 'file' || column === 'status') {
        // Renamed on the way through: `file` becomes `filename`
        // (URL-encoded), `status` becomes `loadStatus`.
        continue
      }

      expect(DETAIL_COLUMNS).toContain(column)
    }
  })

  test('the two children declare different writers', () => {
    const writerOf = (source: string) =>
      /const PERF_WRITER = '([\w-]+)'/.exec(source)?.[1]

    expect(writerOf(ifcSource)).toBe('ifc-regression')
    expect(writerOf(ap214Source)).toBe('ap214-regression')
  })

  test('only the IFC child raises memoization capture to FULL', () => {
    // The mechanism behind the 16.8-vs-22.3 MB gap, pinned so that a later
    // change making the two children agree is noticed here rather than
    // leaving the `writer` column explaining a divergence that no longer
    // exists. `memoization` is a process-global and these are separate
    // processes, so this really is per-child state.
    expect(ifcSource).toMatch(/RegressionCaptureState\.memoization =\s*\n?\s*MemoizationCapture\.FULL/)
    expect(ap214Source).not.toContain('MemoizationCapture.FULL')
  })

  test('writeDetailCsv carries the writer through, or N/A without one', () => {
    const out = path.join(workDir, 'performance-detail.csv')

    writeDetailCsv(
      [
        { file: 'a.ifc', status: 'OK', writer: 'ifc-regression',
          totalTimeMs: '6600', parsePlusGeometryMs: '6410',
          geometryMemoryMb: '22.30' },
        // A row from a perf.csv predating #555: no writer at all.
        { file: 'b.stp', status: 'OK', totalTimeMs: '900' },
      ],
      out, 'conway1.560.1520-ci', '20260823221710')

    const records = parseCsv(fs.readFileSync(out, 'utf8'))
    const cell = (row: number, column: string) =>
      records[row][DETAIL_COLUMNS.indexOf(column)]

    expect(cell(1, 'writer')).toBe('ifc-regression')
    expect(cell(1, 'parsePlusGeometryMs')).toBe('6410')
    expect(cell(1, 'geometryMemoryMb')).toBe('22.30')

    // Absent, not fabricated — the same obligation every added column
    // inherits from #548.
    expect(cell(2, 'writer')).toBe('N/A')
    expect(cell(2, 'parsePlusGeometryMs')).toBe('N/A')
  })
})

describe('the delta refuses to cross pipelines (conway#555)', () => {

  /**
   * Write a minimal performance-detail.csv the delta can read.
   *
   * @param name File name within the work directory.
   * @param writer The `writer` cell, or undefined to omit the column
   * entirely — the shape of every snapshot blessed before #555.
   * @param geometryMemoryMb The pipeline-dependent column under test.
   * @param totalTimeMs A pipeline-INdependent column, as the control.
   * @return {string} The path written.
   */
  function writeDetail(
      name: string,
      writer: string | undefined,
      geometryMemoryMb: string,
      totalTimeMs: string ): string {

    const columns = ['loadStatus', 'uname', 'engine', 'filename',
      'parseTimeMs', 'geometryTimeMs', 'totalTimeMs', 'geometryMemoryMb',
      'retainedRssMb']
    const values = ['OK', 'x64', 'conway1.0.0', 'mep.ifc',
      '10', '20', totalTimeMs, geometryMemoryMb, '100.00']

    if (writer !== undefined) {
      columns.splice(1, 0, 'writer')
      values.splice(1, 0, writer)
    }

    const file = path.join(workDir, name)

    fs.writeFileSync(file, `${columns.join(',')}\n${values.join(',')}\n`, 'utf8')

    return file
  }

  /**
   * Difference two detail CSVs and return the single row as a lookup.
   *
   * @param older Older snapshot path.
   * @param newer Newer snapshot path.
   * @return {(column: string) => string} Cell accessor for the delta row.
   */
  function delta(older: string, newer: string): (column: string) => string {
    const out = path.join(workDir, 'delta.csv')

    generateDeltaCSV(older, newer, out)

    const records = parseCsv(fs.readFileSync(out, 'utf8'))

    expect(records).toHaveLength(2)

    return (column: string) => records[1][records[0].indexOf(column)]
  }

  test('two different writers difference as N/A, not as a 30% win', () => {
    // The exact pair #555 measured: the CLI's 16.8 MB against the regression
    // child's 22.3 for the same model. Differenced naively that is +5.5 MB —
    // a third of the figure — reported as if conway's geometry had grown.
    const cell = delta(
        writeDetail('cli.csv', 'ifc-cli', '16.80', '5000'),
        writeDetail('regression.csv', 'ifc-regression', '22.30', '5000'))

    expect(cell('geometryMemoryMbDelta')).toBe('N/A')
    expect(cell('retainedRssMbDelta')).toBe('N/A')

    // The timing columns are NOT withheld: they are broadly comparable
    // across pipelines on the same runner class, and blanking them would
    // cost the delta its most-read column for no measurement reason.
    expect(cell('totalTimeMsDelta')).toBe('0')
  })

  test('the same writer on both sides differences normally', () => {
    const cell = delta(
        writeDetail('older.csv', 'ifc-regression', '20.00', '5000'),
        writeDetail('newer.csv', 'ifc-regression', '22.30', '4800'))

    expect(Number(cell('geometryMemoryMbDelta'))).toBeCloseTo(2.3, 5)
    expect(cell('totalTimeMsDelta')).toBe('-200')
  })

  test('a snapshot with no writer column still differences', () => {
    // Every baseline committed before #555 lacks the column. Treating an
    // unknown writer as a mismatch would blank the entire history this file
    // exists to produce, so the guard fires only when both sides STATE a
    // writer and the two disagree.
    const cell = delta(
        writeDetail('legacy.csv', undefined, '20.00', '5000'),
        writeDetail('current.csv', 'ifc-regression', '22.30', '4800'))

    expect(Number(cell('geometryMemoryMbDelta'))).toBeCloseTo(2.3, 5)
  })
})

describe('totalTimeMs is the load\'s wall clock (conway#562 §1)', () => {

  test('neither child computes it from the stage clocks any more', () => {
    // The identity that made "Total" a misnomer. It excluded the file read,
    // the ParsingBuffer, the header parse and the teardown — everything a
    // reader assumes a total includes.
    for (const source of [ifcSource, ap214Source]) {
      expect(source).not.toMatch(/totalTimeMs = geomEndMs - parseStartMs/)
    }
  })

  test('both children open the clock before the file read', () => {
    for (const source of [ifcSource, ap214Source]) {
      const loadStart = source.indexOf('const loadStartMs = Date.now()')
      const readFile = source.indexOf('fs.readFileSync(')

      expect(loadStart).toBeGreaterThan(-1)
      expect(loadStart).toBeLessThan(readFile)
    }
  })

  test('both children close the clock on the teardown, not the settle', () => {
    // Ordering that decides what the column means. Closing after the settle
    // would fold two forced full collections into the load's wall clock and
    // undo the property conway#554 built the retention columns around: both
    // settles sit OUTSIDE every timed region.
    for (const source of [ifcSource, ap214Source]) {
      const teardown = source.indexOf('model.invalidate( true )')
      const total = source.indexOf('const totalTimeMs = Date.now() - loadStartMs')
      const settle = source.indexOf('memory.retained = retainedMemoryMb(')

      expect(teardown).toBeGreaterThan(-1)
      expect(total).toBeGreaterThan(teardown)
      expect(total).toBeLessThan(settle)
    }
  })

  test('the sum survives under its own name', () => {
    for (const source of [ifcSource, ap214Source]) {
      expect(source)
          .toMatch(/const parsePlusGeometryMs = geomEndMs - parseStartMs/)
    }
  })
})
