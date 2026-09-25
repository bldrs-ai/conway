import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, test } from '@jest/globals'
import { createRequire } from 'module'

/**
 * The WASM provenance check (scripts/wasmProvenance.cjs).
 *
 * `Dist/*.js` + `*.wasm` are gitignored build outputs, so `git submodule
 * update` to a new conway-geom SHA leaves the previous engine in place and
 * every consumer keeps running it. Observed Sep 2026: the tree's Dist held a
 * pre-conway-geom#214 build while the submodule was at `d049451`, and
 * `scripts/debug/face_health.mjs` reported `ADVANCED_FACE #18856` still
 * carrying the fold that #214 had removed — a closed defect read as live,
 * silently, in the exact workflow (bump, measure, pin) this repo runs.
 *
 * Driven over `classify()` rather than `inspect()`: the decision table is the
 * thing worth pinning, and exercising it through the real filesystem would
 * only ever assert "the tree I am running in is fresh", which is the
 * tautology the defect hid behind — the same reasoning as
 * check_compiled_fresh.test.ts.
 */
const require_ = createRequire(import.meta.url)

// Resolved from the repo root: the test runs from compiled/src/scripts, and
// scripts/ is not part of the tsc build. Jest's rootDir is the repo root.
const { REQUIRED_TARGETS, bundleDigest, classify, shaForPackageVersion } =
  require_(path.resolve(process.cwd(), 'scripts/wasmProvenance.cjs')) as {
    REQUIRED_TARGETS: string[],
    bundleDigest: ( dir: string ) => string | null,
    classify: ( facts: {
      populated: number,
      mirrorsAgree: boolean | null,
      marker: {
        conwayGeomSha?: string | null,
        conwayCommit?: string | null,
        sourceDirty?: string | null,
        source?: string,
      } | null,
      expectedSha: string | null,
      expectedDirty?: string | null,
    } ) => { status: string, message: string, remedy: string | null },
    shaForPackageVersion: ( version: string ) => {
      conwayCommit: string | null,
      conwayGeomSha: string | null,
    },
  }

const SHA_A = 'd049451b988fc90c810462448d45b28a1971c894'
const SHA_B = 'a28c7d9000000000000000000000000000000000'

const fresh = {
  populated: 2,
  mirrorsAgree: true,
  marker: { conwayGeomSha: SHA_A, sourceDirty: null, source: 'native-build' },
  expectedSha: SHA_A,
  expectedDirty: null,
}


describe('classify', () => {
  test('a Dist built from the checked-out submodule is ok', () => {
    const result = classify(fresh)

    expect(result.status).toBe('ok')
    expect(result.remedy).toBeNull()
  })

  test('THE DEFECT: a Dist built from a different conway-geom SHA is stale', () => {
    const result = classify({ ...fresh, marker: { conwayGeomSha: SHA_B } })

    expect(result.status).toBe('stale')
    // Both SHAs named, because "stale" without them sends the reader looking.
    expect(result.message).toContain(SHA_B.slice(0, 10))
    expect(result.message).toContain(SHA_A.slice(0, 10))
    expect(result.remedy).toContain('wasm-prebuilt')
  })

  test('an unpopulated Dist is missing, not stale', () => {
    expect(classify({ ...fresh, populated: 0 }).status).toBe('missing')
  })

  test('mirrors holding different builds is skew, and outranks provenance', () => {
    // Marker agrees with the submodule, so only the skew can produce a
    // non-ok verdict here — this fails if the ordering is reversed.
    const result = classify({ ...fresh, mirrorsAgree: false })

    expect(result.status).toBe('skew')
  })

  test('a single populated mirror does not count as agreement', () => {
    expect(classify({ ...fresh, populated: 1, mirrorsAgree: null }).status).toBe('ok')
  })

  test('no marker is unstamped — never silently ok', () => {
    const result = classify({ ...fresh, marker: null })

    expect(result.status).toBe('unstamped')
    expect(result.remedy).toContain('wasm-stamp')
  })

  test('a marker whose SHA could not be resolved is unresolved, not ok', () => {
    const result = classify({
      ...fresh,
      marker: { conwayGeomSha: null, conwayCommit: 'efd109ea', source: 'npm:@bldrs-ai/conway@1.1604.715-gefd109ea' },
    })

    expect(result.status).toBe('unresolved')
    expect(result.message).toContain('efd109ea')
  })

  test('an unreadable submodule HEAD is unresolved, not a false match', () => {
    expect(classify({ ...fresh, expectedSha: null }).status).toBe('unresolved')
  })

  /*
   * The SHA alone is not an identity during iterative C++ work: edit
   * conway-geom, rebuild nothing, and HEAD is unchanged, so a marker written
   * before the edit still matched and everything read `ok` while the wasm
   * predated the edit (codex review, conway#717).
   */
  test('THE DEFECT: edits that leave HEAD alone still invalidate the stamp', () => {
    const result = classify({ ...fresh, expectedDirty: 'deadbeef' })

    expect(result.status).toBe('dirty')
    expect(result.message).toContain('uncommitted changes')
  })

  test('a build FROM a dirty tree does not read ok once the tree is clean', () => {
    const result = classify({
      ...fresh,
      marker: { conwayGeomSha: SHA_A, sourceDirty: 'deadbeef' },
      expectedDirty: null,
    })

    expect(result.status).toBe('dirty')
  })

  test('the same dirty state on both sides is ok — iterating is not an error', () => {
    const result = classify({
      ...fresh,
      marker: { conwayGeomSha: SHA_A, sourceDirty: 'deadbeef' },
      expectedDirty: 'deadbeef',
    })

    expect(result.status).toBe('ok')
  })

  test('a wrong SHA outranks dirty state — the coarser problem is named first', () => {
    const result = classify({ ...fresh, marker: { conwayGeomSha: SHA_B }, expectedDirty: 'deadbeef' })

    expect(result.status).toBe('stale')
  })
})


