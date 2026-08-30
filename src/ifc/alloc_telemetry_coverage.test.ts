import fs from 'fs'
import path from 'path'
import { describe, expect, test } from '@jest/globals'


/**
 * The AFTP allocation instrument only records inside an `AllocTelemetryScope`:
 * the `--wrap`ped allocator hooks are inert otherwise. So a call graph with no
 * scope on it reports nothing at all, which on the report is indistinguishable
 * from a call graph that allocates nothing.
 *
 * That is not hypothetical. conway#637 recorded "zero scoped faces on ordinary
 * extrusion / profile / CSG IFC models" and read it as evidence about those
 * paths; the #639 audit established it was an instrument-placement artifact —
 * `AllocTelemetryScope` was only ever placed around `AddFaceToGeometry` /
 * `AddFaceToGeometrySimple`, and solid extrusion and the boolean path are a
 * structurally separate call graph. Measured on D3D once the scopes were
 * added, the previously instrumented path accounted for 2,464 of 43.7 M
 * in-scope allocator calls — 0.006 %.
 *
 * These tests pin the placements so the same blind spot cannot reopen
 * silently. They are asserted against the C++ SOURCE TEXT for the same reason
 * the sibling `ifc_regression_single_engine.test.ts` is: the property is where
 * a scope sits in the code, the instrument is compile-gated behind
 * `CONWAY_ALLOC_TELEMETRY` and so is absent from the shipped wasm, and there
 * is no runtime through which a default build could observe it.
 */
