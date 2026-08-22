import fs from 'fs'
import os from 'os'
import path from 'path'
import { describe, expect, test, beforeEach, afterEach } from '@jest/globals'
import { createRequire } from 'module'

/**
 * The rc-regression bless path's perf snapshot (scripts/bless_perf_snapshot.cjs).
 *
 * The `rebless` job measures the full corpus with
 * `ifc_regression_batch_main --perf`, whose 16-column perf.csv is a different
 * file from the 22-column `performance-detail.csv` the committed benchmark
 * snapshots use. This pins the mapping between them — the shape a delta and
 * GitHub's CSV viewer both depend on — and the choice of predecessor to diff
 * against.
 */
const require_ = createRequire(import.meta.url)

// Resolved from the repo root: the test runs from compiled/src/scripts, and
// scripts/ is not part of the tsc build. Jest's rootDir is the repo root.
const {
  DETAIL_COLUMNS, findPreviousSnapshot, isChronologicalDelta, removeStaleDeltas,
  renderReadme, writeDetailCsv, versionCompare,
} =
  require_(path.resolve(process.cwd(), 'scripts/bless_perf_snapshot.cjs')) as {
    DETAIL_COLUMNS: string[],
    isChronologicalDelta: (name: string, version: string) => boolean,
    renderReadme: (info: {
      engine: string,
      repoName: string,
      modelCount: number,
      retentionCount: number,
      deltaName: string,
      previousName: string,
    }) => string,
    removeStaleDeltas: (outDir: string, version: string) => string[],
    findPreviousSnapshot: (dir: string, self: string, version: string) =>
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

  test('maps perf.csv onto the 22-column convention, N/A for unmeasured', () => {
    const out = path.join(workDir, 'performance-detail.csv')

    writeDetailCsv(
      [{
        file: 'Snowdon Towers Sample Architectural_IFC4.ifc',
        status: 'OK',
        parseTimeMs: '1200',
        geometryTimeMs: '5400',
        totalTimeMs: '6600',
        geometryMemoryMb: '185.84',
        peakWasmHeapMb: '1283.00',
        rssMb: '812.50',
        peakRssMb: '905.75',
        heapUsedMb: '410.25',
        heapTotalMb: '450.00',
        externalMb: '96.40',
        arrayBuffersMb: '94.10',
        retainedRssMb: '132.75',
        retainedHeapUsedMb: '41.50',
        retainedExternalMb: '-2.25',
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

    // The columns #552 added to the conway-native writer. geometryMemoryMb is
    // what regressed: the writer stopped emitting it, and this mapping
    // hardcoded N/A over it, so it read 0/107 on the 1.549 snapshot against
    // 98/100 on 1.451. peakRssMb is the load's high-water mark, next to the
    // end-of-load instant in rssMb; externalMb and its arrayBuffersMb subset
    // are the off-heap bytes heapUsedMb cannot see; peakWasmHeapMb is the
    // wasm linear memory, which none of the JS-side columns can see and which
    // is a far larger number than the geometryMemoryMb payload beside it.
    expect(cell('geometryMemoryMb')).toBe('185.84')
    expect(cell('peakWasmHeapMb')).toBe('1283.00')
    // The #554 retention columns. Signed, and the negative one is the point:
    // a cycle can end below its baseline, and clamping that to 0 would hide
    // the direction a fix moves the number in.
    expect(cell('retainedRssMb')).toBe('132.75')
    expect(cell('retainedHeapUsedMb')).toBe('41.50')
    expect(cell('retainedExternalMb')).toBe('-2.25')
    expect(cell('peakRssMb')).toBe('905.75')
    expect(cell('externalMb')).toBe('96.40')
    expect(cell('arrayBuffersMb')).toBe('94.10')

    // The committed snapshots URL-encode the filename and the delta joins on
    // it, so an unencoded name would simply fail to match the baseline row.
    expect(cell('filename'))
        .toBe('Snowdon%20Towers%20Sample%20Architectural_IFC4.ifc')

    // perf.csv does not carry these; they stay as placeholders rather than
    // being dropped, so the row keeps its 16-column shape.
    for (const column of
      ['schemaVersion', 'preprocessorVersion', 'originatingSystem']) {
      expect(cell(column)).toBe('N/A')
    }
  })

  test('writes N/A for a perf.csv that predates the memory columns', () => {
    // A perf.csv artifact written before #552 has none of geometryMemoryMb,
    // peakWasmHeapMb, peakRssMb, externalMb or arrayBuffersMb, and one
    // written before #554 has none of the retention columns either — as does
    // any run whose children had no --expose-gc to settle with. The mapping
    // must degrade to N/A rather than emitting 'undefined' into a column a
    // delta then reads as a measurement.
    const out = path.join(workDir, 'legacy.csv')

    writeDetailCsv(
      [{
        file: 'old.ifc', status: 'OK', parseTimeMs: '1200',
        geometryTimeMs: '5400', totalTimeMs: '6600', rssMb: '812.50',
        heapUsedMb: '410.25', heapTotalMb: '450.00',
      }],
      out, 'conway1.543.1513-ci', '20260821221710')

    const row = parseCsv(fs.readFileSync(out, 'utf8'))[1]
    expect(row).toHaveLength(DETAIL_COLUMNS.length)
    expect(row[DETAIL_COLUMNS.indexOf('geometryMemoryMb')]).toBe('N/A')
    expect(row[DETAIL_COLUMNS.indexOf('peakWasmHeapMb')]).toBe('N/A')
    expect(row[DETAIL_COLUMNS.indexOf('peakRssMb')]).toBe('N/A')
    expect(row[DETAIL_COLUMNS.indexOf('externalMb')]).toBe('N/A')
    expect(row[DETAIL_COLUMNS.indexOf('arrayBuffersMb')]).toBe('N/A')
    expect(row[DETAIL_COLUMNS.indexOf('retainedRssMb')]).toBe('N/A')
    expect(row[DETAIL_COLUMNS.indexOf('retainedHeapUsedMb')]).toBe('N/A')
    expect(row[DETAIL_COLUMNS.indexOf('retainedExternalMb')]).toBe('N/A')
    // The columns it does carry are unaffected.
    expect(row[DETAIL_COLUMNS.indexOf('rssMb')]).toBe('812.50')
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
      findPreviousSnapshot(
        benchmarks, 'conway1.543.1513-ci_test-models', '1.543.1513')

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
      findPreviousSnapshot(
        benchmarks, 'conway1.543.1513-ci_test-models', '1.543.1513')

    expect(previous!.name).toBe('conway1.451.1357-ci_test-models')
  })

  test('ignores webifc dirs and dirs with no performance-detail.csv', () => {
    const benchmarks = makeBenchmarks(
      ['conway0.23.940_test-models'],
      ['webifc0.0.67_test-models', 'conway9.9.9-ci_test-models'])

    const previous =
      findPreviousSnapshot(
        benchmarks, 'conway1.543.1513-ci_test-models', '1.543.1513')

    expect(previous!.name).toBe('conway0.23.940_test-models')
  })

  test('never selects a snapshot NEWER than the version being blessed', () => {
    // Re-running an older rc- tag after a newer release has been blessed. An
    // unbounded maximum picks conway1.600.1600-ci and writes
    // `conway1.600.1600-ci_1.543.1513_delta.csv` into the OLDER release's
    // directory — a delta claiming it changed relative to its own future.
    const benchmarks = makeBenchmarks([
      'conway1.451.1357-ci_test-models',
      'conway1.543.1513-ci_test-models',
      'conway1.600.1600-ci_test-models',
    ])

    const previous = findPreviousSnapshot(
      benchmarks, 'conway1.543.1513-ci_test-models', '1.543.1513')

    expect(previous!.name).toBe('conway1.451.1357-ci_test-models')
  })

  test('bounds strictly below, so an equal version is not a predecessor', () => {
    // The same release under a different directory name (a different harness,
    // say) is not its own predecessor.
    const benchmarks = makeBenchmarks([
      'conway1.543.1513_test-models',
      'conway1.543.1513-ci_test-models',
    ])

    const previous = findPreviousSnapshot(
      benchmarks, 'conway1.543.1513-ci_test-models', '1.543.1513')

    expect(previous).toBeNull()
  })

  test('returns null rather than reaching upward when nothing precedes', () => {
    // The first blessed release in a repo. No delta is the correct outcome;
    // silently picking the nearest snapshot in either direction is not.
    const benchmarks = makeBenchmarks(['conway1.600.1600-ci_test-models'])

    expect(findPreviousSnapshot(
      benchmarks, 'conway1.451.1357-ci_test-models', '1.451.1357')).toBeNull()
  })

  test('bounds numerically, not lexicographically', () => {
    // Both of these directories really exist in test-models/benchmarks, and
    // they are conway#533's trap: 0.23.940 is NEWER than 0.9.789 by number but
    // sorts BELOW it as a string ('2' < '9' at the third character). A string
    // bound therefore fails to exclude it, and since it is the numeric maximum
    // it gets picked — handing the older release a delta against its future,
    // which is the whole bug this bound exists to stop.
    const benchmarks = makeBenchmarks([
      'conway0.8.782_test-models',
      'conway0.23.940_test-models',
    ])

    const previous = findPreviousSnapshot(
      benchmarks, 'conway0.9.789_test-models', '0.9.789')

    expect(previous!.name).toBe('conway0.8.782_test-models')
  })

  test('returns null when there is no prior snapshot', () => {
    expect(findPreviousSnapshot(path.join(workDir, 'nope'), 'x', '1.0.0'))
        .toBeNull()
    expect(findPreviousSnapshot(makeBenchmarks([]), 'x', '1.0.0')).toBeNull()
  })
})

describe('versionCompare', () => {

  test('orders by numeric component, not string order', () => {
    expect(versionCompare('0.9.789', '0.23.940')).toBeLessThan(0)
    expect(versionCompare('1.543.1513', '1.451.1357')).toBeGreaterThan(0)
    expect(versionCompare('1.0.0', '1.0.0')).toBe(0)
  })
})

describe('removeStaleDeltas', () => {

  /** Everything a real release snapshot directory holds today. */
  const RELEASE_DIR_CONTENTS = [
    '00-command.log.txt',
    '00-rendering-server.log.txt',
    'README.md',
    'conway0.22.921_0.23.940_delta.csv',
    'index.html',
    'performance-detail.csv',
    'performance.csv',
    'performance.err.txt',
    'webifc0.0.56_conway0.23.940_delta.csv',
    'webifc0.0.67_conway0.23.940_delta.csv',
  ]

  /**
   * Populate a snapshot directory with the given entry names.
   *
   * @param names File names to create.
   * @return The directory path.
   */
  function makeReleaseDir(names: string[]): string {
    const dir = path.join(workDir, 'conway0.23.940_test-models')
    fs.mkdirSync(dir, { recursive: true })
    for (const name of names) {
      fs.writeFileSync(path.join(dir, name), 'x')
    }
    return dir
  }

  test('removes only this release chronological delta', () => {
    // The exact contents of benchmarks/conway0.23.940_test-models/, which
    // legitimately carries one chronological delta AND two cross-engine ones.
    const dir = makeReleaseDir(RELEASE_DIR_CONTENTS)

    const removed = removeStaleDeltas(dir, '0.23.940')

    expect(removed).toEqual(['conway0.22.921_0.23.940_delta.csv'])
    expect(fs.readdirSync(dir).sort()).toEqual(
      RELEASE_DIR_CONTENTS
          .filter((n) => n !== 'conway0.22.921_0.23.940_delta.csv').sort())
  })

  test('leaves the cross-engine deltas alone — they are a different comparison', () => {
    const dir = makeReleaseDir(RELEASE_DIR_CONTENTS)

    removeStaleDeltas(dir, '0.23.940')

    expect(fs.existsSync(path.join(dir, 'webifc0.0.56_conway0.23.940_delta.csv')))
        .toBe(true)
    expect(fs.existsSync(path.join(dir, 'webifc0.0.67_conway0.23.940_delta.csv')))
        .toBe(true)
  })

  test('never touches the data files or the README', () => {
    const dir = makeReleaseDir(RELEASE_DIR_CONTENTS)

    removeStaleDeltas(dir, '0.23.940')

    for (const kept of ['performance-detail.csv', 'performance.csv',
      'performance.err.txt', 'README.md', 'index.html',
      '00-command.log.txt', '00-rendering-server.log.txt']) {
      expect(fs.existsSync(path.join(dir, kept))).toBe(true)
    }
  })

  test('clears a delta whose predecessor changed, so only one survives', () => {
    // The case codex found: an already-blessed rc re-run after an older
    // snapshot was backfilled picks a different predecessor and writes a
    // differently NAMED file, leaving two deltas against different
    // predecessors in one directory with the README naming only one.
    const dir = makeReleaseDir([
      'performance-detail.csv',
      'conway0.21.915_0.23.940_delta.csv',
    ])

    const removed = removeStaleDeltas(dir, '0.23.940')

    expect(removed).toEqual(['conway0.21.915_0.23.940_delta.csv'])
    expect(fs.readdirSync(dir)).toEqual(['performance-detail.csv'])
  })

  test('does not remove another release delta that happens to be present', () => {
    const dir = makeReleaseDir([
      'performance-detail.csv',
      'conway0.22.921_0.23.940_delta.csv',
    ])

    expect(removeStaleDeltas(dir, '1.543.1513')).toEqual([])
    expect(fs.existsSync(path.join(dir, 'conway0.22.921_0.23.940_delta.csv')))
        .toBe(true)
  })
})

describe('isChronologicalDelta', () => {

  test('matches the naming convention and nothing else', () => {
    expect(isChronologicalDelta('conway0.22.921_0.23.940_delta.csv', '0.23.940'))
        .toBe(true)
    expect(isChronologicalDelta(
      'conway1.451.1357-ci_1.543.1513_delta.csv', '1.543.1513')).toBe(true)

    // Cross-engine: starts with webifc, so never matched.
    expect(isChronologicalDelta(
      'webifc0.0.67_conway0.23.940_delta.csv', '0.23.940')).toBe(false)
    // Wrong release.
    expect(isChronologicalDelta(
      'conway0.22.921_0.23.940_delta.csv', '1.543.1513')).toBe(false)
    // Not a delta at all.
    for (const name of ['performance-detail.csv', 'performance.csv',
      'README.md', 'index.html', '00-command.log.txt']) {
      expect(isChronologicalDelta(name, '0.23.940')).toBe(false)
    }
  })
})

describe('renderReadme', () => {

  const info = {
    engine: 'conway1.560.1600-ci',
    repoName: 'test-models',
    modelCount: 97,
    retentionCount: 97,
    deltaName: 'conway1.451.1357-ci_1.560.1600_delta.csv',
    previousName: 'conway1.451.1357-ci_test-models',
  }

  test('does not repeat the pre-#553 claim that geometryMemoryMb is N/A', () => {
    // #553 restored geometryMemoryMb on the conway-native writer (SKYLARK250
    // reads 185.22 against the 185.836 recorded at 1.451). The README shipped
    // beside the 1.549 snapshot still says it is unmeasured, which is now the
    // opposite of the truth for a column carrying real data; that text was
    // removed from this template, and this keeps it out.
    const text = renderReadme(info)

    expect(text).not.toContain('`geometryMemoryMb` is absent here')
    expect(text).toContain(
      '`schemaVersion`,\n`preprocessorVersion` and `originatingSystem` are `N/A`')
    // The N/A-is-not-a-zero framing is the point of #548 and must survive for
    // the columns genuinely absent from an older snapshot.
    expect(text).toContain('That is a missing\nmeasurement, not a zero')
  })

  test('says on its own face whether the settle ran', () => {
    // A directory of N/A retention must explain itself without anyone having
    // to find the workflow that produced it.
    expect(renderReadme(info)).toContain('Retention is measured on 97 of 97')
    expect(renderReadme({ ...info, retentionCount: 0 }))
      .toContain('Retention is `N/A` on every row here')
  })

  test('names the blessed pass as the one this snapshot came from', () => {
    const text = renderReadme(info)

    expect(text).toContain('CONWAY_PERF_EXPOSE_GC=0')
    expect(text).toContain('The control pass is never blessed')
  })

  test('the N/A inventory covers the retention columns, not just FAIL rows', () => {
    // A settle-less snapshot used to assert both 'Every other column is
    // measured - with the exception of a row whose loadStatus is not OK' and
    // 'Retention is `N/A` on every row here', four paragraphs apart in one
    // file. The retention columns read N/A on an OK row whenever the run had
    // no --expose-gc, which is exactly the run this branch describes.
    const text = renderReadme({ ...info, retentionCount: 0 })

    expect(text).toContain('Retention is `N/A` on every row here')
    expect(text).not.toContain('Every other column is measured — with the')
    expect(text).toContain('the three retention columns carry `N/A`')
    expect(text).toContain('on an `OK` row as\nmuch as a failed one')
  })

  test('attributes the geometryMemoryMb split to the writers #555 measured', () => {
    // #555 measured 16.8 vs 22.3 MB between `ifc_command_line_main` and the
    // IFC regression child - two IFC pipelines. MB-Khaya never reaches the
    // AP214 child, so pinning that figure to the IFC-row-vs-STEP-row split
    // this file mixes would cite evidence for a claim it does not support.
    const text = renderReadme(info)

    expect(text).toContain('The IFC **CLI** and the IFC\nregression child read 16.8 vs 22.3 MB')
    expect(text).toContain('has not been measured to disagree')
  })

  test('describes the second-engine term as closed by #557, not as current', () => {
    // conway#557 landed: both regression children now extract on the engine
    // main() initialised. A README still saying an IFC row carries ~100 MB of
    // second engine would be describing a world that no longer exists - and
    // the boundary that DOES matter now is that pre-#557 snapshots carry the
    // constant and this one does not.
    const text = renderReadme(info)

    expect(text).toContain('carried a second, unrelated split until conway#557')
    expect(text).toContain('~55-60 MB constant on every IFC row')
    expect(text).not.toContain('roughly 100 MB')
    expect(text).toContain('A snapshot blessed\nbefore conway#557')
  })

  test('warns off the misreadings the columns invite', () => {
    const text = renderReadme(info)

    // Retention is live model + leak, not leak.
    expect(text).toContain('still-live model plus anything genuinely leaked')
    // The two columns that are pipeline-scoped, with their issues.
    expect(text).toContain('conway/issues/555')
    expect(text).toContain('conway/issues/557')
    // The third native quantity, and the arrayBuffers/external subset rule.
    expect(text).toContain('getAllocationSize')
    expect(text).toContain('ArrayBuffer subset')
    // Cross-run timing carries the runner scale factor.
    expect(text).toContain('median 1.55x')
  })

  test('names the delta and its predecessor, or says there is none', () => {
    expect(renderReadme(info)).toContain(
      '`conway1.451.1357-ci_1.560.1600_delta.csv` diffs this run against ' +
      '`../conway1.451.1357-ci_test-models/`.')
    expect(renderReadme({ ...info, deltaName: '', previousName: '' }))
      .toContain('no delta was produced')
  })
})