describe('REQUIRED_TARGETS', () => {
  /*
   * A stamp asserts a COMPLETE bundle. Partial builds copy bin/release
   * wholesale, so siblings from an earlier build at another SHA ride along;
   * stamping those converts "nobody can tell" into a confident wrong answer.
   */
  test('names all four variants, so a partial build cannot satisfy it', () => {
    expect([...REQUIRED_TARGETS].sort()).toEqual([
      'ConwayGeomWasmNode',
      'ConwayGeomWasmNodeMT',
      'ConwayGeomWasmWeb',
      'ConwayGeomWasmWebMT',
    ])
  })
})


describe('shaForPackageVersion', () => {
  test('reads the conway commit out of a published version suffix', () => {
    expect(shaForPackageVersion('1.1604.715-gefd109ea').conwayCommit).toBe('efd109ea')
  })

  test('a version with no suffix resolves to nothing rather than guessing', () => {
    expect(shaForPackageVersion('0.8.750')).toEqual({
      conwayCommit: null,
      conwayGeomSha: null,
    })
  })
})


/**
 * The mirror comparison, over real directories.
 *
 * Both cases below came out of the conway#717 review and the measurement that
 * followed it. The first is the defect codex found: hashing only the Node
 * sentinel misses `ConwayGeomWasmWebMT.wasm`, which is a separate 1.8MB
 * artifact and can differ on its own. The second is the false positive that
 * fix introduced and a measurement caught — the source-side mirror carries
 * `.d.ts` declarations the compiled one never gets, so a whole-directory hash
 * calls every correctly populated tree skewed, and a check that rejects
 * correct work is one people learn to bypass.
 */
describe('bundleDigest', () => {
  let a: string
  let b: string

  /**
   * @param dir directory to create
   * @param files basename to contents
   */
  const populate = ( dir: string, files: Record<string, string> ): void => {
    fs.mkdirSync(dir, { recursive: true })
    for (const [name, body] of Object.entries(files)) {
      fs.writeFileSync(path.join(dir, name), body)
    }
  }

  beforeEach(() => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wasm-prov-'))

    a = path.join(root, 'a')
    b = path.join(root, 'b')
  })

  afterEach(() => {
    fs.rmSync(path.dirname(a), { recursive: true, force: true })
  })

  test('identical runtime bundles agree', () => {
    populate(a, { 'ConwayGeomWasmNodeMT.js': 'glue', 'ConwayGeomWasmWebMT.wasm': 'binary' })
    populate(b, { 'ConwayGeomWasmNodeMT.js': 'glue', 'ConwayGeomWasmWebMT.wasm': 'binary' })

    expect(bundleDigest(a)).toBe(bundleDigest(b))
  })

  test('THE DEFECT: a differing .wasm is skew even when the glue matches', () => {
    populate(a, { 'ConwayGeomWasmNodeMT.js': 'glue', 'ConwayGeomWasmWebMT.wasm': 'binary' })
    populate(b, { 'ConwayGeomWasmNodeMT.js': 'glue', 'ConwayGeomWasmWebMT.wasm': 'DIFFERENT' })

    expect(bundleDigest(a)).not.toBe(bundleDigest(b))
  })

  test('a missing runtime file is skew, not a silent skip', () => {
    populate(a, { 'ConwayGeomWasmNodeMT.js': 'glue', 'ConwayGeomWasmWebMT.wasm': 'binary' })
    populate(b, { 'ConwayGeomWasmNodeMT.js': 'glue' })

    expect(bundleDigest(a)).not.toBe(bundleDigest(b))
  })

  test('.d.ts declarations on one side only do NOT count as skew', () => {
    populate(a, { 'ConwayGeomWasmNodeMT.js': 'glue', 'ConwayGeomWasm.d.ts': 'declarations' })
    populate(b, { 'ConwayGeomWasmNodeMT.js': 'glue' })

    expect(bundleDigest(a)).toBe(bundleDigest(b))
  })

  test('the per-directory marker does not count as skew', () => {
    populate(a, { 'ConwayGeomWasmNodeMT.js': 'glue', '.wasm-provenance.json': '{"a":1}' })
    populate(b, { 'ConwayGeomWasmNodeMT.js': 'glue', '.wasm-provenance.json': '{"b":2}' })

    expect(bundleDigest(a)).toBe(bundleDigest(b))
  })

  test('an unreadable directory digests to null rather than throwing', () => {
    expect(bundleDigest(path.join(a, 'nope'))).toBeNull()
  })
})
