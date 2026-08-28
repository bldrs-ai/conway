import fs from 'fs'
import os from 'os'
import path from 'path'
import { describe, expect, test, beforeEach, afterEach } from '@jest/globals'
import { createRequire } from 'module'

/**
 * The A/A null test's analyser (.github/probe/perf-aa-null.cjs), specifically
 * WHERE IT GETS THE SET OF MODELS IT CLAIMS TO HAVE MEASURED.
 *
 * The experiment differences an identical engine against itself over the
 * corpus and publishes the residual as the paired gate's noise floor, so the
 * numbers are only as whole-corpus as their denominator. An earlier revision
 * derived that denominator from the pass outputs themselves, which is the
 * correlated-loss defect `pairedCoverage()` in scripts/bless_perf_snapshot.cjs
 * was rewritten to remove: every pass runs one batch driver over one tree, so
 * a model no pass emits a row for is missing from all of them at once and a
 * demand read off them has nothing to notice.
 *
 * It is not hypothetical. The per-model perf CSV is named `<stem>.perf.csv`
 * (`path.parse(ifcPath).name` in src/ifc/ifc_regression_batch_main.ts) and
 * written with an overwrite, while the row inside it is keyed on
 * `path.basename()`. Two corpus models sharing a STEM therefore leave one row
 * between them — `ifc/index.ifc` vs `ifc/bldrs/index.ifc` (conway#633), and
 * `step/zoo.dev/a-gear.step` vs its `a-gear.stp` symlink, whose basenames
 * differ while their stems do not. The public corpus walks 99 models and every
 * pass wrote 97 rows for exactly that reason.
 *
 * These pin that the demand comes from the corpus walk instead, and that a
 * shortfall is stated rather than absorbed.
 */
const require_ = createRequire(import.meta.url)

// Resolved from the repo root: the test runs from compiled/src/scripts, and
// neither .github/probe nor scripts/ is part of the tsc build. Jest's rootDir
// is the repo root.
type Row = Record<string, string>
type Pass = { name: string, rows: Row[] }
type Joined = {
  models: { file: string, byPass: Map<string, Row> }[],
  dropped: { file: string, why: string }[],
}
type Collision = { stem: string, paths: string[] }
type Coverage = {
  verified: boolean,
  walkError: string,
  corpusRoot: string,
  models?: number,
  expected?: string[],
  collisions?: Collision[],
  unmeasurable?: number,
  missing?: { file: string, why: string }[],
  unexpected?: string[],
  measured?: number,
  complete?: boolean,
}

const {
  corpusCoverage, corpusDemand, corpusShortfall, joinPasses, renderMarkdown,
} =
  require_(path.resolve(process.cwd(), '.github/probe/perf-aa-null.cjs')) as {
    corpusCoverage: (
      corpusRoot: string, corpusExclude: string, joined: Joined) => Coverage,
    corpusDemand: (corpusModels: string[]) => {
      models: number, expected: string[], collisions: Collision[],
      unmeasurable: number,
    },
    corpusShortfall: (
      demand: { expected: string[], collisions: Collision[] },
      joined: Joined) =>
      { missing: { file: string, why: string }[], unexpected: string[] },
    joinPasses: (passes: Pass[]) => Joined,
    renderMarkdown: (
      passes: Pass[], joined: Joined, label: string,
      coverage: Coverage) => string,
  }

/** The timing columns the analyser reads, filled with something plausible. */
const TIMINGS = {
  parseTimeMs: '20', geometryTimeMs: '80', totalTimeMs: '105',
  parsePlusGeometryMs: '100',
}

/**
 * Two passes that measured exactly these models, both OK.
 *
 * @param names Row `file` values, as the regression child writes them.
 * @return Passes in run order.
 */
function passes(names: string[]): Pass[] {
  return ['P1', 'P2'].map((name) => ({
    name,
    rows: names.map((file) => ({ file, status: 'OK', ...TIMINGS })),
  }))
}

let workDir: string

beforeEach(() => {
  workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'perf-aa-'))
})

afterEach(() => {
  fs.rmSync(workDir, { recursive: true, force: true })
})

/**
 * Write model files into the temp corpus, creating parents.
 *
 * @param relatives Paths relative to the corpus root.
 */
function corpus(relatives: string[]): void {
  for (const relative of relatives) {
    fs.mkdirSync(path.join(workDir, path.dirname(relative)), {
      recursive: true,
    })
    fs.writeFileSync(path.join(workDir, relative), 'x', 'utf8')
  }
}

describe('corpusDemand', () => {

  test('two models sharing a perf-CSV stem demand nothing and are named', () => {
    // Which of the pair survived the overwrite is not recoverable from the
    // surviving row, so a colliding stem cannot be demanded of a pass — it is
    // reported as unmeasurable instead. Demanding both would double one
    // defect into two "missing" models; demanding neither in silence is how
    // the corpus quietly shrinks.
    const demand = corpusDemand([
      'models/ifc/index.ifc', 'models/ifc/bldrs/index.ifc',
      'models/step/a-gear.step', 'models/step/a-gear.stp',
      'models/ifc/duplex.ifc',
    ])

    expect(demand.expected).toEqual(['duplex.ifc'])
    expect(demand.collisions.map((c) => c.stem)).toEqual(['a-gear', 'index'])
    // One model of each pair is lost, not both.
    expect(demand.unmeasurable).toBe(2)
    expect(demand.models).toBe(5)
  })

  test('the collision unit is the stem, not the basename', () => {
    // `a-gear.step` and `a-gear.stp` have DIFFERENT basenames, so a
    // basename-keyed check sees two independent models and cannot explain why
    // only one row came back. The file the child writes is named after the
    // stem, which is what actually collides.
    const demand = corpusDemand(
      ['models/step/a-gear.step', 'models/step/a-gear.stp'])

    expect(demand.expected).toEqual([])
    expect(demand.collisions[0].paths).toEqual(
      ['models/step/a-gear.step', 'models/step/a-gear.stp'])
  })
})

