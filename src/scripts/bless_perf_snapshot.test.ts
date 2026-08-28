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
  AA_NULL_CORPUS, AA_NULL_CORPUS_SHA,
  DETAIL_COLUMNS, collectCorpusModels, corpusCommit, coverageSkipReason,
  findPreviousSnapshot,
  isChronologicalDelta,
  pairedCoverage, removeStaleDeltas, removeStalePairedDetail, parsePairedFlags,
  renderReadme, writeDetailCsv, versionCompare,
} =
  require_(path.resolve(process.cwd(), 'scripts/bless_perf_snapshot.cjs')) as {
    AA_NULL_CORPUS: string,
    AA_NULL_CORPUS_SHA: string,
    DETAIL_COLUMNS: string[],
    collectCorpusModels: (rootDir: string, exclude?: RegExp) => string[],
    corpusCommit: (modelsRoot: string) => string,
    coverageSkipReason: (
      coverage: { expected: string[], missing: string[] }) => string,
    pairedCoverage: (
      corpusModels: string[],
      blessedRows: Record<string, string>[],
      pairedRows: Record<string, string>[],
      smokeListPath: string) =>
      { expected: string[], missing: string[], listError: string,
        unmatched: string[], collisions: string[] },
    isChronologicalDelta: (name: string, version: string) => boolean,
    renderReadme: (info: {
      engine: string,
      repoName: string,
      corpusSha?: string,
      modelCount: number,
      retentionCount: number,
      deltaName: string,
      previousName: string,
      pairedDeltaName?: string,
      pairedDetailName?: string,
      pairedEngine?: string,
      pairedScope?: string,
      pairedSkipReason?: string,
    }) => string,
    removeStaleDeltas: (outDir: string, version: string) => string[],
    removeStalePairedDetail: (outDir: string) => string[],
    parsePairedFlags: (argv: string[]) =>
      { csv: string, engine: string, scope: string, expected: string,
        corpusExclude: string },
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

  test('keeps a predecessor below a post-conway#533 suffixed version', () => {
    // The single input where the version_order fix bites for the bless path.
    // `version` comes off the rc-* tag, so since conway#533 it carries a
    // `-g<shorthash>`. The old comparator read `546-g3eae7637` as 0 via its
    // `|| 0` guard, so the blessed version compared as 1.1556.0 and this
    // legitimate predecessor failed the "strictly below" bound and was
    // silently discarded.
    const benchmarks = makeBenchmarks([
      'conway1.1556.100_test-models',
    ])

    const previous =
      findPreviousSnapshot(
        benchmarks,
        'conway1.1556.546-g3eae7637-ci_test-models',
        '1.1556.546-g3eae7637')

    expect(previous).not.toBeNull()
    expect(previous!.name).toBe('conway1.1556.100_test-models')
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

  test('matches the paired sibling, since it is predecessor-named too', () => {
    // The paired delta carries its predecessor in its name for the same
    // reason the cross-run one does, so it goes stale the same way: a re-run
    // that selects a different predecessor writes a differently NAMED file
    // and the old one survives the workflow's whole-directory staging. Two
    // authoritative-looking paired deltas against different predecessors, in
    // one release directory, with the README naming only one.
    expect(isChronologicalDelta(
      'conway1.451.1357-ci_1.543.1513_paired_delta.csv', '1.543.1513'))
        .toBe(true)
    // Still bounded to THIS release.
    expect(isChronologicalDelta(
      'conway1.451.1357-ci_1.543.1513_paired_delta.csv', '1.451.1357'))
        .toBe(false)
    // And the webifc exclusion is not weakened by the optional group.
    expect(isChronologicalDelta(
      'webifc0.0.67_conway0.23.940_paired_delta.csv', '0.23.940')).toBe(false)
    // The paired DETAIL file is not a delta and must not be swept by the
    // delta cleanup — removeStalePairedDetail owns it.
    expect(isChronologicalDelta(
      'performance-detail-paired-conway1.451.1357-paired.csv', '1.543.1513'))
        .toBe(false)
  })
})

describe('removeStalePairedDetail', () => {

  test('removes every paired detail file and nothing else', () => {
    // Named for the predecessor, which is not fixed for a release, so the
    // whole family is swept rather than one expected name.
    const keep = ['performance-detail.csv', 'README.md',
      'conway1.451.1357-ci_1.543.1513_delta.csv',
      'conway1.451.1357-ci_1.543.1513_paired_delta.csv']
    const drop = ['performance-detail-paired-conway1.451.1357-paired.csv',
      'performance-detail-paired-conway1.300.900-paired.csv']

    for (const name of [...keep, ...drop]) {
      fs.writeFileSync(path.join(workDir, name), 'x', 'utf8')
    }

    expect(removeStalePairedDetail(workDir).sort()).toEqual(drop.sort())
    expect(fs.readdirSync(workDir).sort()).toEqual(keep.sort())
  })
})

describe('parsePairedFlags', () => {

  test('reads the five flags, and defaults scope to full', () => {
    expect(parsePairedFlags([
      'node', 'bless', 'perf.csv', 'models', '1.5.0', 'test-models',
      '--paired', '/tmp/perf-paired.csv',
      '--paired-engine', 'conway1.4.0-paired',
      '--paired-scope', 'smoke',
      '--paired-expected', 'regression/smoke_models.txt',
      '--corpus-exclude', 'sp-.*\\.ifc',
    ])).toEqual({
      csv: '/tmp/perf-paired.csv',
      engine: 'conway1.4.0-paired',
      scope: 'smoke',
      expected: 'regression/smoke_models.txt',
      corpusExclude: 'sp-.*\\.ifc',
    })

    expect(parsePairedFlags(['node', 'bless', 'perf.csv', 'models']))
        .toEqual({
          csv: '', engine: '', scope: 'full', expected: '', corpusExclude: '',
        })
  })

  test('a trailing flag with no value reads as absent', () => {
    // Otherwise `undefined` reaches fs.existsSync and the paired branch is
    // entered on a run that supplied nothing.
    expect(parsePairedFlags(['node', 'bless', '--paired']).csv).toBe('')
  })
})

describe('collectCorpusModels', () => {

  test('walks like the batch does: recursive, extension-keyed, regex-pruned', () => {
    // Mirrors collectIFCFiles() in ifc_regression_batch_main.ts, and the
    // mirroring is the point — this is where the paired gate's demand comes
    // from, so it has to see the tree the passes saw.
    for (const rel of [
      'ifc/index.ifc', 'ifc/bldrs/index.ifc', 'step/part.STP',
      'step/other.step', 'ifc/sp-concat.ifc', 'notes/README.md',
      'skipme/hidden.ifc',
    ]) {
      fs.mkdirSync(path.join(workDir, path.dirname(rel)), { recursive: true })
      fs.writeFileSync(path.join(workDir, rel), 'x', 'utf8')
    }

    const found = collectCorpusModels(workDir, /sp-.*\.ifc|skipme/)
        .map((p) => path.relative(workDir, p).split(path.sep).join('/'))

    // .md is not a model; sp-*.ifc is excluded by name; `skipme` is excluded
    // as a DIRECTORY, because the regex is tested before the dir/file split.
    expect(found.sort()).toEqual([
      'ifc/bldrs/index.ifc', 'ifc/index.ifc', 'step/other.step', 'step/part.STP',
    ])
  })
})

describe('pairedCoverage', () => {

  /**
   * perf.csv rows, reduced to the only column coverage looks at.
   *
   * @param names Model basenames as the regression child wrote them.
   * @return Row objects.
   */
  function rows(names: string[]): Record<string, string>[] {
    return names.map((file) => ({ file, status: 'OK' }))
  }

  /**
   * A corpus walk's output, one model per named directory so no two collide.
   *
   * @param names Model basenames.
   * @return Paths as collectCorpusModels would return them.
   */
  function corpus(names: string[]): string[] {
    return names.map((name, i) => `models/d${i}/${name}`)
  }

  test('reports the models the paired pass did not measure', () => {
    const coverage = pairedCoverage(
      corpus(['index.ifc', 'duplex.ifc', 'MB-Khaya.ifc']),
      rows(['index.ifc', 'duplex.ifc', 'MB-Khaya.ifc']),
      rows(['index.ifc']), '')

    expect(coverage.missing).toEqual(['MB-Khaya.ifc', 'duplex.ifc'])
    expect(coverage.expected).toHaveLength(3)
  })

  test('compares sets, so two failures cannot cancel to the right count', () => {
    // The reason this is not `pairedRows.length === blessedRows.length`: a
    // pass that lost one model and picked up another has the count of a
    // complete one, and only the difference names what went missing.
    const coverage = pairedCoverage(
      corpus(['index.ifc', 'duplex.ifc']),
      rows(['index.ifc', 'duplex.ifc']),
      rows(['index.ifc', 'stray.ifc']), '')

    expect(coverage.missing).toEqual(['duplex.ifc'])
  })

  test('a model BOTH passes lost is still demanded', () => {
    // THE CORRELATED-LOSS HOLE. The first version of this check read the
    // demand off the blessed pass's rows, so a model whose child died in both
    // passes dropped out of the demand at the same time it dropped out of the
    // measurement, `missing` came back empty, and a paired median over a
    // quietly smaller corpus was published as the release gate. The corpus
    // walk is the one input here that neither pass produced.
    const coverage = pairedCoverage(
      corpus(['index.ifc', 'duplex.ifc']),
      rows(['index.ifc']),
      rows(['index.ifc']), '')

    expect(coverage.missing).toEqual(['duplex.ifc'])
  })

  test('a model only the paired pass measured is not covered either', () => {
    // Coverage is of the paired DELTA, and generateDeltaCSV drops one-sided
    // rows under MEASUREMENT_BASIS.PAIRED — so a model the blessed pass lost
    // contributes nothing to the file this check is guarding, however well
    // the paired pass timed it.
    const coverage = pairedCoverage(
      corpus(['index.ifc', 'duplex.ifc']),
      rows(['index.ifc']),
      rows(['index.ifc', 'duplex.ifc']), '')

    expect(coverage.missing).toEqual(['duplex.ifc'])
  })

  test('a smoke list narrows the demand to that list', () => {
    // `smoke` scope: the paired pass covers regression/smoke_models.txt, so
    // demanding the whole corpus would degrade every smoke run.
    const listPath = path.join(workDir, 'smoke.txt')

    fs.writeFileSync(listPath, '# header\n\nindex.ifc\n', 'utf8')

    const coverage = pairedCoverage(
      corpus(['index.ifc', 'duplex.ifc']),
      rows(['index.ifc', 'duplex.ifc']), rows(['index.ifc']), listPath)

    expect(coverage.expected).toEqual(['index.ifc'])
    expect(coverage.missing).toEqual([])
  })

  test('a smoke entry no corpus file matches is reported, not dropped', () => {
    // Filtering it away would shrink the gate to whatever happened to match,
    // silently — the same failure mode the whole check exists to prevent. A
    // list naming models that are not there is a misconfiguration.
    const listPath = path.join(workDir, 'smoke.txt')

    fs.writeFileSync(listPath, 'index.ifc\nnot-in-corpus.ifc\n', 'utf8')

    const coverage = pairedCoverage(
      corpus(['index.ifc']), rows(['index.ifc']), rows(['index.ifc']), listPath)

    expect(coverage.unmatched).toEqual(['not-in-corpus.ifc'])
  })

  test('a smoke list matching nothing leaves an empty demand', () => {
    // `missing` is necessarily empty when nothing is expected, so any paired
    // CSV at all would pass a check that only looked at `missing`.
    const listPath = path.join(workDir, 'smoke.txt')

    fs.writeFileSync(listPath, 'renamed.ifc\n', 'utf8')

    const coverage = pairedCoverage(
      corpus(['index.ifc']), rows(['index.ifc']), rows(['index.ifc']), listPath)

    expect(coverage.expected).toEqual([])
    expect(coverage.missing).toEqual([])
    expect(coverage.unmatched).toEqual(['renamed.ifc'])
  })

  test('two corpus files writing one basename are reported (conway#633)', () => {
    // `ifc/index.ifc` and `ifc/bldrs/index.ifc` are a live pair. They write
    // the same `index.perf.csv`, so one row is lost, and a check keyed on
    // basename cannot see it go.
    const coverage = pairedCoverage(
      ['models/ifc/index.ifc', 'models/ifc/bldrs/index.ifc',
        'models/ifc/duplex.ifc'],
      rows(['index.ifc', 'duplex.ifc']),
      rows(['index.ifc', 'duplex.ifc']), '')

    expect(coverage.collisions).toEqual(['index.ifc'])
    // And nothing looks wrong without that field: the collapsed pair reads as
    // full coverage, which is exactly why the caller has to consult it.
    expect(coverage.missing).toEqual([])
  })

  test('an unreadable list is reported rather than silently ignored', () => {
    const coverage = pairedCoverage(
      corpus(['index.ifc']), rows(['index.ifc']), rows(['index.ifc']),
      path.join(workDir, 'nope.txt'))

    expect(coverage.listError).toContain('nope.txt')
  })
})

describe('coverageSkipReason', () => {

  test('names the missing models, and elides a flood of them', () => {
    const missing = Array.from({ length: 12 }, (_, i) => `m${i}.ifc`)
    const reason = coverageSkipReason({
      expected: Array.from({ length: 40 }, (_, i) => `m${i}.ifc`), missing })

    expect(reason).toContain('covers 28 of the 40 models')
    expect(reason).toContain('m0.ifc')
    expect(reason).toContain('and 2 more')
    expect(reason).not.toContain('m11.ifc')
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
    expect(text).toContain('has not been measured on a shared model')

    // The mechanism, not just the size of the gap: a reader who knows it is
    // the memoization capture mode can tell which of their own two numbers
    // is which, and knows the divergence is deliberate rather than a bug
    // awaiting a fix.
    expect(text).toContain('RegressionCaptureState.memoization')
    expect(text).toContain('deleteTemporaries')

    // And that the file now discloses it per row rather than in prose only.
    expect(text).toContain('`writer` column')
  })

  test('says totalTimeMs is a wall clock, and that it moved once', () => {
    // conway#562: the column was parse+geometry by construction on these
    // children while meaning a real wall clock on the loader path. A README
    // that did not flag the step change would have every reader of the next
    // delta hunting a regression that is a redefinition.
    const text = renderReadme(info)

    expect(text).toContain('`totalTimeMs` is the load\'s wall clock')
    expect(text).toContain('steps up once at this boundary')
    expect(text).toContain('parsePlusGeometryMs')
    expect(text).toContain('conway/issues/562')
    // And that neither column is the number a user feels.
    expect(text).toContain('Neither column is time-to-first-mesh')
  })

  test('does not tell a reader the loader writes the same total', () => {
    // The README shipped one revision claiming loader and regression totals
    // mean the same thing and pointing at `parsePlusGeometryMs` for
    // continuity with older snapshots. Both halves became false: the two
    // harnesses bound their windows differently (engine init inside one and
    // outside the other), and historical loader snapshots carry no
    // `parsePlusGeometryMs` column to read. Guidance that is impossible to
    // follow is worse than none, because a reader assumes the fault is
    // theirs.
    const text = renderReadme(info)

    expect(text).toContain('Do not read that as "the loader writes the same thing"')
    expect(text).toContain('the loader emits no such column at all')

    // The rule the code actually enforces, stated as a rule.
    expect(text).toContain('withholds EVERY measurement column when the two')
    expect(text).toContain('identity, not data')

    // And the marker that distinguishes the three kinds of blank cell.
    expect(text).toContain('`comparability`')
    expect(text).toContain('crossHarness')

    // The structural follow-up, so a reader who thinks "why is this one
    // file mixing harnesses at all" finds it already asked.
    expect(text).toContain('conway/issues/572')
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

  // The directory ships TWO conway-to-conway deltas with identical column
  // layouts, differing only in how `engine1` was obtained. A reader who
  // cannot tell them apart reads a 13.66%-noise-floor row as a regression,
  // which is the exact failure the pairing work exists to end. So the README
  // has to separate them ITSELF, before any column definition.
  const paired = {
    ...info,
    pairedDeltaName: 'conway1.451.1357-ci_1.560.1600_paired_delta.csv',
    pairedDetailName: 'performance-detail-paired-conway1.451.1357-paired.csv',
    pairedEngine: 'conway1.451.1357-paired',
    pairedScope: 'full',
  }

  test('says which delta is the gate and which is only continuity', () => {
    const text = renderReadme(paired)

    expect(text).toContain('This directory holds **two** conway-to-conway deltas')
    expect(text).toContain('conway1.451.1357-ci_1.560.1600_paired_delta.csv')
    expect(text).toContain('**the gate.**')
    expect(text).toContain('continuity with the historical archive **only**')

    // The measured numbers, not an adjective. A reader who is about to act
    // on a cross-run row needs the size of the floor and the size of the
    // signal in the same sentence.
    expect(text).toContain('13.66% median')
    expect(text).toContain('9.40% median')
    expect(text).toContain('measurementBasis')

    // Where the evidence lives.
    expect(text).toContain('perf-run-comparability.md')

    // And the archived rows, so the paired engine1 numbers outlive the
    // 90-day artifact.
    expect(text).toContain(
      'performance-detail-paired-conway1.451.1357-paired.csv')
  })

  test('scopes the A/A floor to the corpus it was measured on', () => {
    // `perf-aa-null.yml` hardcodes `bldrs-ai/test-models`, and this README is
    // generated for whichever matrix target ran. On the private target — the
    // corpus that actually gates a release — the unqualified text stamped a
    // public-corpus measurement onto a snapshot nobody had measured, over a
    // corpus with a different model count and cost profile that, unlike the
    // public one, is not guaranteed to fit the page cache the no-cold-start
    // result rests on.
    const publicReadme = renderReadme(paired)
    const privateReadme =
      renderReadme({ ...paired, repoName: 'test-models-private' })

    // The measurement names its own corpus in both, so the number is never
    // separable from where it came from.
    for (const text of [publicReadme, privateReadme]) {
      expect(text).toContain('measured on the public corpus')
      expect(text).toContain('over 97 of the 99 models the batch')
    }

    expect(publicReadme).toContain('**This snapshot is that corpus')
    expect(publicReadme).not.toContain('is NOT the corpus that was')

    expect(privateReadme).toContain(
      '`test-models-private`, which is NOT the corpus that was')
    expect(privateReadme).toContain('not a measured bound on this file')
    expect(privateReadme).toContain('would cost to measure this corpus')
  })

  test('does not claim the same models off a matching corpus name', () => {
    // The floor is a property of a MODEL SET. `perf-aa-null.yml` pinned its
    // checkout to the commit it measured; `rc-regression.yml` checks the
    // matrix target out with no `ref:` at all, so it gets whatever the
    // default branch holds at release time and nothing compares the two. The
    // public branch used to assert "Same models" purely because the
    // directory name matched, which is the one place in this README that
    // asserts a bound rather than disclaiming one.
    const measured = renderReadme({ ...paired, corpusSha: AA_NULL_CORPUS_SHA })
    const moved = renderReadme({ ...paired, corpusSha: 'deadbeef' })
    const unknown = renderReadme({ ...paired, corpusSha: '' })

    // Only a commit that matches the measured one earns the strong claim.
    expect(measured).toContain('at the very commit the floor was')
    expect(measured).toContain('Same models')
    expect(measured).toContain(`\`${AA_NULL_CORPUS_SHA}\``)

    // Everything else names both commits and stops short of "same models".
    for (const text of [moved, unknown]) {
      expect(text).not.toContain('Same models')
      expect(text).toContain('What is NOT established is that it is the same')
      expect(text).toContain('with no pinned `ref:`')
      expect(text).toContain('to the\nextent the corpus has not moved under it')
    }

    expect(moved).toContain('blessed at `deadbeef`')
    expect(unknown).toContain('blessed at an unrecorded commit')

    // A corpus SHA is never a reason to soften the PRIVATE branch, which
    // already disclaims the floor outright.
    expect(renderReadme({
      ...paired, repoName: 'test-models-private',
      corpusSha: AA_NULL_CORPUS_SHA,
    })).toContain('is NOT the corpus that was')
  })

  test('reads the corpus commit off the checkout, or reports none', () => {
    // A models root that is not a git checkout is the normal case outside
    // CI, and it must degrade to "unrecorded" rather than failing a bless.
    expect(corpusCommit(path.join(workDir, 'not-a-checkout'))).toBe('')
    expect(corpusCommit(process.cwd()))
      .toMatch(new RegExp(`^[0-9a-f]{${AA_NULL_CORPUS_SHA.length}}$`))
  })

  test('states a narrowed scope rather than letting it pass silently', () => {
    const full = renderReadme(paired)
    const smoke = renderReadme({ ...paired, pairedScope: 'smoke' })

    expect(full).toContain('covered the **full corpus**')
    expect(full).not.toContain('Scope: the smoke subset only')

    expect(smoke).toContain('**Scope: the smoke subset only.**')
    expect(smoke).toContain('`crossRun` row and no `paired` row')
    expect(smoke).not.toContain('covered the **full corpus**')
  })

  test('distinguishes a discarded paired pass from one that never ran', () => {
    // Both leave a directory with one delta in it. Only the README can tell a
    // reader months later which of the two happened, and a withheld gate is
    // the one worth knowing about — it says the paired pass ran and could not
    // be trusted.
    const discarded = renderReadme({
      ...info,
      pairedSkipReason:
        'the paired pass measured 96 of the 97 models it had to cover, ' +
        'missing duplex.ifc',
    })

    expect(discarded).toContain('discarded')
    expect(discarded).toContain('missing duplex.ifc')
    expect(discarded).toContain('A partial paired delta is worse than none')
    // Still the un-paired branch: no second delta is named anywhere.
    expect(discarded).not.toContain('This directory holds **two**')

    expect(renderReadme(info)).not.toContain('discarded')
  })

  test('still warns off the cross-run delta when no paired pass ran', () => {
    // The un-paired path is the one a reader is MOST likely to misread,
    // because the directory then looks exactly like every historical one.
    const text = renderReadme(info)

    expect(text).toContain('Only a `crossRun` delta was produced')
    expect(text).toContain('13.66% median noise floor')
    expect(text).toContain('Read it as a lead')
    expect(text).not.toContain('This directory holds **two**')
  })
})

/**
 * The rc job summary carries the same A/A floor the snapshot README does, and
 * so needs the same qualification — but it is Python inside
 * `.github/workflows/rc-regression.yml`, generated once per matrix target and
 * never exercised by anything before a release runs. Printed unconditionally
 * it told the reader of the PUBLIC target's summary that the only measured
 * floor "was not measured on this one", i.e. asserted a falsehood about the
 * exact corpus it was measured on.
 *
 * These read the workflow as text on purpose. Executing it would put a
 * python3 dependency on `yarn test`, which has to run on every dev machine;
 * what has to hold is structural — that the paragraph is behind a branch, on
 * the same corpus name renderReadme() branches on, with the two arms the
 * right way round.
 */
describe('the rc job summary\'s A/A floor paragraph', () => {

  const workflow = fs.readFileSync(
    path.resolve(process.cwd(), '.github/workflows/rc-regression.yml'), 'utf8')

  // Everything below is scoped to the one step that prints the paragraph;
  // the file holds several unrelated Python heredocs.
  const step = workflow.split('- name: Summarize the paired delta')[1] || ''

  test('branches the floor\'s scope on the matrix target', () => {
    // The step's env is where the target's identity enters the Python.
    expect(step).toContain('REPO_NAME: ${{ matrix.target.repo }}')
    expect(step).toContain('os.environ.get(\'REPO_NAME\', \'\')')

    const arms = step.split('if corpus == AA_NULL_CORPUS:')

    expect(arms).toHaveLength(2)

    const [publicArm, privateArm] = arms[1].split(/\n +else:\n/)

    // The public target is told the floor WAS measured here...
    expect(publicArm).toContain('measured on **this** corpus')
    expect(publicArm).not.toContain('not on this one')

    // ...and only the other targets are told it was not. An inverted
    // condition swaps these two and fails here.
    expect(privateArm).toContain('measured on the **public** corpus')
    expect(privateArm).toContain('not on this one')
  })

  test('branches on the same corpus name the README does', () => {
    // Two copies of one fact in two languages. If they ever disagree, one of
    // the two documents a release ships is qualified against the wrong repo.
    expect(step).toContain(`AA_NULL_CORPUS = '${AA_NULL_CORPUS}'`)
    expect(step).toContain(`at \`${AA_NULL_CORPUS_SHA}\``)
  })

  test('does not claim the same models off a matching corpus name', () => {
    // The README's F2 fix, in the summary's own words: the null test pinned
    // its checkout and this job does not, so matching the corpus by name
    // says nothing about the model set.
    const publicArm =
      step.split('if corpus == AA_NULL_CORPUS:')[1].split(/\n +else:\n/)[0]

    expect(publicArm).toContain('What is not established is the model set')
    expect(publicArm).not.toContain('Same models')
  })
})
