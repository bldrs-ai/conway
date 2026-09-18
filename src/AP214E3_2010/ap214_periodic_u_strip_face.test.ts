import fs from 'fs'
import { describe, expect, test, beforeAll } from '@jest/globals'
import { AP214GeometryExtraction } from './ap214_geometry_extraction'
import { ParseResult } from '../step/parsing/step_parser'
import AP214StepParser from './ap214_step_parser'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ConwayGeometry, GeometryObject } from '../../dependencies/conway-geom'
import { ExtractResult } from '../core/shared_constants'
import { advanced_face } from './AP214E3_2010_gen'

/* eslint-disable no-magic-numbers -- the reified vertex layout (6 floats) and
   the fixture's own express IDs and coordinates read more clearly as literals
   than as names. */

/**
 * `Proximal_Shell` of Pollen Robotics' AmazingHand, cut out of
 * `Right_Hand.step` (Onshape AP242, metre units) down to the one part -
 * bldrs-ai/test-models#65.
 *
 * `ADVANCED_FACE #19218` of that shell sits on `B_SPLINE_SURFACE_WITH_KNOTS
 * #161`, which the file declares `u_closed = .T.`, and it is bounded by FOUR
 * loops: two rims that each go all the way round the closure, and two circular
 * holes. Projected into the chart, a rim comes back as a u-monotone chain
 * spanning one period with a single modular jump in it - a sliver as a plane
 * polygon - and the other three rings then lie OUTSIDE that sliver.
 * mapbox::earcut drops a hole whose leftward ray meets no segment of ring 0
 * (`findHoleBridge` returns null and `eliminateHole` links nothing), silently,
 * so the face was emitted from ring 0's 65 points alone and the other 191 never
 * appeared in any triangle.
 *
 * This pins tryPeriodicUStrip, which cuts the chart open and hands earcut one
 * simple polygon instead. Reverting mesh_utils.h takes the face from 3180
 * triangles to 190 and leaves three of the four loop vertices below absent,
 * which is what makes this test able to fail.
 */
const FIXTURE = 'data/ap242-periodic-u-strip-face.step'

/** The periodic-strip face the fixture was cut for. */
const STRIP_FACE = 19218

/**
 * The other periodic face of the same shell, whose ring 1 is a hole that
 * STRADDLES THE SEAM - bldrs-ai/conway#709 and #710.
 *
 * `#19215` sits on `B_SPLINE_SURFACE_WITH_KNOTS #160`, which spells its closure
 * in the PERIODIC form: the first three control rows repeat as the last three,
 * so rows 0 and n-1 are 2.33mm apart and the clamped row-against-row closure
 * test read the surface as OPEN. The inverse solve therefore clamped u at the
 * domain floor instead of wrapping it, and 27 of that hole's 53 points came
 * back at u = 0.000000 exactly - the whole far half of the hole collapsed onto
 * the domain edge. The strip was then refused and earcut dropped both holes:
 * the face emitted 358 triangles from 213 of its 327 boundary points.
 */
const SEAM_HOLE_FACE = 19215

/**
 * The topological vertex of each of `#19218`'s four bounds, straight out of the
 * fixture: `FACE_BOUND #17481..#17484` -> `EDGE_LOOP #15912..#15915` -> the one
 * closed `EDGE_CURVE` each -> `VERTEX_POINT #13446..#13449`, in metres.
 *
 * One point per ring is all this needs to assert: a ring earcut dropped
 * contributes no index at all, so not one of its points reaches the geometry.
 */
const BOUND_VERTICES = [
  [0.0112096753197897, 0.03, 0.007],
  [-0.0117789128537097, 0.03, 0.001],
  [0.0, 0.0515, 0.014029461467998],
  [0.0, 0.008, 0.0125],
]

/**
 * Slack when matching a file coordinate against an emitted vertex, in metres.
 *
 * Sized for float32 storage of a ~50mm part (a relative 2^-24 is ~3e-9 there),
 * not for anything geometric: a ring that was dropped is absent by millimetres,
 * so nothing here is close to borderline.
 */
const POSITION_TOLERANCE = 1e-6

