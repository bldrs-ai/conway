import fs from 'fs'
import os from 'os'
import path from 'path'
import { describe, expect, test, beforeAll, afterAll } from '@jest/globals'
import { createRequire } from 'module'

/**
 * RFC 4180 quoting in the perf CSVs (`performance-detail.csv` and the delta
 * CSVs derived from it).
 *
 * `preprocessorVersion` and `originatingSystem` are free text lifted straight
 * out of an IFC/STEP FILE_NAME header. Emitted unquoted, a value like
 * `Trimble Nova (Build = 16.2.0.15, Compile = Sep 23 2021)` splits the record
 * into 19 columns against an 18-column header — which is exactly what five
 * committed rows in test-models / test-models-private did, and why GitHub's
 * CSV viewer refused to render them.
 *
 * Both halves are pinned here: the writer must quote, and the reader
 * gen_delta_csv.cjs uses must honour the quotes, or the join silently reads
 * the wrong columns.
 */
const require_ = createRequire(import.meta.url)

// Resolved from the repo root rather than relative to this file: the test runs
// from compiled/src/scripts, where a relative hop would land in
// compiled/scripts, which does not exist (scripts/ is not part of the tsc
// build). Jest's rootDir is the repo root.
const { csvField, csvRow, parseCsv } =
  require_(path.resolve(process.cwd(), 'scripts/csv_rfc4180.cjs')) as {
    csvField: (value: unknown) => string,
    csvRow: (fields: unknown[]) => string,
    parseCsv: (text: string) => string[][],
  }

const { generateDeltaCSV } =
  require_(path.resolve(process.cwd(), 'scripts/gen_delta_csv.cjs')) as {
    generateDeltaCSV: (a: string, b: string, out: string) => void,
  }

/**
 * The shape that broke, plus a double quote — the IFC header field can carry
 * one and nothing in the pipeline was escaping it either.
 */
const NASTY_PREPROCESSOR =
  'Trimble Nova (Build = 16.2.0.15, Compile = "Sep 23 2021")'

/** Columns in the delta CSV, per the committed `*_delta.csv` convention. */
const DELTA_COLUMN_COUNT = 21

const DETAIL_HEADER = [
  'timestamp', 'loadStatus', 'uname', 'engine', 'filename', 'schemaVersion',
  'parseTimeMs', 'geometryTimeMs', 'totalTimeMs', 'geometryMemoryMb',
  'rssMb', 'peakRssMb', 'heapUsedMb', 'heapTotalMb', 'externalMb',
  'arrayBuffersMb', 'preprocessorVersion', 'originatingSystem',
]

/** The three memory columns #552 added, absent from every older snapshot. */
const COLUMNS_ADDED_IN_552 = ['peakRssMb', 'externalMb', 'arrayBuffersMb']

/**
 * The header every snapshot committed before #552 carries. Those files are
 * the baselines a release delta is computed against, so the 15-column shape
 * has to keep working as an input forever.
 */
const LEGACY_DETAIL_HEADER =
  DETAIL_HEADER.filter((column) => !COLUMNS_ADDED_IN_552.includes(column))

/**
 * Build a performance-detail.csv row the way scripts/benchmark.cjs does —
 * through csvRow, every field, in column order.
 *
 * @param filename Model filename (the delta's join key).
 * @param totalTimeMs Total load time for the row.
 * @return The encoded record, without a trailing newline.
 */
function detailRow(filename: string, totalTimeMs: string): string {
  return csvRow([
    '20260811153721', 'OK', 'x64', 'conway1.451.1357', filename, 'IFC2X3',
    '71', '245', totalTimeMs, '0.776', '300.859', '412.320', '137.000',
    '157.582', '38.100', '36.400', NASTY_PREPROCESSOR, 'N/A',
  ])
}

let workDir: string

beforeAll(() => {
  workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'perf-csv-quoting-'))
})

afterAll(() => {
  fs.rmSync(workDir, { recursive: true, force: true })
})

