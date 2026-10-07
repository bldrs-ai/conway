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
const { ALL_TARGETS, GATED_TARGET, JEST_TARGET, classify, classifyAll, loadedArtifacts, markerEntries, shaForPackageVersion } =
  require_(path.resolve(process.cwd(), 'scripts/wasmProvenance.cjs')) as {
    ALL_TARGETS: string[],
    GATED_TARGET: string,
    JEST_TARGET: string,
    loadedArtifacts: ( exists: ( dir: string, target: string ) => boolean, scope?: string[] ) => {
      populatedDirs: string[],
      present: string[],
    },
    markerEntries: ( marker: object | null ) => Record<string, object> | null,
    classify: ( facts: {
      populated: number,
      // Either shape: a v1 flat marker (which describes the whole bundle) or
      // the v2 per-target map. `markerEntries` normalizes between them.
      marker: {
        conwayGeomSha?: string | null,
        conwayCommit?: string | null,
        sourceDirty?: string | null,
        source?: string,
        version?: number,
        targets?: Record<string, object>,
      } | null,
      expectedSha: string | null,
      expectedDirty?: string | null,
    } ) => {
      status: string,
      fatal: boolean,
      message: string,
      remedy: string | null,
      warnings: string[],
    },
    classifyAll: ( facts: {
      populated: number,
      // The LOADED_TARGETS found on disk; omitted means all of them.
      present?: string[],
      // Scopes the verdict to a subset of the loaded targets; omitted means all.
      targets?: string[],
      marker: object | null,
      expectedSha: string | null,
      expectedDirty?: string | null,
    } ) => {
      status: string,
      fatal: boolean,
      message: string,
      remedy: string | null,
      warnings: string[],
    },
    shaForPackageVersion: ( version: string ) => {
      conwayCommit: string | null,
      conwayGeomSha: string | null,
    },
  }

const SHA_A = 'd049451b988fc90c810462448d45b28a1971c894'
const SHA_B = 'a28c7d9000000000000000000000000000000000'