/** Emitted vertex positions per isolated face, keyed by express ID. */
const emitted = new Map< number, number[][] >()

/** Emitted triangle count per isolated face, likewise. */
const triangles = new Map< number, number >()


beforeAll(async () => {

  const conwayGeometry = new ConwayGeometry()

  await conwayGeometry.initialize()

  const parser = AP214StepParser.Instance
  const buffer = new ParsingBuffer(fs.readFileSync(FIXTURE))

  expect(parser.parseHeader(buffer)[1]).toBe(ParseResult.COMPLETE)

  const [, model] = parser.parseDataToModel(buffer)

  expect(model).not.toBe(void 0)

  // The isolation below wraps extractAdvancedFace, which the staged (deferred)
  // path does not run per face - it batches the work into a later flush, where
  // the per-face geometry this test reads no longer exists on its own. The flag
  // is read once, in the constructor, and put back immediately: jest reuses a
  // worker process across suites, so leaving it set would silently take every
  // later suite in this worker off the staged path too.
  const staged = process.env.CONWAY_DISABLE_STAGED_FACES

  process.env.CONWAY_DISABLE_STAGED_FACES = '1'

  const extraction = new AP214GeometryExtraction(conwayGeometry, model!)

  if (staged === void 0) {
    delete process.env.CONWAY_DISABLE_STAGED_FACES
  } else {
    process.env.CONWAY_DISABLE_STAGED_FACES = staged
  }

  // Route the one face under test into a geometry of its own before appending
  // it, so what it contributed can be read apart from its neighbours'. That
  // matters here: both of #19218's holes are shared edges with the cylindrical
  // faces that fill them, so those points are in the SHELL either way and only
  // the per-face view can tell a dropped ring from a present one.
  const original = AP214GeometryExtraction.prototype.extractAdvancedFace

  const wasm =
    conwayGeometry as unknown as {
      wasmModule: { HEAPF32: Float32Array, IfcGeometry: new () => GeometryObject }
    }

  AP214GeometryExtraction.prototype.extractAdvancedFace = function(
      from: advanced_face,
      geometry: GeometryObject,
      parentLocalID?: number ) {

    if (from.expressID !== STRIP_FACE && from.expressID !== SEAM_HOLE_FACE) {
      original.call(this, from, geometry, parentLocalID)
      return
    }

    const isolated = new wasm.wasmModule.IfcGeometry()

    original.call(this, from, isolated, parentLocalID)

    geometry.appendGeometry(isolated)

    isolated.reify({x: 0, y: 0, z: 0})

    const floatCount = isolated.GetVertexDataSize()

    // Copied out of the heap immediately: a held HEAPF32 view detaches when the
    // wasm heap grows and then reads zeroes.
    const data = wasm.wasmModule.HEAPF32.slice(
        isolated.GetVertexData() / 4,
        (isolated.GetVertexData() / 4) + floatCount)

    const positions: number[][] = []

    for (let where = 0; where < floatCount; where += 6) {
      positions.push([data[where], data[where + 1], data[where + 2]])
    }

    emitted.set(from.expressID, positions)
    triangles.set(from.expressID, isolated.GetIndexDataSize() / 3)
  }

  try {
    expect(extraction.extractAP214GeometryData()[0]).toBe(ExtractResult.COMPLETE)
  } finally {
    AP214GeometryExtraction.prototype.extractAdvancedFace = original
  }
})