describe('corpusShortfall', () => {

  test('a model absent from EVERY pass is reported missing', () => {
    // THE DEFECT THIS FILE EXISTS FOR. Seeded from the pass outputs, such a
    // model is neither in `models` nor in `dropped`: it is reported as
    // neither measured nor dropped, and the totals go out as whole-corpus
    // statistics over a corpus that is quietly one model smaller.
    const demand = corpusDemand(
      ['models/ifc/duplex.ifc', 'models/ifc/haus.ifc'])
    const joined = joinPasses(passes(['duplex.ifc']))

    expect(joined.dropped).toEqual([])
    expect(corpusShortfall(demand, joined).missing).toEqual(
      [{ file: 'haus.ifc', why: 'absent from every pass' }])
  })

  test('a model one pass lost is reported with the join\'s own reason', () => {
    // Distinct from the above: the join can see this one, and why it went is
    // the useful half.
    const demand = corpusDemand(
      ['models/ifc/duplex.ifc', 'models/ifc/haus.ifc'])
    const [p1, p2] = passes(['duplex.ifc', 'haus.ifc'])

    p2.rows = p2.rows.filter((row) => row.file !== 'haus.ifc')

    const shortfall = corpusShortfall(demand, joinPasses([p1, p2]))

    expect(shortfall.missing).toEqual(
      [{ file: 'haus.ifc', why: 'missing from P2' }])
  })

  test('a colliding stem\'s surviving row is not an unexpected row', () => {
    // It is a legitimate measurement of one of the two models; it just cannot
    // be attributed. Counting it as "measured but not in the corpus walk"
    // would report the same defect twice under two different names.
    const demand = corpusDemand(
      ['models/ifc/index.ifc', 'models/ifc/bldrs/index.ifc'])

    expect(corpusShortfall(demand, joinPasses(passes(['index.ifc']))))
      .toEqual({ missing: [], unexpected: [] })
  })

  test('a measured model the corpus does not hold is reported', () => {
    // The walk and the passes then disagree about what the corpus is, and
    // neither can be trusted as the denominator.
    const demand = corpusDemand(['models/ifc/duplex.ifc'])

    expect(corpusShortfall(demand, joinPasses(passes(['duplex.ifc', 'stray.ifc'])))
      .unexpected).toEqual(['stray.ifc'])
  })
})

describe('corpusCoverage', () => {

  test('walks the corpus and reports 2 of 5 models as unmeasurable', () => {
    // End to end over a real tree, through the same collectCorpusModels() the
    // paired gate uses: this is the public corpus's shape in miniature —
    // 5 models walked, 3 rows possible, and an exclude that prunes.
    corpus([
      'ifc/index.ifc', 'ifc/bldrs/index.ifc', 'step/a-gear.step',
      'step/a-gear.stp', 'ifc/duplex.ifc', 'ifc/sp/sp-946MB.ifc',
    ])

    const coverage = corpusCoverage(
      workDir, 'sp-.*\\.ifc', joinPasses(passes(
        ['index.ifc', 'a-gear.stp', 'duplex.ifc'])))

    expect(coverage.verified).toBe(true)
    // The excluded sp-* model is not part of the demand, the same way it is
    // not part of the measurement.
    expect(coverage.models).toBe(5)
    expect(coverage.measured).toBe(3)
    expect(coverage.unmeasurable).toBe(2)
    expect(coverage.missing).toEqual([])
    expect(coverage.unexpected).toEqual([])
    // Full coverage of what is measurable is still not full coverage.
    expect(coverage.complete).toBe(false)
  })

  test('a walk that throws leaves coverage unverified, not unreported', () => {
    const coverage = corpusCoverage(
      path.join(workDir, 'nope'), '', joinPasses(passes(['duplex.ifc'])))

    expect(coverage.verified).toBe(false)
    expect(coverage.walkError).toContain('nope')
  })

  test('no corpus at all is an unverified verdict, not a silent pass', () => {
    const coverage = corpusCoverage('', '', joinPasses(passes(['duplex.ifc'])))

    expect(coverage.verified).toBe(false)
    expect(coverage.walkError).toBe('')
  })
})

describe('renderMarkdown', () => {

  test('states the denominator beside the model count', () => {
    corpus(['ifc/duplex.ifc', 'ifc/haus.ifc'])

    const pair = passes(['duplex.ifc'])
    const joined = joinPasses(pair)
    const report = renderMarkdown(
      pair, joined, 'test', corpusCoverage(workDir, '', joined))

    expect(report).toContain('covers 1 of 2')
    expect(report).toContain('Corpus coverage')
    expect(report).toContain('`haus.ifc` — absent from every pass')
    // The coverage section has to precede the statistics it qualifies.
    expect(report.indexOf('Corpus coverage'))
      .toBeLessThan(report.indexOf('as the rc gate computes it'))
  })

  test('an unverified coverage refuses the whole-corpus reading in text', () => {
    // Without a corpus walk the report may still be produced — it is the
    // deliverable of several corpus passes — but it may not describe itself
    // as covering the corpus.
    const pair = passes(['duplex.ifc'])
    const joined = joinPasses(pair)
    const report =
      renderMarkdown(pair, joined, 'test', corpusCoverage('', '', joined))

    expect(report).toContain('**Coverage is unverified**')
    expect(report).toContain('not** as whole-corpus statistics')
    expect(report).not.toContain('covers 1 of')
  })
})
