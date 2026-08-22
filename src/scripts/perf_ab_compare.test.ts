import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, test } from '@jest/globals'
import { createRequire } from 'module'

/**
 * The rc-regression GC-settle A/B comparator (scripts/perf_ab_compare.cjs).
 *
 * The rc job runs the corpus twice in one job — the blessed pass in the
 * shipped configuration, then a control pass with `CONWAY_PERF_EXPOSE_GC=0` —
 * and differences them there, because between two separate CI runs the timing
 * columns carry a ~1.5x runner scale factor two orders of magnitude larger
 * than the ~1% effect under test (conway#554). This pins the three things
 * that make the resulting number readable: that a control pass which measured
 * retention is called out as an invalid A/B rather than reported as a result,
 * that `N/A` propagates instead of being coerced to 0 (#548), and that
 * `Date.now()`-quantised rows are excluded from the ratio statistics rather
 * than allowed to dominate them.
 */
/* eslint-disable no-magic-numbers -- the literals here are the fixture
   timings and percentile fractions the cases are about; naming a 0.1 or a
   110 ms parse would hide the shape each case exists to express. */

const require_ = createRequire(import.meta.url)

// Resolved from the repo root: the test runs from compiled/src/scripts, and
// scripts/ is not part of the tsc build. Jest's rootDir is the repo root.
type PerfRow = Record<string, string>
type ColumnSummary = {
  column: string,
  n: number,
  floored: number,
  medianRatio: number | null,
  p10: number | null,
  p90: number | null,
  slower: number,
  medianDelta: number | null,
}
type Comparison = {
  pairs: { file: string, blessed: PerfRow, control: PerfRow }[],
  timing: ColumnSummary[],
  memory: ColumnSummary[],
  switchCheck: {
    blessedMeasured: number,
    blessedTotal: number,
    controlMeasured: number,
    controlTotal: number,
    valid: boolean,
  },
  blessedOnly: string[],
  controlOnly: string[],
}

const {
  RATIO_FLOOR_MS, checkSwitch, compareRuns, numeric, percentile, readPerfCsv,
  renderCsv, renderMarkdown, summariseColumn,
} =
  require_(path.resolve(process.cwd(), 'scripts/perf_ab_compare.cjs')) as {
    RATIO_FLOOR_MS: number,
    readPerfCsv: (file: string) => PerfRow[],
    checkSwitch: (blessed: PerfRow[], control: PerfRow[]) =>
      Comparison['switchCheck'],
    compareRuns: (blessed: PerfRow[], control: PerfRow[]) => Comparison,
    numeric: (value: string | undefined) => number | null,
    percentile: (values: number[], fraction: number) => number | null,
    renderCsv: (comparison: Comparison) => string,
    renderMarkdown: (comparison: Comparison, label: string) => string,
    summariseColumn: (
      pairs: Comparison['pairs'], column: string, applyFloor: boolean) =>
      ColumnSummary,
  }

/**
 * A perf.csv row with the columns this comparator reads, overridable per test.
 *
 * @param overrides Column values to set.
 * @return {PerfRow} The row.
 */
function row(overrides: Partial<PerfRow> & { file: string }): PerfRow {
  return {
    status: 'OK',
    parseTimeMs: '100',
    geometryTimeMs: '1000',
    totalTimeMs: '1100',
    heapUsedMb: '50.00',
    rssMb: '300.00',
    peakRssMb: '310.00',
    retainedRssMb: 'N/A',
    retainedHeapUsedMb: 'N/A',
    retainedExternalMb: 'N/A',
    ...overrides,
  }
}

/**
 * A blessed-pass row: the settle ran, so retention is measured.
 *
 * @param overrides Column values to set.
 * @return {PerfRow} The row.
 */
function blessedRow(overrides: Partial<PerfRow> & { file: string }): PerfRow {
  return row({
    retainedRssMb: '380.00',
    retainedHeapUsedMb: '10.00',
    retainedExternalMb: '47.00',
    ...overrides,
  })
}