const fresh = {
  populated: 2,
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

  test('a single populated mirror is fine — mirror drift is not checked', () => {
    expect(classify({ ...fresh, populated: 1 }).status).toBe('ok')
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


describe('the gate is scoped to the artifact its consumers load', () => {
  /*
   * Rounds one to three of the conway#717 review walked a circle: partial
   * builds must not be blessed (they copy siblings from an earlier SHA), and
   * partial builds must not be blocked (build-codex-MT is documented). Both
   * are true of the same input, so the BUNDLE was the wrong unit. Provenance
   * is per target, and the verdict is about GATED_TARGET alone.
   */
  const perTarget = ( targets: Record<string, object> ) => ({
    populated: 2,
    marker: { version: 2, targets },
    expectedSha: SHA_A,
    expectedDirty: null,
  })

  test('the gated target is the one jest and the debug probes load', () => {
    expect(GATED_TARGET).toBe('ConwayGeomWasmNodeMT')
    expect(ALL_TARGETS).toContain(GATED_TARGET)
  })

  test('THE DEFECT: a stale SIBLING warns but does not block', () => {
    const result = classify(perTarget({
      ConwayGeomWasmNodeMT: { conwayGeomSha: SHA_A, sourceDirty: null },
      ConwayGeomWasmWebMT: { conwayGeomSha: SHA_B, sourceDirty: null },
    }))

    expect(result.status).toBe('ok')
    expect(result.warnings).toEqual(
        expect.arrayContaining([expect.stringContaining('ConwayGeomWasmWebMT is stale')]))
  })

  test('a stale GATED target still fails', () => {
    const result = classify(perTarget({
      ConwayGeomWasmNodeMT: { conwayGeomSha: SHA_B, sourceDirty: null },
      ConwayGeomWasmWebMT: { conwayGeomSha: SHA_A, sourceDirty: null },
    }))

    expect(result.status).toBe('stale')
  })

  test('a partial stamp covering only the gated target is ok', () => {
    const result = classify(perTarget({ ConwayGeomWasmNodeMT: { conwayGeomSha: SHA_A, sourceDirty: null } }))

    expect(result.status).toBe('ok')
    // The three absent siblings are unstamped, not silently fine.
    expect(result.warnings).toHaveLength(3)
  })

  test('a stamp that misses the gated target is unstamped, however complete otherwise', () => {
    const result = classify(perTarget({ ConwayGeomWasmWeb: { conwayGeomSha: SHA_A, sourceDirty: null } }))

    expect(result.status).toBe('unstamped')
    expect(result.remedy).toContain('--built ConwayGeomWasmNodeMT')
  })

  test('a remedy naming wasm-stamp always names --built with it', () => {
    const result = classify(perTarget({}))

    // Round three found the remedy printing a bare `yarn wasm-stamp`, which
    // the argument parser rejects — advice that cannot be followed.
    expect(result.remedy).toEqual(expect.stringContaining('wasm-stamp --built'))
  })
})


describe('the gate also covers the variant Jest loads', () => {
  /*
   * jest.single-thread.setup.js moves Jest onto ConwayGeomWasmNode (conway#724),
   * but the documented native-change workflow used to rebuild and stamp only
   * ConwayGeomWasmNodeMT. With the gate looking at NodeMT alone, that left
   * every Jest geometry test running the previous engine while the freshness
   * check reported success (codex review, conway#727).
   */
  const both = ( node: object | undefined, nodeMT: object | undefined ) => ({
    populated: 2,
    marker: {
      version: 2,
      targets: {
        ...(node ? { ConwayGeomWasmNode: node } : {}),
        ...(nodeMT ? { ConwayGeomWasmNodeMT: nodeMT } : {}),
      },
    },
    expectedSha: SHA_A,
    expectedDirty: null,
  })
  const current = { conwayGeomSha: SHA_A, sourceDirty: null }
  const old = { conwayGeomSha: SHA_B, sourceDirty: null }

  test('the target Jest loads is named, and is not the MT one', () => {
    expect(JEST_TARGET).toBe('ConwayGeomWasmNode')
    expect(ALL_TARGETS).toContain(JEST_TARGET)
  })

  test('THE DEFECT: NodeMT rebuilt and stamped, Node left stale, is stale', () => {
    const result = classifyAll(both(old, current))

    expect(result.status).toBe('stale')
    expect(result.fatal).toBe(true)
    expect(result.message).toContain('ConwayGeomWasmNode ')
    expect(result.remedy).toContain('build-codex-node')
  })

  test('the plain gate on NodeMT alone still reads ok for that same input', () => {
    // Proves the new check is what catches it, not a change to `classify`.
    expect(classify({ ...both(old, current), gatedTarget: GATED_TARGET } as never).status).toBe('ok')
  })

  test('both current is ok', () => {
    expect(classifyAll(both(current, current)).status).toBe('ok')
  })

  test('a stale NodeMT with a current Node still fails', () => {
    const result = classifyAll(both(current, old))

    expect(result.status).toBe('stale')
    expect(result.message).toContain('ConwayGeomWasmNodeMT')
  })

  describe('the stale report names the consumers of the target that is stale', () => {
    /*
     * The message used to say "jest and the debug probes are running the OLD
     * engine" whichever target was stale. After `build-codex-MT` refreshes
     * NodeMT and leaves Node stale, the probes load the FRESH NodeMT, so the
     * report invalidated an experiment that was fine; the inverse case told
     * the reader Jest was stale when only NodeMT was (codex review, conway#727).
     */
    test('Node stale only: names jest, not the debug probes', () => {
      const result = classifyAll(both(old, current))

      expect(result.status).toBe('stale')
      expect(result.message).toMatch(/jest/i)
      expect(result.message).not.toMatch(/probes/i)
    })

    test('NodeMT stale only: names the debug probes, not jest', () => {
      const result = classifyAll(both(current, old))

      expect(result.status).toBe('stale')
      expect(result.message).toMatch(/debug probes/i)
      expect(result.message).not.toMatch(/jest/i)
    })

    test('both stale: names both targets and both consumers', () => {
      const result = classifyAll(both(old, old))

      expect(result.status).toBe('stale')
      expect(result.fatal).toBe(true)
      expect(result.message).toContain('ConwayGeomWasmNode ')
      expect(result.message).toContain('ConwayGeomWasmNodeMT')
      expect(result.message).toMatch(/jest/i)
      expect(result.message).toMatch(/debug probes/i)
    })
  })

  test('a Node variant with no stamp is reported, never silently ok', () => {
    expect(classifyAll(both(undefined, current)).status).toBe('unstamped')
  })

  test('an unpopulated Dist is still missing', () => {
    expect(classifyAll({ ...both(current, current), populated: 0 }).status).toBe('missing')
  })

  describe('only the single-thread Node artifact is on disk', () => {
    /*
     * `yarn build-node` / `yarn build-single-thread` run `clean` first, which
     * removes ConwayGeomWasmNodeMT.js, and restore only ConwayGeomWasmNode.js.
     * Population was read off the NodeMT file alone, so that tree classified as
     * `missing` (nonfatal) before the Node marker was looked at, and a stale
     * Node — the very binary Jest loads — passed the gate (codex review,
     * conway#727). `present` is what inspect() derives from the files on disk.
     */
    const nodeOnly = ( node: object | undefined, extra: object = {} ) => ({
      ...both(node, undefined),
      present: [JEST_TARGET],
      ...extra,
    })

    test('THE DEFECT: a stale Node with NodeMT absent is fatal stale, not missing', () => {
      const result = classifyAll(nodeOnly(old))

      expect(result.status).toBe('stale')
      expect(result.fatal).toBe(true)
      expect(result.message).toContain('ConwayGeomWasmNode ')
    })

    test('a fresh Node with NodeMT absent is ok', () => {
      const result = classifyAll(nodeOnly(current))

      expect(result.status).toBe('ok')
      expect(result.fatal).toBe(false)
    })

    test('a leftover stale NodeMT marker does not condemn a fresh Node', () => {
      // NodeMT.js is gone, so nothing can be running it; its marker entry is
      // residue of the clean and must not decide the verdict.
      const result = classifyAll(nodeOnly(current, { ...both(current, old) }))

      expect(result.status).toBe('ok')
    })

    test('an unstamped Node with NodeMT absent is reported, never silently ok', () => {
      expect(classifyAll(nodeOnly(undefined)).status).toBe('unstamped')
    })

    test('end to end: files on disk -> facts -> fatal stale (the pre-fix path was `missing`)', () => {
      // The Dist as `yarn build-node` leaves it: Node present, NodeMT cleaned.
      const { populatedDirs, present } =
        loadedArtifacts(( _dir, target ) => target === JEST_TARGET)

      expect(populatedDirs.length).toBeGreaterThan(0)
      expect(present).toEqual([JEST_TARGET])

      const result = classifyAll({
        ...both(old, undefined),
        populated: populatedDirs.length,
        present,
      })

      expect(result.status).toBe('stale')
      expect(result.fatal).toBe(true)
    })

    test('an empty Dist has no populated dirs and no present targets', () => {
      expect(loadedArtifacts(() => false)).toEqual({ populatedDirs: [], present: [] })
    })

    test('neither target present is still missing', () => {
      expect(classifyAll({ ...both(current, current), present: [] }).status).toBe('missing')
    })
  })

  describe('a consumer that loads only NodeMT scopes the check to it', () => {
    /*
     * Every debug tool reaches inspect() through scripts/debug/wasmFreshness.mjs,
     * whose fatal branch exits 3. After `build-codex-MT` refreshes NodeMT the
     * probes load a fresh artifact, but the aggregate verdict was still fatal
     * because Node (Jest's variant) was stale, so they were refused for an
     * artifact they never import (codex review, conway#727).
     * wasmFreshness.mjs calls inspect({targets: [GATED_TARGET]}), which is
     * classifyAll over this scope; check-wasm-fresh passes nothing.
     */
    const probes = { targets: [GATED_TARGET] }

    test('Node stale, NodeMT fresh, NodeMT-scoped: ok and non-fatal', () => {
      const result = classifyAll({ ...both(old, current), ...probes })

      expect(result.status).toBe('ok')
      expect(result.fatal).toBe(false)
      expect(result.message).toContain('ConwayGeomWasmNodeMT matches')
      expect(result.message).not.toContain('ConwayGeomWasmNode ')
    })

    test('the stale Node the probes ignore is still reported as a warning', () => {
      const result = classifyAll({ ...both(old, current), ...probes })

      expect(result.warnings).toEqual(
          expect.arrayContaining([expect.stringContaining('ConwayGeomWasmNode is stale')]))
    })

    test('NodeMT stale, NodeMT-scoped: fatal', () => {
      const result = classifyAll({ ...both(current, old), ...probes })

      expect(result.status).toBe('stale')
      expect(result.fatal).toBe(true)
      expect(result.message).toContain('ConwayGeomWasmNodeMT')
    })

    test('unscoped, Node stale and NodeMT fresh: still fatal (Jest / precommit)', () => {
      const result = classifyAll(both(old, current))

      expect(result.status).toBe('stale')
      expect(result.fatal).toBe(true)
      expect(result.message).toContain('ConwayGeomWasmNode ')
    })

    test('scoped to NodeMT with only Node on disk is missing, not judged on Node', () => {
      const { populatedDirs, present } =
        loadedArtifacts(( _dir, target ) => target === JEST_TARGET, [GATED_TARGET])

      expect(populatedDirs).toEqual([])
      expect(present).toEqual([])
      expect(classifyAll({ ...both(old, undefined), populated: 0, present, ...probes }).status)
          .toBe('missing')
    })
  })

  test('the two loaded targets are not repeated as advisory siblings', () => {
    const result = classifyAll(both(current, current))

    expect(result.warnings.filter((w) => /^ConwayGeomWasmNode(MT)? is /.test(w))).toEqual([])
  })
})


describe('markerEntries', () => {
  test('a v1 flat marker describes every target, so old checkouts keep working', () => {
    const entries = markerEntries({ conwayGeomSha: SHA_A, source: 'npm' })

    expect(Object.keys(entries ?? {}).sort()).toEqual([...ALL_TARGETS].sort())
  })

  test('a v2 marker is returned as-is', () => {
    const targets = { ConwayGeomWasmNodeMT: { conwayGeomSha: SHA_A } }

    expect(markerEntries({ version: 2, targets })).toEqual(targets)
  })

  test('no marker is null, not an empty set of targets', () => {
    expect(markerEntries(null)).toBeNull()
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


describe('the gate is scoped to the artifact its consumers load', () => {
  /*
   * Rounds one to three of the conway#717 review walked a circle: partial
   * builds must not be blessed (they copy siblings from an earlier SHA), and
   * partial builds must not be blocked (build-codex-MT is documented). Both
   * are true of the same input, so the BUNDLE was the wrong unit. Provenance
   * is per target, and the verdict is about GATED_TARGET alone.
   */
  const perTarget = ( targets: Record<string, object> ) => ({
    populated: 2,
    mirrorsAgree: true,
    marker: { version: 2, targets },
    expectedSha: SHA_A,
    expectedDirty: null,
  })

  test('the gated target is the one jest and the debug probes load', () => {
    expect(GATED_TARGET).toBe('ConwayGeomWasmNodeMT')
    expect(ALL_TARGETS).toContain(GATED_TARGET)
  })

  test('THE DEFECT: a stale SIBLING warns but does not block', () => {
    const result = classify(perTarget({
      ConwayGeomWasmNodeMT: { conwayGeomSha: SHA_A, sourceDirty: null },
      ConwayGeomWasmWebMT: { conwayGeomSha: SHA_B, sourceDirty: null },
    }))

    expect(result.status).toBe('ok')
    expect(result.warnings).toEqual(
        expect.arrayContaining([expect.stringContaining('ConwayGeomWasmWebMT is stale')]))
  })

  test('a stale GATED target still fails', () => {
    const result = classify(perTarget({
      ConwayGeomWasmNodeMT: { conwayGeomSha: SHA_B, sourceDirty: null },
      ConwayGeomWasmWebMT: { conwayGeomSha: SHA_A, sourceDirty: null },
    }))

    expect(result.status).toBe('stale')
  })

  test('a partial stamp covering only the gated target is ok', () => {
    const result = classify(perTarget({ ConwayGeomWasmNodeMT: { conwayGeomSha: SHA_A, sourceDirty: null } }))

    expect(result.status).toBe('ok')
    // The three absent siblings are unstamped, not silently fine.
    expect(result.warnings).toHaveLength(3)
  })

  test('a stamp that misses the gated target is unstamped, however complete otherwise', () => {
    const result = classify(perTarget({ ConwayGeomWasmWeb: { conwayGeomSha: SHA_A, sourceDirty: null } }))

    expect(result.status).toBe('unstamped')
    expect(result.remedy).toContain('--built ConwayGeomWasmNodeMT')
  })

  test('a remedy naming wasm-stamp always names --built with it', () => {
    const result = classify(perTarget({}))

    // Round three found the remedy printing a bare `yarn wasm-stamp`, which
    // the argument parser rejects — advice that cannot be followed.
    expect(result.remedy).toEqual(expect.stringContaining('wasm-stamp --built'))
  })
})


describe('markerEntries', () => {
  test('a v1 flat marker describes every target, so old checkouts keep working', () => {
    const entries = markerEntries({ conwayGeomSha: SHA_A, source: 'npm' })

    expect(Object.keys(entries ?? {}).sort()).toEqual([...ALL_TARGETS].sort())
  })

  test('a v2 marker is returned as-is', () => {
    const targets = { ConwayGeomWasmNodeMT: { conwayGeomSha: SHA_A } }

    expect(markerEntries({ version: 2, targets })).toEqual(targets)
  })

  test('no marker is null, not an empty set of targets', () => {
    expect(markerEntries(null)).toBeNull()
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


/**
 * WHAT BLOCKS, AND WHAT ONLY SPEAKS.
 *
 * Four review rounds on conway#717 each widened the model of "what the build
 * depends on" and each time the next round found another term; twice a fix
 * rejected a CORRECTLY rebuilt tree. The retreat is deliberate: a SHA
 * mismatch — the incident that actually happened — blocks, and every
 * approximate reading is advisory. These cases pin that asymmetry, because
 * it is the whole design and it would be easy to "tighten" back into the
 * loop.
 */
describe('only a SHA mismatch is fatal', () => {
  const at = ( overrides: object ) => classify({ ...fresh, ...overrides })

  test('a stale gated target blocks', () => {
    const result = at({ marker: { conwayGeomSha: SHA_B, sourceDirty: null } })

    expect(result.status).toBe('stale')
    expect(result.fatal).toBe(true)
  })

  test('a dirty tree is advisory, not fatal', () => {
    const result = at({ expectedDirty: 'deadbeef' })

    expect(result.status).toBe('dirty')
    expect(result.fatal).toBe(false)
  })

  test('an unstamped bundle is advisory, not fatal', () => {
    const result = at({ marker: null })

    expect(result.status).toBe('unstamped')
    expect(result.fatal).toBe(false)
  })

  test('an unresolved SHA is advisory, not fatal', () => {
    const result = at({ expectedSha: null })

    expect(result.status).toBe('unresolved')
    expect(result.fatal).toBe(false)
  })

  test('an unpopulated Dist is advisory, not fatal', () => {
    const result = at({ populated: 0 })

    expect(result.status).toBe('missing')
    expect(result.fatal).toBe(false)
  })

  test('ok is never fatal', () => {
    expect(at({}).fatal).toBe(false)
  })
})
