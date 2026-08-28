import fs from 'fs'
import { describe, expect, test, beforeEach } from '@jest/globals'
import { AP214GeometryExtraction } from './ap214_geometry_extraction'
import { ParseResult } from '../step/parsing/step_parser'
import AP214StepParser from './ap214_step_parser'
import AP214StepModel from './ap214_step_model'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ConwayGeometry } from '../../dependencies/conway-geom'
import { CanonicalMeshType } from '../core/canonical_mesh'
import { advanced_face } from './AP214E3_2010_gen'

/* eslint-disable no-magic-numbers -- the express IDs and the grid's triangle
   count are quantities of this fixture rather than of the code under test;
   naming them would move the evidence away from the assertions that rest on
   it. */

// `#50626` and its 19-entity reference closure, lifted from
// `step/conor/Orbiter_v1.1_Gear_7.5.step` (bldrs-ai/test-models-private#93).
// A SPHERICAL_SURFACE of radius 0.9 bounded by a SEAM: EDGE_LOOP #9128 walks
// EDGE_CURVE #28750 forward (#41053 .T.) and then back (#41054 .F.).
const FIXTURE = 'data/issue-595-sphere-seam-loop.step'

// A SYNTHETIC four-edge spelling of the same seam: the great circle split at
// (0, 0.9, 0) into two quarter arcs, walked A .T. B .T. B .F. A .F., with B on
// a duplicate CIRCLE entity so its extraction can be failed independently.
//
// It exists because the real face above cannot reach the state codex's P1
// describes. Its loop has ONE EDGE_CURVE, so failing that curve empties the
// boundary and the native "< MINIMUM_TRIM_POINTS" guard rejects it anyway --
// a test built on it passes with or without the fix, which is worse than no
// test. Reaching the hazard needs an edge to fail while the REMAINING paired
// edges still supply three or more points.
const FIXTURE_FOUR_EDGE = 'data/issue-595-sphere-seam-partial-extraction.step'

// 48 x 24 parametric grid: two pole fans of 48, plus 22 rings of 2 x 48.
const SPHERE_GRID_TRIANGLES = 2208

let extraction: AP214GeometryExtraction
let model: AP214StepModel

/**
 * Parse a fixture and stand up extraction against it.
 *
 * @param path The fixture to load.
 */
async function load(path: string): Promise<void> {

  const conwayGeometry = new ConwayGeometry()

  await conwayGeometry.initialize()

  const parser = AP214StepParser.Instance
  const buffer = new ParsingBuffer(fs.readFileSync(path))

  parser.parseHeader(buffer)

  const [result, parsed] = parser.parseDataToModel(buffer)

  expect(result).toBe(ParseResult.COMPLETE)

  model = parsed as AP214StepModel
  model.nullOnErrors = true

  extraction = new AP214GeometryExtraction(conwayGeometry, model)
}


/**
 * Fail `extractCurve` for one CIRCLE entity, leaving every other curve alone.
 *
 * @param expressID The CIRCLE to fail.
 * @return {() => number} How many times the injection fired.
 */
function failCurve(expressID: number): () => number {

  const original = extraction.extractCurve.bind(extraction)
  let fired = 0

  extraction.extractCurve = function(curveEntity, ...rest: unknown[]) {

    if (curveEntity?.expressID === expressID) {
      ++fired
      return void 0
    }

    return (original as (...args: unknown[]) => unknown)(curveEntity, ...rest)
  } as typeof extraction.extractCurve

  return () => fired
}

/**
 * Drive the fixture's one ADVANCED_FACE directly.
 *
 * The fixture is a bare face and its reference closure - no product or shape
 * representation - so the whole-model walk never reaches it. Same approach as
 * the #594 thread-flank fixture test.
 */
function extractTheFace(): void {

  const faces = Array.from(model.types(advanced_face))

  // A zero here would mean the fixture stopped exercising the path, which
  // reads identically to a pass.
  expect(faces.length).toBe(1)

  for (const face of faces) {
    extraction.extractFaces([face], face.localID)
  }
}


/**
 * Triangles emitted for the fixture's single face, however it is meshed.
 *
 * @return {number} The total triangle count across every buffer geometry.
 */
function emittedTriangles(): number {

  let total = 0

  for (const mesh of model.geometry) {

    if (mesh.type === CanonicalMeshType.BUFFER_GEOMETRY) {
      total += mesh.geometry.getTriangleCount()
    }
  }

  return total
}


describe('a sphere bounded by a seam loop', () => {

  test('is recognised as full coverage and meshed as a closed sphere', async () => {

    await load(FIXTURE)
    extractTheFace()

    // Before bldrs-ai/conway#595 this face produced 0 triangles: the seam is
    // a meridian, so the dual-hemisphere unwrap split it into two pole-to-pole
    // arcs that enclose no area and both CDTs returned nothing.
    expect(emittedTriangles()).toBe(SPHERE_GRID_TRIANGLES)
  })

  test('the four-edge spelling is recognised too', async () => {

    // Establishes that the synthetic fixture actually reaches the seam path,
    // so the failure test below is measuring the injection and not a fixture
    // that never worked.
    await load(FIXTURE_FOUR_EDGE)
    extractTheFace()

    expect(emittedTriangles()).toBe(SPHERE_GRID_TRIANGLES)
  })

  test('does NOT become a sphere when one edge fails to extract', async () => {

    // codex's P1 on bldrs-ai/conway#609. The seam flag is read off the file's
    // `edge_list`, while the boundary is built from what extraction actually
    // produced. Force those apart: fail ONE of the loop's two edge curves, so
    // the loop still READS as a perfect retrace while the boundary it
    // describes no longer exists - and the surviving edge still supplies
    // enough points to clear the native minimum, which is precisely the state
    // that makes this dangerous rather than self-correcting.
    //
    // Flagging it here would replace a partial boundary with a whole sphere -
    // spurious volume and bounds, silently, since emitting triangles
    // suppresses the contributed-no-geometry warning. That is worse than the
    // extraction failure it masks, which at least leaves evidence.
    await load(FIXTURE_FOUR_EDGE)

    const fired = failCurve(900010)

    extractTheFace()

    // The injection has to have fired, or this test proves nothing - the
    // "a probe that never fires looks exactly like a clean model" rule.
    expect(fired()).toBeGreaterThan(0)

    expect(emittedTriangles()).not.toBe(SPHERE_GRID_TRIANGLES)
  })
})