describe('readPerfCsv', () => {

  let workDir: string

  beforeEach(() => {
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'perf-ab-'))
  })

  afterEach(() => {
    fs.rmSync(workDir, { recursive: true, force: true })
  })

  test('reads the 16-column perf.csv both passes write', () => {
    // The exact header ifc_regression_main.ts emits, with a control-pass row:
    // the file this comparator is pointed at in CI, not a reduced stand-in.
    const file = path.join(workDir, 'perf-nogc.csv')

    fs.writeFileSync(file,
      'file,status,parseTimeMs,geometryTimeMs,totalTimeMs,geometryMemoryMb,' +
      'peakWasmHeapMb,rssMb,peakRssMb,heapUsedMb,heapTotalMb,externalMb,' +
      'arrayBuffersMb,retainedRssMb,retainedHeapUsedMb,retainedExternalMb\n' +
      'AC20-FZK-Haus.ifc,OK,76,436,512,1.69,35.13,289.39,289.52,54.40,84.34,' +
      '9.98,7.93,N/A,N/A,N/A\n')

    const rows = readPerfCsv(file)

    expect(rows).toHaveLength(1)
    expect(rows[0].file).toBe('AC20-FZK-Haus.ifc')
    expect(rows[0].totalTimeMs).toBe('512')
    expect(rows[0].retainedRssMb).toBe('N/A')
  })

  test('an empty file is no rows, not a throw', () => {
    const file = path.join(workDir, 'empty.csv')

    fs.writeFileSync(file, '')

    expect(readPerfCsv(file)).toEqual([])
  })
})

describe('numeric', () => {

  test('treats N/A and blank as absent rather than zero', () => {
    // #548: parseValue returning 0.0 for a missing column produced a phantom
    // -185.836 MB "win" for SKYLARK250. Nothing in this file may repeat it.
    expect(numeric('N/A')).toBeNull()
    expect(numeric('')).toBeNull()
    expect(numeric(undefined)).toBeNull()
    expect(numeric('0')).toBe(0)
    expect(numeric('12.5')).toBe(12.5)
  })
})

describe('percentile', () => {

  test('interpolates between samples and handles the empty case', () => {
    expect(percentile([1, 2, 3, 4], 0.5)).toBeCloseTo(2.5)
    expect(percentile([1, 2, 3, 4, 5], 0.1)).toBeCloseTo(1.4)
    expect(percentile([], 0.5)).toBeNull()
  })
})

describe('checkSwitch', () => {

  test('a control pass with no retention against a blessed pass with it is valid', () => {
    const check = checkSwitch(
      [blessedRow({ file: 'a.ifc' }), blessedRow({ file: 'b.ifc' })],
      [row({ file: 'a.ifc' }), row({ file: 'b.ifc' })])

    expect(check.valid).toBe(true)
    expect(check.blessedMeasured).toBe(2)
    expect(check.controlMeasured).toBe(0)
  })

  test('a control pass that measured retention is not an A/B at all', () => {
    // The env switch never reached the children, so both passes ran the same
    // configuration and every timing ratio below is noise against noise.
    const check = checkSwitch(
      [blessedRow({ file: 'a.ifc' })], [blessedRow({ file: 'a.ifc' })])

    expect(check.valid).toBe(false)
    expect(check.controlMeasured).toBe(1)
  })

  test('a blessed pass with no retention is equally not an A/B', () => {
    const check =
      checkSwitch([row({ file: 'a.ifc' })], [row({ file: 'a.ifc' })])

    expect(check.valid).toBe(false)
  })
})

describe('summariseColumn', () => {

  const pairs = (
    blessed: Partial<PerfRow>[], control: Partial<PerfRow>[]) =>
    blessed.map((value, index) => ({
      file: `m${index}.ifc`,
      blessed: row({ file: `m${index}.ifc`, ...value }),
      control: row({ file: `m${index}.ifc`, ...control[index] }),
    }))

  test('ratio, sign count and median delta', () => {
    const stat = summariseColumn(
      pairs(
        [{ totalTimeMs: '110' }, { totalTimeMs: '90' }, { totalTimeMs: '100' }],
        [{ totalTimeMs: '100' }, { totalTimeMs: '100' }, { totalTimeMs: '100' }]),
      'totalTimeMs', true)

    expect(stat.n).toBe(3)
    expect(stat.medianRatio).toBeCloseTo(1.0)
    expect(stat.slower).toBe(1)
    expect(stat.medianDelta).toBe(0)
  })

  test('rows under the quantisation floor are counted out, not counted in', () => {
    // A 3 ms parse carries a +/-1 ms Date.now() tick — a 33% "ratio" that is
    // pure rounding, and there are enough tiny models in the corpus to swamp
    // the median with them.
    const stat = summariseColumn(
      pairs(
        [{ parseTimeMs: '3' }, { parseTimeMs: '4' }, { parseTimeMs: '200' }],
        [{ parseTimeMs: '1' }, { parseTimeMs: '2' }, { parseTimeMs: '100' }]),
      'parseTimeMs', true)

    expect(RATIO_FLOOR_MS).toBe(10)
    expect(stat.floored).toBe(2)
    expect(stat.n).toBe(1)
    expect(stat.medianRatio).toBeCloseTo(2.0)
  })

  test('the floor is not applied to the memory columns', () => {
    const stat = summariseColumn(
      pairs([{ heapUsedMb: '5.0' }], [{ heapUsedMb: '8.0' }]),
      'heapUsedMb', false)

    expect(stat.floored).toBe(0)
    expect(stat.n).toBe(1)
  })

  test('an unmeasured cell on either side drops the pair, it does not read zero', () => {
    const stat = summariseColumn(
      pairs([{ totalTimeMs: 'N/A' }, { totalTimeMs: '200' }],
        [{ totalTimeMs: '100' }, { totalTimeMs: 'N/A' }]),
      'totalTimeMs', true)

    expect(stat.n).toBe(0)
    expect(stat.medianRatio).toBeNull()
  })
})

