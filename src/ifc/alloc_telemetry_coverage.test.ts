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
      'ExtrudeCap', 'CsgOperandPrep', 'CsgKernel',
    ]

    for (const tag of faceTags.concat(newTags)) {
      expect(telemetryHeader).toContain(`  ${tag},`)
    }

    // `Count` is the array bound for every per-site counter, so an enumerator
    // added after it would silently size them short.
    expect(telemetryHeader.trimEnd().includes('  TriExtrusion,')).toBe(true)
    expect((telemetryHeader.match(/^\s+Count$/gm) ?? []).length).toBe(2)
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
      'extrude_cap', 'csg_operand_prep', 'csg_kernel',
    ]) {
      expect(telemetrySource).toContain(`"${name}"`)
    }
  })
})
