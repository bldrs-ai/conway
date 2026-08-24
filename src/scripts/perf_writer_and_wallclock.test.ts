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

    // The TOTAL is withheld too, and for a third reason again: `ifc-cli`
    // and `ifc-regression` are different harnesses, and the harnesses bound
    // their clocks differently (see comparableTotals — ~195 ms of engine
    // init inside one window and outside the other). Equal values on both
    // sides, and still 'not comparable' rather than 0.
    expect(cell('totalTimeMsDelta')).toBe('N/A')
    expect(cell('totalTimeMsBasis')).toBe('crossHarness')

    // And so are the stage columns, as of review round 3: they subtract
    // non-equivalent intervals too (see the crossHarness cases below).
    expect(cell('parseTimeMsDelta')).toBe('N/A')
    expect(cell('geometryTimeMsDelta')).toBe('N/A')

    // One cell explains the whole row of N/A.
    expect(cell('comparability')).toBe('crossHarness')
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

describe('the delta knows about the #562 seam (conway#570 review)', () => {

  /**
   * A performance-detail.csv with an explicit column list, so a test can
   * write the exact legacy shapes the delta has to keep reading.
   *
   * @param name File name within the work directory.
   * @param columns Header.
   * @param values The single row.
   * @return {string} The path written.
   */
  function writeRow(
      name: string, columns: string[], values: string[] ): string {

    const file = path.join(workDir, name)

    fs.writeFileSync(file, `${columns.join(',')}\n${values.join(',')}\n`, 'utf8')

    return file
  }

  /**
   * Difference two detail CSVs and return the single row as a lookup.
   *
   * @param older Older snapshot path.
   * @param newer Newer snapshot path.
   * @return {(column: string) => string} Cell accessor.
   */
  function delta(older: string, newer: string): (column: string) => string {
    const out = path.join(workDir, 'seam-delta.csv')

    generateDeltaCSV(older, newer, out)

    const records = parseCsv(fs.readFileSync(out, 'utf8'))

    expect(records).toHaveLength(2)

    return (column: string) => records[1][records[0].indexOf(column)]
  }

  /** A pre-#555/#562 snapshot from a regression child: no writer, no split. */
  const LEGACY_REGRESSION = [
    'loadStatus', 'uname', 'engine', 'filename', 'schemaVersion',
    'parseTimeMs', 'geometryTimeMs', 'totalTimeMs',
    'preprocessorVersion', 'originatingSystem',
  ]

  /** The same vintage from benchmark.cjs: the scraped columns are populated. */
  const LEGACY_THREE = LEGACY_REGRESSION

  /** A current snapshot. */
  const CURRENT = [
    'loadStatus', 'writer', 'uname', 'engine', 'filename', 'schemaVersion',
    'parseTimeMs', 'geometryTimeMs', 'totalTimeMs', 'parsePlusGeometryMs',
    'preprocessorVersion', 'originatingSystem',
  ]

  test('a stage sum is not differenced against a wall clock', () => {
    // The case that fires on the FIRST bless after #562, on every model.
    // Old totalTimeMs 5000 is parse+geometry; new totalTimeMs 5400 is the
    // wall clock, of which 5010 is the same parse+geometry. Subtracting the
    // raw cells reports +400 and build.yml sorts its regression table by
    // exactly that number. The honest answer is +10.
    const cell = delta(
        writeRow('old.csv', LEGACY_REGRESSION,
            ['OK', 'x64', 'conway1.0.0-ci', 'mep.ifc', 'N/A',
              '1000', '4000', '5000', 'N/A', 'N/A']),
        writeRow('new.csv', CURRENT,
            ['OK', 'ifc-regression', 'x64', 'conway1.1.0-ci', 'mep.ifc', 'N/A',
              '1005', '4005', '5400', '5010', 'N/A', 'N/A']))

    expect(cell('totalTimeMsDelta')).toBe('10')
    expect(cell('totalTimeMsBasis')).toBe('stageSum')

    // The printed raw values must be the ones actually differenced, or the
    // row contradicts itself in the release table.
    expect(cell('engine1TotalTimeMs')).toBe('5000')
    expect(cell('engine2TotalTimeMs')).toBe('5010')
  })

  test('two current snapshots difference their wall clocks directly', () => {
    const cell = delta(
        writeRow('old.csv', CURRENT,
            ['OK', 'ifc-regression', 'x64', 'conway1.1.0-ci', 'mep.ifc', 'N/A',
              '1000', '4000', '5400', '5000', 'N/A', 'N/A']),
        writeRow('new.csv', CURRENT,
            ['OK', 'ifc-regression', 'x64', 'conway1.2.0-ci', 'mep.ifc', 'N/A',
              '1000', '4000', '5300', '4900', 'N/A', 'N/A']))

    expect(cell('totalTimeMsDelta')).toBe('-100')
    expect(cell('totalTimeMsBasis')).toBe('wallClock')
  })

  test('two three.js-harness rows still difference their wall clocks', () => {
    // Within ONE harness the window is the same, so the comparison stands.
    const cell = delta(
        writeRow('old.csv', LEGACY_THREE,
            ['OK', 'x64', 'conway1.0.0-ci', 'mep.ifc', 'IFC2X3',
              '1000', '4000', '5400', 'Revit', 'Autodesk']),
        writeRow('new.csv', CURRENT,
            ['OK', 'loader', 'x64', 'conway1.1.0-ci', 'mep.ifc', 'IFC2X3',
              '1000', '4000', '5300', 'N/A', 'Revit', 'Autodesk']))

    expect(cell('totalTimeMsDelta')).toBe('-100')
    expect(cell('totalTimeMsBasis')).toBe('wallClock')
  })

  test('no total is differenced across two harnesses', () => {
    // Both rows say `wallClock`, and they still are not the same quantity:
    // ConwayModelLoader opens allTimeStart and THEN builds and initialises a
    // per-load ConwayGeometry, while the regression child initialises in
    // main() and starts its clock immediately before the file read. Engine
    // init is inside one window and outside the other.
    //
    // Measured at ~195 ms for a fresh engine, which against the regression
    // child's own totals is 120% of index.ifc (162 ms), 24% of haus.ifc
    // (796 ms) and 4.3% of MB-Khaya (4528 ms) — so differencing the two
    // publishes the removal of engine initialisation as an engine speedup,
    // at a scale far above anything the release table exists to flag.
    //
    // The values below are equal on purpose: even with identical totals the
    // honest answer is "not comparable", not 0.
    const cell = delta(
        writeRow('old.csv', LEGACY_THREE,
            ['OK', 'x64', 'conway1.0.0-ci', 'mep.ifc', 'IFC2X3',
              '1000', '4000', '5400', 'Revit', 'Autodesk']),
        writeRow('new.csv', CURRENT,
            ['OK', 'ifc-regression', 'x64', 'conway1.1.0-ci', 'mep.ifc', 'N/A',
              '1000', '4000', '5400', '5010', 'N/A', 'N/A']))

    expect(cell('totalTimeMsDelta')).toBe('N/A')
    expect(cell('totalTimeMsPercentageChange')).toBe('N/A')

    // The blank cell says WHY it is blank. A reader who cannot tell an
    // unmeasured column from an incomparable one learns nothing from N/A.
    expect(cell('totalTimeMsBasis')).toBe('crossHarness')

    // And the raw values are withheld too, so nobody differences them by
    // eye out of the two columns printed beside the delta.
    expect(cell('engine1TotalTimeMs')).toBe('N/A')
    expect(cell('engine2TotalTimeMs')).toBe('N/A')
  })

  test('parsePlusGeometryMs is not substituted across harnesses either', () => {
    // The other candidate fix, rejected. The loader path emits no
    // parsePlusGeometryMs at all (benchmark.cjs writes N/A — there is no
    // such log line to scrape), so it would have to be manufactured from a
    // sum; and the stage clocks it would sum are not the same intervals
    // either — the child's parse clock opens before parseHeader where the
    // loader times the header separately, and the child's geometry clock
    // wraps `new IfcGeometryExtraction(...)` where the loader constructs it
    // outside. A smaller version of the same defect under a new name.
    const cell = delta(
        writeRow('old.csv', LEGACY_REGRESSION,
            ['OK', 'x64', 'conway1.0.0-ci', 'mep.ifc', 'N/A',
              '1000', '4000', '5000', 'N/A', 'N/A']),
        writeRow('new.csv', CURRENT,
            ['OK', 'loader', 'x64', 'conway1.1.0-ci', 'mep.ifc', 'IFC2X3',
              '1000', '4000', '5400', 'N/A', 'Revit', 'Autodesk']))

    expect(cell('totalTimeMsDelta')).toBe('N/A')
    expect(cell('totalTimeMsBasis')).toBe('crossHarness')
  })

  test('the stage columns are withheld across harnesses too', () => {
    // Review round 3. These subtract non-equivalent intervals as surely as
    // the total does: the child's parse clock opens before `parseHeader`
    // (ifc_regression_main.ts:475) where the loader times the header
    // separately and starts its parse clock at `parseDataToModel`
    // (conway_model_loader.ts:418, :468); and the child's geometry clock
    // wraps `new IfcGeometryExtraction(...)` (:549 around :758) where the
    // loader constructs it beforehand (:510 against :525) — a constructor
    // that allocates two native identity matrices and four memory pools.
    //
    // Held comparable for one round because the magnitude was unmeasured.
    // Wrong test: unmeasured is not zero, and comparability is categorical.
    // Magnitude decides severity, not whether two numbers are the same
    // quantity.
    const cell = delta(
        writeRow('old.csv', LEGACY_THREE,
            ['OK', 'x64', 'conway1.0.0-ci', 'mep.ifc', 'IFC2X3',
              '1000', '4000', '5400', 'Revit', 'Autodesk']),
        writeRow('new.csv', CURRENT,
            ['OK', 'ifc-regression', 'x64', 'conway1.1.0-ci', 'mep.ifc', 'N/A',
              '1100', '4200', '5400', '5300', 'N/A', 'N/A']))

    expect(cell('parseTimeMsDelta')).toBe('N/A')
    expect(cell('geometryTimeMsDelta')).toBe('N/A')
    expect(cell('comparability')).toBe('crossHarness')
  })

  test('nothing measured survives a cross-harness join — only identity', () => {
    // The matrix has converged, and this pins the whole of it rather than
    // one column at a time: after three rounds the complete answer for two
    // harnesses is "not comparable". What comes through is which row is
    // which, not what it measured.
    const cell = delta(
        writeRow('old.csv', LEGACY_THREE,
            ['OK', 'x64', 'conway1.0.0-ci', 'mep.ifc', 'IFC2X3',
              '1000', '4000', '5400', 'Revit', 'Autodesk']),
        writeRow('new.csv', CURRENT,
            ['OK', 'ifc-regression', 'x64', 'conway1.1.0-ci', 'mep.ifc', 'N/A',
              '1100', '4200', '5400', '5300', 'N/A', 'N/A']))

    for (const column of [
      'parseTimeMsDelta', 'geometryTimeMsDelta', 'totalTimeMsDelta',
      'totalTimeMsPercentageChange', 'geometryMemoryMbDelta',
      'peakWasmHeapMbDelta', 'rssMbDelta', 'peakRssMbDelta', 'heapUsedMbDelta',
      'heapTotalMbDelta', 'externalMbDelta', 'arrayBuffersMbDelta',
      'retainedRssMbDelta', 'retainedHeapUsedMbDelta',
      'retainedExternalMbDelta', 'engine1TotalTimeMs', 'engine2TotalTimeMs',
    ]) {
      expect(cell(column)).toBe('N/A')
    }

    // Identity survives, and says why the rest did not.
    expect(cell('filename')).toBe('mep.ifc')
    expect(cell('loadStatus1')).toBe('OK')
    expect(cell('loadStatus2')).toBe('OK')
    expect(cell('uname')).toBe('x64')
    expect(cell('comparability')).toBe('crossHarness')
  })
})