describe('a b-spline face whose boundary wraps the surface\'s u closure', () => {

  test('the face under test was reached at all', () => {

    // NOT a vacuity guard, and it would be dishonest to call it one: if the
    // wrapper never fires, the two assertions below fail on their own - all
    // four BOUND_VERTICES come back missing and the triangle count is 0.
    //
    // What this one adds is WHICH of the two things went wrong, because they
    // want opposite responses. A renamed express ID, a fixture that stopped
    // loading, or a run that took the staged-face path is a broken test and
    // the triangulator is fine; a face that was reached and came back short of
    // its boundary is the defect this file exists for. Telling those apart is
    // the distinction the investigation behind this fixture needed twice, and
    // it cost two wrong diagnoses to learn. Raised by review on
    // bldrs-ai/conway#711.
    expect(emitted.get(STRIP_FACE)?.length ?? 0).toBeGreaterThan(0)
  })

  test('every one of its four trim loops reaches the emitted geometry', () => {

    const missing = BOUND_VERTICES.filter((wanted) =>
      !(emitted.get(STRIP_FACE) ?? []).some((each) =>
        Math.abs(each[0] - wanted[0]) <= POSITION_TOLERANCE &&
        Math.abs(each[1] - wanted[1]) <= POSITION_TOLERANCE &&
        Math.abs(each[2] - wanted[2]) <= POSITION_TOLERANCE))

    expect(missing).toStrictEqual([])
  })

  test('it emits at least as many triangles as its boundary demands', () => {

    // A polygon with V boundary VERTICES and h holes triangulates into exactly
    // V + 2h - 2 triangles when it adds no interior point, and into more when
    // it does. Both numbers have to be counted carefully here, and an earlier
    // reading of this bound got both wrong (review, bldrs-ai/conway#711):
    //
    //   V is 252, not 256. #19218's four rings are 65 + 65 + 65 + 61 POINTS,
    //   but every one of them REPEATS ITS FIRST POINT AS ITS LAST - measured
    //   off the curves as they are handed to native, head and tail are the
    //   same point at a 3D gap of exactly zero - so they carry 64 + 64 + 64 +
    //   60 distinct vertices.
    //
    //   h is 2, not 3. The periodic-strip cut joins the two RIMS into a single
    //   outer ring, which leaves the two circular holes.
    //
    // So the floor is 252 + 4 - 2 = 254, and it is a floor on the topology
    // rather than a target: this face emits 3180, because the surface
    // refinement subdivides what earcut clips. What the assertion has to
    // separate is that from the 190 the unfixed header emits - fewer triangles
    // than the outer ring alone has points - and any bound at or under 254
    // does that without being able to reject a valid minimal tessellation.
    expect(triangles.get(STRIP_FACE) ?? 0).toBeGreaterThanOrEqual(254)
  })
})

/**
 * The topological vertex of each of `#19215`'s three bounds, straight out of
 * the fixture: `FACE_BOUND #17475..#17477` -> `EDGE_LOOP #15906..#15908` ->
 * the first `EDGE_CURVE` of each -> its start `VERTEX_POINT`, in metres.
 *
 * `#15906` is the four-edge slot hole that straddles the seam (53 points),
 * `#15907` the one-edge circular hole (61), `#15908` the eight-edge outer rim
 * (213). One point per ring is all this needs: a ring earcut dropped
 * contributes no index at all, so not one of its points reaches the geometry.
 */
const SEAM_HOLE_BOUND_VERTICES = [
  [-0.004, 0.0135598252486046, 0.011673925254519],
  [-8.13151629364128e-20, 0.00801397189192832, 0.0114935408121511],
  [0.0107434876397606, 0.0349638694583991, 0.00459999999997733],
]


describe('a b-spline face whose hole straddles the seam', () => {

  test('the face under test was reached at all', () => {

    // Same distinction the sibling suite draws, and for the same reason: a
    // wrapper that never fired and a face that came back short of its boundary
    // want opposite responses.
    expect(emitted.get(SEAM_HOLE_FACE)?.length ?? 0).toBeGreaterThan(0)
  })

  test('every one of its three trim loops reaches the emitted geometry', () => {

    // Before the closure fixes this came back with ONE of the three present -
    // the outer rim - because the seam-straddling hole was clamped flat onto
    // the domain edge, the strip was refused, and earcut dropped both holes.
    const missing = SEAM_HOLE_BOUND_VERTICES.filter((wanted) =>
      !(emitted.get(SEAM_HOLE_FACE) ?? []).some((each) =>
        Math.abs(each[0] - wanted[0]) <= POSITION_TOLERANCE &&
        Math.abs(each[1] - wanted[1]) <= POSITION_TOLERANCE &&
        Math.abs(each[2] - wanted[2]) <= POSITION_TOLERANCE))

    expect(missing).toStrictEqual([])
  })
})
