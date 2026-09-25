import path from 'path'
import { describe, expect, test } from '@jest/globals'
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
const { classify, shaForPackageVersion } =
  require_(path.resolve(process.cwd(), 'scripts/wasmProvenance.cjs')) as {
    classify: ( facts: {
      populated: number,
      mirrorsAgree: boolean | null,
      marker: { conwayGeomSha?: string | null, conwayCommit?: string | null, source?: string } | null,
      expectedSha: string | null,
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
  marker: { conwayGeomSha: SHA_A, source: 'native-build' },
  expectedSha: SHA_A,
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