describe('compareRuns', () => {

  test('joins on file, and reports rows only one pass produced', () => {
    const comparison = compareRuns(
      [blessedRow({ file: 'a.ifc' }), blessedRow({ file: 'only-blessed.ifc' })],
      [row({ file: 'a.ifc' }), row({ file: 'only-control.ifc' })])

    expect(comparison.pairs.map((pair) => pair.file)).toEqual(['a.ifc'])
    expect(comparison.blessedOnly).toEqual(['only-blessed.ifc'])
    expect(comparison.controlOnly).toEqual(['only-control.ifc'])
  })

  test('a model that failed in either pass is not timed against one that did not', () => {
    const comparison = compareRuns(
      [blessedRow({ file: 'a.ifc', status: 'FAIL' })],
      [row({ file: 'a.ifc' })])

    expect(comparison.pairs).toHaveLength(0)
  })

  test('summarises the three timing columns and the memory columns', () => {
    const comparison =
      compareRuns([blessedRow({ file: 'a.ifc' })], [row({ file: 'a.ifc' })])

    expect(comparison.timing.map((stat) => stat.column))
      .toEqual(['parseTimeMs', 'geometryTimeMs', 'totalTimeMs'])
    expect(comparison.memory.map((stat) => stat.column))
      .toEqual(['heapUsedMb', 'rssMb', 'peakRssMb'])
  })
})

describe('renderMarkdown', () => {

  test('a valid A/B says so, and reports the sign rule in both directions', () => {
    const text = renderMarkdown(
      compareRuns([blessedRow({ file: 'a.ifc' })], [row({ file: 'a.ifc' })]),
      'bldrs-ai/test-models')

    expect(text).toContain('**Switch check: OK.**')
    expect(text).toContain('gc on SLOWER')
    expect(text).toContain('gc on FASTER')
  })

  test('an invalid A/B is labelled INVALID rather than presented as a result', () => {
    const text = renderMarkdown(
      compareRuns(
        [blessedRow({ file: 'a.ifc' })], [blessedRow({ file: 'a.ifc' })]),
      'bldrs-ai/test-models')

    expect(text).toContain('INVALID')
    expect(text).toContain('answers nothing about the settle')
  })
})

describe('renderCsv', () => {

  test('carries both passes, the ratio, and the blessed retention columns', () => {
    const text = renderCsv(compareRuns(
      [blessedRow({ file: 'a.ifc', totalTimeMs: '110' })],
      [row({ file: 'a.ifc', totalTimeMs: '100' })]))
    const [header, dataRow] = text.trim().split('\n')

    expect(header).toContain('totalTimeMs_gcOn,totalTimeMs_gcOff,totalTimeMs_ratio')
    expect(header).toContain('retainedRssMb_gcOn')
    expect(dataRow).toContain('110,100,1.1000')
    expect(dataRow).toContain('380.00')
  })

  test('an unmeasured input yields N/A, never a fabricated ratio', () => {
    const text = renderCsv(compareRuns(
      [blessedRow({ file: 'a.ifc', totalTimeMs: 'N/A' })],
      [row({ file: 'a.ifc', totalTimeMs: '100' })]))
    const dataRow = text.trim().split('\n')[1]

    expect(dataRow).toContain('N/A,100,N/A')
  })
})