describe('allocation telemetry covers the solid-sweep and CSG call graphs', () => {

  // Resolved from the repo root: the test runs out of compiled/src/ifc, and
  // the conway-geom submodule is not part of the tsc output. Jest's rootDir is
  // the repo root.
  /**
   * Read a conway-geom source file as text.
   *
   * @param relative Path below the conway-geom submodule root.
   * @return {string} File contents.
   */
  function conwayGeomSource(relative: string): string {
    return fs.readFileSync(
        path.resolve(process.cwd(), 'dependencies/conway-geom', relative),
        'utf8')
  }

  const processorSource =
    conwayGeomSource('conway_geometry/ConwayGeometryProcessor.cpp')
  const geometryUtilsSource =
    conwayGeomSource('conway_geometry/operations/geometry_utils.h')
  const telemetryHeader =
    conwayGeomSource('conway_geometry/structures/alloc_telemetry.h')
  const telemetrySource =
    conwayGeomSource('conway_geometry/structures/alloc_telemetry.cpp')

  /**
   * Slice the body of a C++ function out of a source file by brace matching
   * from its signature.
   *
   * Matching the signature and the scope construction *together* is the whole
   * point: an earlier version of this suite asserted on the bare enum token,
   * which meant deleting the `AllocTelemetryScope` and leaving any mention of
   * `AllocSite::ExtrudeSolid` anywhere in the file still passed. That is
   * exactly the blind spot the suite exists to prevent, so it has to read the
   * function body rather than the file.
   *
   * @param source File text to search.
   * @param signature Literal text that opens the function, up to and
   *   including the character before its opening brace.
   * @return {string} The function body, braces included.
   */
  function functionBody(source: string, signature: string): string {
    const start = source.indexOf(signature)

    expect(start).toBeGreaterThanOrEqual(0)

    const open = source.indexOf('{', start + signature.length)

    expect(open).toBeGreaterThanOrEqual(0)

    let depth = 0

    for (let where = open; where < source.length; ++where) {
      if (source[where] === '{') {
        depth += 1
      } else if (source[where] === '}') {
        depth -= 1

        if (depth === 0) {
          return source.slice(open, where + 1)
        }
      }
    }

    throw new Error(`unbalanced braces after "${signature}"`)
  }

  /**
   * Every brace-matched block opening with `signature`, not just the first.
   *
   * `functionBody` takes the first match, which is fine for a function
   * definition and wrong for a guard: `if (ptr != nullptr)` can legitimately
   * appear more than once in one function, and an assertion anchored on the
   * first occurrence passes while the block it was written about disappears.
   * Callers assert that *some* block contains what they care about, which ties
   * the guard to the statement it guards instead of to its position.
   *
   * @param source File or function text to search.
   * @param signature Literal text opening each block, up to the character
   *   before its opening brace.
   * @return {string[]} Each matching block, braces included, in source order.
   */
  function blocksOpening(source: string, signature: string): string[] {
    const bodies: string[] = []

    for (let at = source.indexOf(signature); at >= 0;
      at = source.indexOf(signature, at + signature.length)) {
      const open = source.indexOf('{', at + signature.length)

      if (open < 0) {
        continue
      }

      let depth = 0

      for (let where = open; where < source.length; ++where) {
        if (source[where] === '{') {
          depth += 1
        } else if (source[where] === '}') {
          depth -= 1

          if (depth === 0) {
            bodies.push(source.slice(open, where + 1))
            break
          }
        }
      }
    }

    return bodies
  }

  test('Extrude() — the IfcExtrudedAreaSolid sweep — opens a scope', () => {
    const body = functionBody(geometryUtilsSource, 'inline Geometry Extrude(')

    expect(body).toContain(
        'conway::AllocTelemetryScope telemetryScope(\n    conway::AllocSite::ExtrudeSolid )')
    // The cap ring buffers and the earcut call are tagged separately inside
    // that scope; without the split, the arena-backable part of an extrusion
    // cannot be told from the mesh growth that has to be retained.
    expect(body).toContain('conway::AllocSite::ExtrudeCap')
    expect(body).toContain('conway::AllocSite::Earcut')
  })

  test('the other solid sweep, Sweep()/SweepCircular(), opens a scope', () => {
    // Two entry points, so each needs its own construction — asserting a count
    // of two across the file would pass with both of them inside one function.
    for (const signature of [
      'inline Geometry Sweep(', 'inline Geometry SweepCircular(',
    ]) {
      expect(functionBody(geometryUtilsSource, signature))
          .toContain(
              'conway::AllocTelemetryScope telemetryScope(\n    conway::AllocSite::SweepSolid )')
    }
  })

  test('BoolSubtract — the CSG/boolean entry point — opens a scope', () => {
    const body = functionBody(
        processorSource, 'Geometry ConwayGeometryProcessor::BoolSubtract(')

    expect(body)
        .toContain('AllocTelemetryScope telemetryScope( AllocSite::CsgBoolean )')
    // Operand conditioning and the kernel have opposite memory shapes, so
    // they are tagged apart; merged, neither can be judged for arena backing.
    expect(body).toContain('AllocSite::CsgOperandPrep')
    expect(body).toContain('AllocSite::CsgKernel')
  })

  test('the two face scopes name their kind rather than defaulting', () => {
    // Every scope kind must be explicit: an unnamed scope would bucket its
    // units under `other` and blend two populations with different natural
    // units (a face, a whole solid) into one average.
    for (const signature of [
      'void ConwayGeometryProcessor::AddFaceToGeometry(',
      'void ConwayGeometryProcessor::AddFaceToGeometrySimple(',
    ]) {
      expect(functionBody(processorSource, signature))
          .toContain(
              'AllocTelemetryScope telemetryScope( AllocSite::AdvancedFace )')
    }

    expect(processorSource).not.toContain('AllocTelemetryScope telemetryScope;')
  })

  test('extrusion and CSG are separable from each other and from the eight face tags', () => {
    const faceTags = [
      'TriBounds', 'TriBspline', 'TriCylinder', 'TriSphere',
      'TriToroidal', 'TriConical', 'TriRevolution', 'TriExtrusion',
    ]
    const newTags = [
      'AdvancedFace', 'ExtrudeSolid', 'SweepSolid', 'CsgBoolean',
      'ExtrudeCap', 'CsgOperandPrep', 'CsgKernel', 'VertexWeld',
    ]

    for (const tag of faceTags.concat(newTags)) {
      expect(telemetryHeader).toContain(`  ${tag},`)
    }

  })

  test('Count is the last enumerator in both arms of the #ifdef', () => {
    // `Count` is the array bound for every per-(kind, site) counter, so an
    // enumerator added *after* it silently sizes them short — and the
    // static_assert that would catch it lives in the translation unit only the
    // opt-in build compiles, so nothing in CI fires it. An earlier version of
    // this test merely checked that two `Count` lines existed, which an
    // enumerator appended after `Count` in both arms would have passed.
    const bodies = [...telemetryHeader.matchAll(/enum class AllocSite \{([^}]*)\}/g)]
        .map((match) => match[1])

    expect(bodies).toHaveLength(2)

    for (const body of bodies) {
      const enumerators = body.split('\n')
          .map((line) => line.replace(/\/\/.*$/, '').trim())
          .filter((line) => line.length > 0)
          .map((line) => line.replace(/\s*=.*$/, '').replace(/,$/, ''))

      expect(enumerators[enumerators.length - 1]).toBe('Count')
      expect(enumerators.filter((name) => name === 'Count')).toHaveLength(1)
    }
  })

  test('the enum is declared before the scope class that takes one', () => {
    // AllocTelemetryScope's constructor names AllocSite, so the enum has to be
    // complete first — in BOTH arms of the CONWAY_ALLOC_TELEMETRY #ifdef. The
    // stub arm is the one nothing in CI compiles, so it is the one that rots.
    const enumPositions = [...telemetryHeader.matchAll(/enum class AllocSite/g)]
        .map((match) => match.index ?? -1)
    const classPositions =
      [...telemetryHeader.matchAll(/class AllocTelemetryScope/g)]
          .map((match) => match.index ?? -1)

    expect(enumPositions).toHaveLength(2)
    expect(classPositions).toHaveLength(2)
    expect(enumPositions[0]).toBeLessThan(classPositions[0])
    expect(enumPositions[1]).toBeLessThan(classPositions[1])
  })

  test('the report keeps one site name per enumerator', () => {
    // Backed at compile time too, by a static_assert — asserted here as well
    // because the telemetry translation unit is only compiled in the opt-in
    // build, so nothing in CI would fire that assert.
    expect(telemetrySource)
        .toContain('kSiteNames must have exactly one entry per AllocSite')

    for (const name of [
      'advanced_face', 'extrude_solid', 'sweep_solid', 'csg_boolean',
      'extrude_cap', 'csg_operand_prep', 'csg_kernel', 'vertex_weld',
    ]) {
      expect(telemetrySource).toContain(`"${name}"`)
    }
  })

  /**
   * The four mechanisms conway#653 added, pinned the same way the scope
   * placements above are: against C++ source text, because the instrument is
   * compile-gated behind `CONWAY_ALLOC_TELEMETRY` and absent from every build
   * this suite can run.
   *
   * conway-geom#198 carries known-answer unit tests for all four, run natively
   * by that repo's `test/run_native_tests.sh`. These are the conway-side
   * guard: the submodule pin can move under this repo without those tests
   * being consulted, and every one of these mechanisms was *introduced* by a
   * review round precisely because the defect it fixes is invisible on the
   * happy path. A silent revert would land here as a doc that no longer
   * describes the instrument.
   *
   * Three of the four are ORDERING properties, which `toContain` cannot
   * express — "the counter increments before the early return" is exactly the
   * shape of both P2-1 and P2-4 — so they are asserted on index comparisons
   * within the function body.
   */
  describe('the ownership, lifetime and denominator mechanisms (#653)', () => {

    test('onFreeSized subtracts only what the scope owns', () => {
      const body = functionBody(telemetrySource, 'inline void onFreeSized(')

      // The ownership lookup, and the foreign branch that replaced the
      // unconditional subtract. Without the lookup a free of pre-scope memory
      // is taken off the in-scope live counter again, which is the single
      // cause behind all five byte retractions in
      // design/new/geometry-memory-coverage.md.
      expect(body).toContain('const int32_t slot = tableFind(ptr);')
      expect(body).toContain('tls.foreignFrees += 1;')

      // The recorded size of the owned block, not the size of the free.
      expect(body).toContain('tls.liveBytes -= owned;')

      // The clamp is what the old code used to stop the counter going
      // negative. Ownership makes it structurally impossible, so its return
      // would mean the subtract had become unconditional again.
      expect(body).not.toContain('tls.liveBytes = 0;')
    })

    test('the load-wide denominator counts calls, not successes', () => {
      // Both halves of the census had the same defect and both were found by
      // review: the early return ran BEFORE the counter, so a call that
      // allocated or released nothing was invisible to a counter documented as
      // seeing every wrapped call. That understates exactly the paths under
      // memory pressure. Ordering is the property, so index comparison is the
      // assertion.
      const allocBody = functionBody(telemetrySource, 'inline void onAlloc(')
      const allocCounter = allocBody.indexOf('g_loadAllocCalls.fetch_add')
      const allocNullTest = allocBody.indexOf('if (ptr == nullptr)')
      const allocScopeTest = allocBody.indexOf('if (!tls.active)')

      expect(allocCounter).toBeGreaterThanOrEqual(0)
      expect(allocNullTest).toBeGreaterThan(allocCounter)
      expect(allocScopeTest).toBeGreaterThan(allocCounter)
      expect(allocBody).toContain('g_loadAllocFailed.fetch_add')

      const freeBody = functionBody(telemetrySource, 'inline void onFreeSized(')
      const freeCounter = freeBody.indexOf('g_loadFreeCalls.fetch_add')
      const freeNullTest = freeBody.indexOf('if (ptr == nullptr)')
      const freeScopeTest = freeBody.indexOf('if (!tls.active)')

      expect(freeCounter).toBeGreaterThanOrEqual(0)
      expect(freeNullTest).toBeGreaterThan(freeCounter)
      expect(freeScopeTest).toBeGreaterThan(freeCounter)
      expect(freeBody).toContain('g_loadFreeNull.fetch_add')
    })

    test('the realloc wrapper defers accounting and guards its null', () => {
      const body = functionBody(telemetrySource, 'void* __wrap_realloc(')

      // The size must be read while the block is still valid, but the
      // accounting applied only once the outcome is known: realloc's contract
      // leaves the original allocated on failure, so committing the free up
      // front booked a live block as died-in-scope.
      const measure = body.indexOf('malloc_usable_size(ptr)')
      const call = body.indexOf('__real_realloc(ptr, size)')

      expect(measure).toBeGreaterThanOrEqual(0)
      expect(call).toBeGreaterThan(measure)
      expect(body).toContain('if (out == nullptr && ptr != nullptr && size != 0)')

      // And the guard that keeps the null-free census honest in the other
      // direction: realloc(nullptr, n) is a malloc, so it must NOT reach the
      // free accounting, which now counts free(nullptr) as a real call.
      //
      // Asserted as "some `if (ptr != nullptr)` block CONTAINS the accounting
      // call", not as an index comparison. `ptr != nullptr` already appears
      // earlier in this function (the ternary computing oldSize), so a
      // refactor of that ternary into an `if` would satisfy a first-occurrence
      // index check while the real guard vanished — leaving the test green on
      // exactly the regression it exists to catch.
      const guarded = blocksOpening(body, 'if (ptr != nullptr)')
        .filter((block) => block.includes('onFreeSized(ptr, oldSize)'))

      expect(guarded).toHaveLength(1)

      // free(nullptr) IS a wrapped call, so the free wrapper deliberately does
      // not guard. The two together are the property; asserting only one lets
      // the census drift in the direction the other covers.
      expect(functionBody(telemetrySource, 'void __wrap_free('))
          .toContain('onFree(ptr);')
      expect(functionBody(telemetrySource, 'void __wrap_free('))
          .not.toContain('if (ptr')
    })

    test('the two unowned causes are counted apart and advised apart', () => {
      // A full table and a table that could not be allocated both leave
      // allocations unclassified, and their remedies are OPPOSITE: raise the
      // table size for the first, lower it (or relieve pressure) for the
      // second. The report printed the raise advice for both, which tells a
      // reader under memory pressure to ask for more of what just failed.
      expect(functionBody(telemetrySource, 'inline void onAlloc('))
          .toContain('if (tlsTable == nullptr)')

      for (const counter of [
        'tls.unownedNoTableAllocs += 1;', 'tls.unownedFullAllocs += 1;',
      ]) {
        expect(telemetrySource).toContain(counter)
      }

      // The remedies, asserted by direction rather than by full sentence (the
      // strings are split across literals in the fprintf, and the direction is
      // the part that was wrong) — but each one scoped to ITS OWN reporting
      // block. Asserting that both labels and both remedies merely exist
      // somewhere in the file passes with the two fprintf bodies swapped,
      // which is precisely the misleading-remedy regression this test exists
      // to prevent: the reader under memory pressure would be told to raise
      // the table size, i.e. to ask for more of the allocation that just
      // failed.
      const RAISE = ' raise CONWAY_ALLOC_TELEMETRY_TABLE_BITS and re-run'
      const LOWER = ' load-wide denominator remain valid. LOWER'

      const fullBlocks = blocksOpening(
          telemetrySource, 'if (unownedFullAllocs != 0)')
      const noTableBlocks = blocksOpening(
          telemetrySource, 'if (unownedNoTableAllocs != 0)')

      expect(fullBlocks).toHaveLength(1)
      expect(noTableBlocks).toHaveLength(1)

      // A full table wants a bigger one.
      expect(fullBlocks[0]).toContain('unowned(table-full)=')
      expect(fullBlocks[0]).toContain(RAISE)
      expect(fullBlocks[0]).not.toContain(LOWER)

      // A table that could not be allocated wants a smaller one; telling the
      // reader to raise it here is the defect.
      expect(noTableBlocks[0]).toContain('unowned(no-table)=')
      expect(noTableBlocks[0]).toContain(LOWER)
      expect(noTableBlocks[0]).not.toContain(RAISE)
    })

    test('no column prints a quantity the coverage doc retracted', () => {
      // `clamped` was the old exposure counter for the ownership defect and is
      // named in the doc as a retraction. Ownership replaced it with a census
      // (`foreign`), so its reappearance in the report would mean the
      // instrument had regressed to guessing.
      //
      // Asserted on forms that can only be code — the aggregate, the
      // thread-local, and the report's own format fragment. A bare `clamped`
      // would also match the comment in `onFreeSized` that explains why the
      // counter is gone, and that comment is worth keeping.
      expect(telemetrySource).not.toContain('g_totalClampedFrees')
      expect(telemetrySource).not.toContain('tls.clampedFrees')
      expect(telemetrySource).not.toContain('clamped(frees=')

      // The lifetime split, and the histogram that makes arena sizing
      // answerable, are what the doc's verdicts now rest on.
      for (const column of [
        'died-in-scope(calls=', 'escaped(bytes=', 'arena-eligible',
      ]) {
        expect(telemetrySource).toContain(column)
      }
    })
  })
})