describe('legacy provenance is inferred, not assumed comparable', () => {

  /**
   * Write a legacy (pre-#555) detail CSV whose scraped columns decide which
   * harness wrote it.
   *
   * @param name File name.
   * @param scraped Values for schemaVersion / preprocessor / originating.
   * @param geometryMemoryMb The column under test.
   * @return {string} The path written.
   */
  function writeLegacy(
      name: string, scraped: string, geometryMemoryMb: string ): string {

    const file = path.join(workDir, name)

    fs.writeFileSync(file,
        'loadStatus,uname,engine,filename,schemaVersion,parseTimeMs,' +
        'geometryTimeMs,totalTimeMs,geometryMemoryMb,rssMb,' +
        'preprocessorVersion,originatingSystem\n' +
        `OK,x64,conway1.0.0-ci,mep.ifc,${scraped},10,20,30,` +
        `${geometryMemoryMb},400.00,${scraped},${scraped}\n`, 'utf8')

    return file
  }

  /**
   * Difference and return a cell accessor.
   *
   * @param older Older path.
   * @param newer Newer path.
   * @return {(column: string) => string} Cell accessor.
   */
  function delta(older: string, newer: string): (column: string) => string {
    const out = path.join(workDir, 'legacy-delta.csv')

    generateDeltaCSV(older, newer, out)

    const records = parseCsv(fs.readFileSync(out, 'utf8'))

    return (column: string) => records[1][records[0].indexOf(column)]
  }

  /** A current regression row, for the newer side. */
  function writeCurrent(name: string, geometryMemoryMb: string): string {
    const file = path.join(workDir, name)

    fs.writeFileSync(file,
        'loadStatus,writer,uname,engine,filename,schemaVersion,parseTimeMs,' +
        'geometryTimeMs,totalTimeMs,parsePlusGeometryMs,geometryMemoryMb,' +
        'rssMb,preprocessorVersion,originatingSystem\n' +
        'OK,ifc-regression,x64,conway1.1.0-ci,mep.ifc,N/A,10,20,35,30,' +
        `${geometryMemoryMb},400.00,N/A,N/A\n`, 'utf8')

    return file
  }

  test('a populated preprocessorVersion marks a three.js-harness snapshot', () => {
    // The concrete consequence of getting this wrong: the historical
    // headless-three snapshots ran at OPTIMAL capture and the regression
    // child runs at FULL, so 16.80 -> 22.30 would be published as a +5.5 MB
    // geometry-memory regression when it is the 16.8-vs-22.3 methodology
    // gap #555 is about.
    const cell = delta(
        writeLegacy('three.csv', 'Revit', '16.80'),
        writeCurrent('current.csv', '22.30'))

    expect(cell('geometryMemoryMbDelta')).toBe('N/A')

    // Harness-dependent too: a GL context and a scene graph on one side.
    expect(cell('rssMbDelta')).toBe('N/A')
  })

  test('an all-N/A scraped set marks a regression-child snapshot', () => {
    // Same capture on both sides, so the geometry payload IS comparable and
    // withholding it would lose a real signal.
    const cell = delta(
        writeLegacy('regression.csv', 'N/A', '20.00'),
        writeCurrent('current.csv', '22.30'))

    expect(Number(cell('geometryMemoryMbDelta'))).toBeCloseTo(2.3, 5)
    expect(Number(cell('rssMbDelta'))).toBeCloseTo(0, 5)
  })
})