describe('csvField', () => {

  test('leaves a field with no special characters alone', () => {
    expect(csvField('conway1.451.1357')).toBe('conway1.451.1357')
    // A number field is stringified, not quoted.
    expect(csvField(Number('48303'))).toBe('48303')
  })

  test('quotes a comma and doubles an embedded quote', () => {
    // Written out literally rather than compared against a round trip: this
    // pins the on-disk encoding, so a reader that is not parseCsv (GitHub's
    // CSV viewer, python csv, a spreadsheet) reads it back the same way.
    expect(csvField(NASTY_PREPROCESSOR)).toBe(
      '"Trimble Nova (Build = 16.2.0.15, Compile = ""Sep 23 2021"")"')
  })

  test('quotes embedded newlines', () => {
    expect(csvField('line one\nline two')).toBe('"line one\nline two"')
    expect(csvField('line one\r\nline two')).toBe('"line one\r\nline two"')
  })

  test('renders null and undefined as the empty field', () => {
    expect(csvField(null)).toBe('')
    expect(csvField(undefined)).toBe('')
  })
})

describe('performance-detail.csv rows', () => {

  test('a preprocessorVersion with a comma and a quote round-trips', () => {
    const text = `${csvRow(DETAIL_HEADER)}\n${detailRow('mep.ifc', '326')}\n`
    const records = parseCsv(text)

    expect(records).toHaveLength(2)
    // The whole point: 18 columns, not 19.
    expect(records[0]).toHaveLength(DETAIL_HEADER.length)
    expect(records[1]).toHaveLength(DETAIL_HEADER.length)

    const preprocessorIndex = DETAIL_HEADER.indexOf('preprocessorVersion')
    expect(records[1][preprocessorIndex]).toBe(NASTY_PREPROCESSOR)
    expect(records[1][DETAIL_HEADER.indexOf('originatingSystem')]).toBe('N/A')
    // A field after the comma still lands in its own column, which is what a
    // torn row loses.
    expect(records[1][DETAIL_HEADER.indexOf('totalTimeMs')]).toBe('326')
  })

  test('a filename containing a comma stays one column', () => {
    // The FAIL path writes the raw model name, and models in the corpus are
    // named this way ("Wiesenplatz 7, 4057 Basel.ifc").
    const name = 'Wiesenplatz 7, 4057 Basel.ifc'
    const records = parseCsv(`${csvRow(DETAIL_HEADER)}\n${detailRow(name, '12')}\n`)

    expect(records[1]).toHaveLength(DETAIL_HEADER.length)
    expect(records[1][DETAIL_HEADER.indexOf('filename')]).toBe(name)
  })
})

