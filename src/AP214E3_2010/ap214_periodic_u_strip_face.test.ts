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

/** The periodic-strip face under test. */
const STRIP_FACE = 19218

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

const emitted: number[][] = []
let triangleCount = 0


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

    if (from.expressID !== STRIP_FACE) {
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

    for (let where = 0; where < floatCount; where += 6) {
      emitted.push([data[where], data[where + 1], data[where + 2]])
    }

    triangleCount = isolated.GetIndexDataSize() / 3
  }

  try {
    expect(extraction.extractAP214GeometryData()[0]).toBe(ExtractResult.COMPLETE)
  } finally {
    AP214GeometryExtraction.prototype.extractAdvancedFace = original
  }
})


describe('a b-spline face whose boundary wraps the surface\'s u closure', () => {

  test('the face under test was reached at all', () => {

    // Without this a renamed express ID, a fixture that stopped loading, or a
    // staged-face run would leave every assertion below vacuously true.
    expect(emitted.length).toBeGreaterThan(0)
  })

  test('every one of its four trim loops reaches the emitted geometry', () => {

    const missing = BOUND_VERTICES.filter((wanted) =>
      !emitted.some((each) =>
        Math.abs(each[0] - wanted[0]) <= POSITION_TOLERANCE &&
        Math.abs(each[1] - wanted[1]) <= POSITION_TOLERANCE &&
        Math.abs(each[2] - wanted[2]) <= POSITION_TOLERANCE))

    expect(missing).toStrictEqual([])
  })

  test('it emits at least as many triangles as its boundary demands', () => {

    // A polygon with N boundary points and h holes ear-clips into N + 2h - 2
    // triangles - each hole costs two bridge vertices - and refinement only
    // adds to that. #19218's rings are 65 + 65 + 65 + 61 points with three of
    // them holes, so 256 + 6 - 2. Dropping the three unbridgeable rings left
    // 190, i.e. fewer triangles than the outer ring alone has points.
    expect(triangleCount).toBeGreaterThanOrEqual(260)
  })
})