describe('the comparability guard covers the harness columns', () => {

  /**
   * Difference two single-row snapshots that differ only in writer.
   *
   * @param writer1 Older row's writer.
   * @param writer2 Newer row's writer.
   * @return {(column: string) => string} Cell accessor.
   */
  function acrossWriters(
      writer1: string, writer2: string ): (column: string) => string {

    const columns = 'loadStatus,writer,uname,engine,filename,schemaVersion,' +
      'parseTimeMs,geometryTimeMs,totalTimeMs,parsePlusGeometryMs,' +
      'geometryMemoryMb,peakWasmHeapMb,rssMb,peakRssMb,heapUsedMb,' +
      'heapTotalMb,externalMb,arrayBuffersMb,retainedRssMb,' +
      'retainedHeapUsedMb,retainedExternalMb,preprocessorVersion,' +
      'originatingSystem'

    /**
     * One row with the given writer.
     *
     * @param name File name.
     * @param writer The writer cell.
     * @param bump Added to every numeric column.
     * @return {string} Path.
     */
    const write = (name: string, writer: string, bump: number) => {
      const file = path.join(workDir, name)
      const n = (base: number) => (base + bump).toFixed(2)

      fs.writeFileSync(file,
          `${columns}\n` +
          `OK,${writer},x64,conway1.0.0-ci,mep.ifc,N/A,10,20,35,30,` +
          `${n(20)},${n(100)},${n(400)},${n(410)},${n(200)},${n(220)},` +
          `${n(50)},${n(48)},${n(300)},${n(9)},${n(46)},N/A,N/A\n`, 'utf8')

      return file
    }

    const out = path.join(workDir, 'guard-delta.csv')

    generateDeltaCSV(
        write('g-older.csv', writer1, 0), write('g-newer.csv', writer2, 1), out)

    const records = parseCsv(fs.readFileSync(out, 'utf8'))

    return (column: string) => records[1][records[0].indexOf(column)]
  }

  const HARNESS_COLUMNS = [
    'rssMbDelta', 'peakRssMbDelta', 'heapUsedMbDelta', 'heapTotalMbDelta',
    'externalMbDelta', 'arrayBuffersMbDelta', 'retainedRssMbDelta',
    'retainedHeapUsedMbDelta', 'retainedExternalMbDelta',
  ]

  test('every process memory column is withheld across two harnesses', () => {
    // The snapshot README states the case: a regression child's rssMb
    // "excludes a GL context and a three.js scene graph". Withholding only
    // geometryMemoryMb and retention left the rest publishing a harness
    // difference as a change.
    const cell = acrossWriters('loader', 'ifc-regression')

    for (const column of HARNESS_COLUMNS) {
      expect(cell(column)).toBe('N/A')
    }
  })

  test('the same harness at a different capture withholds only the payload', () => {
    // ifc-regression vs ap214-regression: one process shape, two capture
    // modes. Only the column the capture mode reaches is withheld.
    const cell = acrossWriters('ap214-regression', 'ifc-regression')

    expect(cell('geometryMemoryMbDelta')).toBe('N/A')

    for (const column of HARNESS_COLUMNS) {
      expect(Number(cell(column))).toBeCloseTo(1, 5)
    }
  })

  test('peakWasmHeapMb survives a capture change, because it is measured to', () => {
    // Measured, not assumed: MB-Khaya reads peakWasmHeapMb 101.56 MB under
    // BOTH capture modes, against a geometryMemoryMb of 16.82 vs 22.26. The
    // linear memory is a grow-only high-water and the temporaries are
    // allocated either way; FULL only keeps the JS-side handles. Withholding
    // it would cost a real signal for a difference that does not exist.
    const cell = acrossWriters('ap214-regression', 'ifc-regression')

    expect(Number(cell('peakWasmHeapMbDelta'))).toBeCloseTo(1, 5)
  })

  test('one harness and one capture differences everything', () => {
    const cell = acrossWriters('ifc-regression', 'ifc-regression')

    expect(Number(cell('geometryMemoryMbDelta'))).toBeCloseTo(1, 5)

    for (const column of HARNESS_COLUMNS) {
      expect(Number(cell(column))).toBeCloseTo(1, 5)
    }
  })
})