describe('gen_delta_csv.cjs', () => {

  /**
   * Write a two-row performance-detail.csv into the work dir.
   *
   * @param name File basename to write.
   * @param rows Encoded records.
   * @param header Column header to write, for the old-vs-new column-set cases.
   * @return The absolute path written.
   */
  function writeDetail(
      name: string, rows: string[], header: string[] = DETAIL_HEADER): string {
    const filePath = path.join(workDir, name)
    fs.writeFileSync(filePath, `${csvRow(header)}\n${rows.join('\n')}\n`)
    return filePath
  }

  test('joins on filename across quoted fields and emits 21 columns', () => {
    const older = writeDetail('older.csv', [
      detailRow('mep.ifc', '400'),
      detailRow('only-in-older.ifc', '100'),
    ])
    const newer = writeDetail('newer.csv', [
      detailRow('mep.ifc', '300'),
      detailRow('only-in-newer.ifc', '200'),
    ])
    const out = path.join(workDir, 'delta.csv')

    generateDeltaCSV(older, newer, out)

    const records = parseCsv(fs.readFileSync(out, 'utf8'))
    const header = records[0]
    expect(header).toHaveLength(DELTA_COLUMN_COUNT)

    for (const record of records) {
      expect(record).toHaveLength(DELTA_COLUMN_COUNT)
    }

    const byFile = new Map(
      records.slice(1).map((r) => [r[header.indexOf('filename')], r]))

    // The join found the shared model despite the comma-bearing field sitting
    // between the columns it reads.
    expect(byFile.get('mep.ifc')![header.indexOf('totalTimeMsDelta')]).toBe('-100')
    expect(byFile.get('mep.ifc')![header.indexOf('totalTimeMsPercentageChange')])
        .toBe('-25.00%')

    // A model present in only one run is reported, not dropped — the corpus
    // changes between releases and those rows are the interesting ones.
    expect(byFile.get('only-in-older.ifc')![header.indexOf('loadStatus2')])
        .toBe('N/A')
    expect(byFile.get('only-in-newer.ifc')![header.indexOf('loadStatus1')])
        .toBe('N/A')
  })

  test('joins on a filename that itself contains a comma', () => {
    // filename sits at column 5, ahead of every measurement column the delta
    // reads, so this is the case where a reader that ignores quoting does not
    // merely drop a trailing cell — it shifts loadStatus, totalTimeMs and the
    // rest one place right and joins on a fragment. The FAIL path writes the
    // raw model name, and the corpus contains names like this one.
    const name = 'Wiesenplatz 7, 4057 Basel.ifc'
    const older = writeDetail('comma-older.csv', [detailRow(name, '400')])
    const newer = writeDetail('comma-newer.csv', [detailRow(name, '300')])
    const out = path.join(workDir, 'comma-delta.csv')

    generateDeltaCSV(older, newer, out)

    const records = parseCsv(fs.readFileSync(out, 'utf8'))
    const header = records[0]

    expect(records).toHaveLength(2)
    expect(records[1]).toHaveLength(DELTA_COLUMN_COUNT)
    expect(records[1][header.indexOf('filename')]).toBe(name)
    expect(records[1][header.indexOf('totalTimeMsDelta')]).toBe('-100')
    expect(records[1][header.indexOf('loadStatus1')]).toBe('OK')
  })

  /** SKYLARK250 as a 1.451 headless-three snapshot row: every column measured. */
  const SKYLARK_1_451 = csvRow([
    '20260811154725', 'OK', 'x64', 'conway1.451.1357', 'skylark.ifc', 'IFC4',
    '5729', '42572', '48303', '185.836', '5495.645', '5601.500', '3865.072',
    '3952.602', '432.500', '430.250', NASTY_PREPROCESSOR, 'N/A',
  ])

  test('reports an absent measurement as N/A, not as a delta against zero', () => {
    // The bug this pins: parseValue used to coerce 'N/A' to 0, so a matched row
    // whose newer side has no geometryMemoryMb came out as
    // geometryMemoryMbDelta = -(the whole baseline allocation) — a fabricated
    // 100% memory win. It reported -185.836 for SKYLARK250, which is exactly
    // the model someone reads this delta for.
    //
    // The conway-native writer measures geometryMemoryMb again since #552, but
    // every snapshot blessed between #548 and #552 wrote N/A into that column,
    // and those files stay in the corpus as baselines forever.
    const withoutMemory = csvRow([
      '20260821154725', 'OK', 'x64', 'conway1.543.1513-ci', 'skylark.ifc',
      'N/A', '8035', '72371', '80406', 'N/A', '5379.12', '5488.40', '3793.69',
      '3877.96', '428.30', '426.10', 'N/A', 'N/A',
    ])

    const older = writeDetail('mem-older.csv', [SKYLARK_1_451])
    const newer = writeDetail('mem-newer.csv', [withoutMemory])
    const out = path.join(workDir, 'mem-delta.csv')

    generateDeltaCSV(older, newer, out)

    const records = parseCsv(fs.readFileSync(out, 'utf8'))
    const header = records[0]
    const row = records[1]

    expect(row[header.indexOf('geometryMemoryMbDelta')]).toBe('N/A')
    // The columns that ARE measured on both sides still compute.
    expect(row[header.indexOf('totalTimeMsDelta')]).toBe('32103')
    expect(row[header.indexOf('rssMbDelta')]).not.toBe('N/A')
  })

  test('differences geometryMemoryMb when both sides measured it', () => {
    // The other half of the #548 asymmetry, and what #552 restored: with the
    // conway-native writer emitting the column again, a delta between two
    // measured runs must report the number rather than the N/A that stood in
    // for "this harness cannot measure it".
    const newerMemory = csvRow([
      '20260821154725', 'OK', 'x64', 'conway1.550.1516-ci', 'skylark.ifc',
      'N/A', '8035', '72371', '80406', '190.836', '5379.12', '5488.50',
      '3793.69', '3877.96', '433.500', '431.250', 'N/A', 'N/A',
    ])

    const older = writeDetail('gmem-older.csv', [SKYLARK_1_451])
    const newer = writeDetail('gmem-newer.csv', [newerMemory])
    const out = path.join(workDir, 'gmem-delta.csv')

    generateDeltaCSV(older, newer, out)

    const records = parseCsv(fs.readFileSync(out, 'utf8'))
    const header = records[0]
    const row = records[1]

    expect(row[header.indexOf('geometryMemoryMbDelta')]).toBe('5')
    expect(row[header.indexOf('peakRssMbDelta')]).toBe('-113')
  })

  test('differences the off-heap columns when both sides measured them', () => {
    // externalMb / arrayBuffersMb hold what heapUsedMb structurally cannot
    // see — the source buffer and the parse structures. On MB-Khaya a 31 MB
    // readFileSync moves arrayBuffers 0.1 -> 31.5 MB without moving heapUsed
    // at all, so a release that changed how the source is held would show up
    // in these two columns and nowhere else in this file.
    const newerOffHeap = csvRow([
      '20260821154725', 'OK', 'x64', 'conway1.550.1516-ci', 'skylark.ifc',
      'N/A', '8035', '72371', '80406', '185.836', '5495.645', '5601.500',
      '3865.072', '3952.602', '433.500', '431.250', 'N/A', 'N/A',
    ])

    const older = writeDetail('ext-older.csv', [SKYLARK_1_451])
    const newer = writeDetail('ext-newer.csv', [newerOffHeap])
    const out = path.join(workDir, 'ext-delta.csv')

    generateDeltaCSV(older, newer, out)

    const records = parseCsv(fs.readFileSync(out, 'utf8'))
    const header = records[0]
    const row = records[1]

    expect(row[header.indexOf('externalMbDelta')]).toBe('1')
    expect(row[header.indexOf('arrayBuffersMbDelta')]).toBe('1')
    // Both are real measurements here, so neither may fall back to N/A.
    expect(row[header.indexOf('heapUsedMbDelta')]).toBe('0')
  })

  test('reports the #552 columns as N/A against a header that lacks them', () => {
    // Every snapshot committed before #552 has a 15-column header with no
    // peakRssMb / externalMb / arrayBuffersMb at all — not N/A cells, no
    // cells. That absence must read as "no measurement", exactly like #548's
    // N/A: coercing it to 0 would report the new run's entire peak, and its
    // whole off-heap footprint, as regressions against nothing.
    const legacyRow = csvRow([
      '20260811153651', 'OK', 'x64', 'conway1.451.1357', 'skylark.ifc', 'IFC4',
      '5729', '42572', '48303', '185.836', '5495.645', '3865.072', '3952.602',
      NASTY_PREPROCESSOR, 'N/A',
    ])

    const older =
      writeDetail('legacy-older.csv', [legacyRow], LEGACY_DETAIL_HEADER)
    const newer = writeDetail('legacy-newer.csv', [SKYLARK_1_451])
    const out = path.join(workDir, 'legacy-delta.csv')

    generateDeltaCSV(older, newer, out)

    const records = parseCsv(fs.readFileSync(out, 'utf8'))
    const header = records[0]
    const row = records[1]

    expect(row[header.indexOf('peakRssMbDelta')]).toBe('N/A')
    expect(row[header.indexOf('externalMbDelta')]).toBe('N/A')
    expect(row[header.indexOf('arrayBuffersMbDelta')]).toBe('N/A')
    // Every column both files DO carry still computes; the join is unaffected
    // by the differing column counts because it reads by name.
    expect(row[header.indexOf('totalTimeMsDelta')]).toBe('0')
    expect(row[header.indexOf('geometryMemoryMbDelta')]).toBe('0')
    expect(row[header.indexOf('rssMbDelta')]).toBe('0')
  })

  test('reports a FAIL row as N/A rather than a 100% improvement', () => {
    // Same coercion, and this is where it did the most damage: a model that
    // regressed OK -> FAIL used to read as totalTimeMsDelta = -(its old total)
    // with a -100.00% change, i.e. the biggest "improvement" in the file.
    const okRow = detailRow('flipper.ifc', '48303')
    const failRow = csvRow([
      '20260821153721', 'FAIL', 'x64', 'conway1.543.1513', 'flipper.ifc',
      'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A',
      'N/A', 'N/A', 'N/A',
    ])

    const older = writeDetail('fail-older.csv', [okRow])
    const newer = writeDetail('fail-newer.csv', [failRow])
    const out = path.join(workDir, 'fail-delta.csv')

    generateDeltaCSV(older, newer, out)

    const records = parseCsv(fs.readFileSync(out, 'utf8'))
    const header = records[0]
    const row = records[1]

    expect(row[header.indexOf('loadStatus1')]).toBe('OK')
    expect(row[header.indexOf('loadStatus2')]).toBe('FAIL')
    expect(row[header.indexOf('totalTimeMsDelta')]).toBe('N/A')
    expect(row[header.indexOf('totalTimeMsPercentageChange')]).toBe('N/A')
    expect(row[header.indexOf('geometryTimeMsDelta')]).toBe('N/A')
  })

  test('a real zero is still a number, not treated as absent', () => {
    // web-ifc rows carry parseTimeMs/geometryTimeMs of literally 0 because that
    // engine does not split the stages, so "0" and "no measurement" must stay
    // distinguishable.
    const zeroed = (engine: string, total: string) => csvRow([
      '20260811154725', 'OK', 'x64', engine, 'z.ifc', 'IFC4',
      '0', '0', total, '1.5', '100', '120', '50', '60', '12', '10', 'N/A',
      'N/A',
    ])

    const older = writeDetail('zero-older.csv', [zeroed('webifc0.0.67', '100')])
    const newer = writeDetail('zero-newer.csv', [zeroed('webifc0.0.67', '150')])
    const out = path.join(workDir, 'zero-delta.csv')

    generateDeltaCSV(older, newer, out)

    const records = parseCsv(fs.readFileSync(out, 'utf8'))
    const header = records[0]
    const row = records[1]

    expect(row[header.indexOf('parseTimeMsDelta')]).toBe('0')
    expect(row[header.indexOf('totalTimeMsDelta')]).toBe('50')
    expect(row[header.indexOf('totalTimeMsPercentageChange')]).toBe('50.00%')
  })

  test('joins a raw filename on one side to its encoded form on the other', () => {
    // benchmark.cjs URL-encoded the filename on its OK path but wrote the raw
    // name on its render-failure path, so a committed baseline can hold both
    // spellings of one model. The writer is fixed, but those files are history:
    // without the canonical fallback the delta emits two one-sided rows and
    // loses the OK -> FAIL transition, which is the row that matters most.
    const rawFail = csvRow([
      '20260811154725', 'FAIL', 'x64', 'conway1.451.1357',
      'S_Office_Integrated Design Archi.ifc', 'N/A', 'N/A', 'N/A', 'N/A',
      'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A',
    ])
    const encodedOk =
      detailRow('S_Office_Integrated%20Design%20Archi.ifc', '4647')

    const older = writeDetail('enc-older.csv', [rawFail])
    const newer = writeDetail('enc-newer.csv', [encodedOk])
    const out = path.join(workDir, 'enc-delta.csv')

    generateDeltaCSV(older, newer, out)

    const records = parseCsv(fs.readFileSync(out, 'utf8'))
    const header = records[0]

    // One row, not two one-sided ones.
    expect(records).toHaveLength(2)
    expect(records[1][header.indexOf('loadStatus1')]).toBe('FAIL')
    expect(records[1][header.indexOf('loadStatus2')]).toBe('OK')
  })

  test('does not collapse two models whose names differ only by encoding', () => {
    // The fallback must not become a normalizing join: a corpus that really
    // contained both spellings as distinct files has to keep them distinct.
    const older = writeDetail('amb-older.csv', [
      detailRow('a b.ifc', '100'),
      detailRow('a%20b.ifc', '200'),
    ])
    const newer = writeDetail('amb-newer.csv', [detailRow('a b.ifc', '150')])
    const out = path.join(workDir, 'amb-delta.csv')

    generateDeltaCSV(older, newer, out)

    const records = parseCsv(fs.readFileSync(out, 'utf8'))
    const header = records[0]
    const byFile = new Map(
      records.slice(1).map((r) => [r[header.indexOf('filename')], r]))

    expect(byFile.size).toBe(2)
    // The exact match wins.
    expect(byFile.get('a b.ifc')![header.indexOf('totalTimeMsDelta')]).toBe('50')
    // The other stays one-sided rather than stealing the same counterpart.
    expect(byFile.get('a%20b.ifc')![header.indexOf('loadStatus2')]).toBe('N/A')
  })

  test('reports a model whose loadStatus changed between runs', () => {
    const okRow = detailRow('flipper.ifc', '500')
    const failRow = csvRow([
      '20260821153721', 'FAIL', 'x64', 'conway1.543.1513', 'flipper.ifc',
      'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A',
      'N/A', NASTY_PREPROCESSOR, 'N/A',
    ])

    const older = writeDetail('status-older.csv', [okRow])
    const newer = writeDetail('status-newer.csv', [failRow])
    const out = path.join(workDir, 'status-delta.csv')

    generateDeltaCSV(older, newer, out)

    const records = parseCsv(fs.readFileSync(out, 'utf8'))
    const header = records[0]
    const row = records[1]

    expect(records).toHaveLength(2)
    expect(row[header.indexOf('loadStatus1')]).toBe('OK')
    expect(row[header.indexOf('loadStatus2')]).toBe('FAIL')
  })
})