describe('benchmark.cjs builds its rows by name (conway#570 review)', () => {

  const benchmarkSource = fs.readFileSync(
      path.resolve(process.cwd(), 'scripts/benchmark.cjs'), 'utf8')

  test('no row is a positional literal any more', () => {
    // The failure row was a positional csvRow([...]) of 22 cells. Widening
    // the header to 24 shifted it silently: uname landed in `writer`, the
    // encoded model name in `engine`, and `filename` — the delta's join key
    // — became N/A, so a FAIL row could no longer be matched to the same
    // model's OK row in another run. That is the second time this exact row
    // has broken that join.
    expect(benchmarkSource).not.toMatch(/const failLine = csvRow\(\[/)
    expect(benchmarkSource).not.toMatch(/const line = csvRow\(\[/)
  })

  test('both writers go through the named builder', () => {
    expect(benchmarkSource).toContain('const failLine = detailRow({')
    expect(benchmarkSource).toContain('const line = detailRow({')

    // And the builder fills anything unsupplied with N/A rather than ''.
    expect(benchmarkSource)
        .toMatch(/fields\[column\] !== undefined \? fields\[column\] : 'N\/A'/)
  })

  test('the failure row still carries the join key', () => {
    const failRow = /const failLine = detailRow\(\{([^}]*)\}\)/.exec(
        benchmarkSource)

    expect(failRow).not.toBeNull()
    expect(failRow![1]).toContain('filename: encodeFileName(displayName)')
    expect(failRow![1]).toContain("loadStatus: 'FAIL'")
  })
})
