import fs from 'fs'
import { describe, expect, test, beforeAll } from '@jest/globals'
import { AP214GeometryExtraction } from './ap214_geometry_extraction'
import { advanced_face, b_spline_curve, edge_curve } from './AP214E3_2010_gen'
import { ParseResult } from '../step/parsing/step_parser'
import AP214StepParser from './ap214_step_parser'
import AP214StepModel from './ap214_step_model'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ConwayGeometry } from '../../dependencies/conway-geom'

/* eslint-disable no-magic-numbers -- the edge's express ID and the two
   tolerances are quantities of this fixture rather than of the code under
   test; naming them would move the evidence away from the assertions that
   rest on it. */

let extraction: AP214GeometryExtraction
let model: AP214StepModel

/**
 * Parse the fixture and set up geometry extraction.
 *
 * @return {Promise<boolean>} True if initialization succeeded.
 */
async function initialize(): Promise<boolean> {
  const parser = AP214StepParser.Instance
  const buffer: Buffer = fs.readFileSync('data/issue-599-trim-turn-selection.step')
  const bufferInput = new ParsingBuffer(buffer)

  if (parser.parseHeader(bufferInput)[1] !== ParseResult.COMPLETE) {
    return false
  }

  const conwayGeometry = new ConwayGeometry()

  if (!(await conwayGeometry.initialize())) {
    return false
  }

  const [, parsedModel] = parser.parseDataToModel(bufferInput)

  if (parsedModel === void 0) {
    return false
  }

  model = parsedModel
  extraction = new AP214GeometryExtraction(conwayGeometry, model)

  return extraction.isInitialized()
}

describe('AP214 cartesian trim lands on the right part of the curve (conway#599)', () => {

  beforeAll(async () => {
    expect(await initialize()).toBe(true)
  })

  // One PLANE face lifted out of `Orbiter_v1.1_Gear_7.5.step`
  // (bldrs-ai/test-models-private#93). A plane, deliberately: the face's own
  // triangulation is trivial, so what this fixture exercises is the boundary
  // *curve* extraction and nothing else.
  //
  // Its edge #28822 runs on `B_SPLINE_CURVE_WITH_KNOTS` #3202 between two
  // vertices at z = -2.6868 and z = 1.7123. The trim is cartesian, so
  // getBSplineCurve bisects for the parameter nearest each vertex.
  //
  // The companion test `ap214_helical_thread_flank.test.ts` pins that the
  // result is an ARC rather than a chord. This one pins WHICH arc, which is a
  // separate failure and was a live one: the tEnd bisection declared its
  // difference vector as a glm::dvec2 while interpolating in 3D, so it
  // minimised XY distance alone. On a helical curve the XY projection is a
  // circle walked once per turn — every turn scores ~0 and the solve returns
  // an arbitrary one. Nothing downstream notices: a wrong arc is still an arc,
  // hashes like one in the digest, and raises no error.
  const HELICAL_EDGE = 28822

  test('an arc\'s samples are centred on the span between its own endpoints', () => {

    const faces = Array.from(model.types(advanced_face))

    for (const face of faces) {
      extraction.extractFaces([face], face.localID)
    }

    const edge =
      Array.from(model.types(edge_curve))
          .find((candidate) => candidate.expressID === HELICAL_EDGE)

    expect(edge).toBeDefined()
    expect(edge!.edge_geometry).toBeInstanceOf(b_spline_curve)

    const curveObject = extraction.curves.get(edge!.localID)

    expect(curveObject).toBeDefined()

    const heights = []

    for (let index = 0; index < curveObject!.getPointsSize(); ++index) {
      heights.push(curveObject!.get3d(index).z)
    }

    // A 2-point chord would pass the centring check trivially (its mean IS the
    // midpoint of its ends), so rule that out first. Deliberately just ">2"
    // rather than a real sampling floor: the point of this test is the
    // centring assertion below, and a count threshold tight enough to catch
    // the defect on its own would mask which property actually failed.
    expect(heights.length).toBeGreaterThan(2)

    const first = heights[0]
    const last = heights[heights.length - 1]

    // getBSplineCurve substitutes the exact trim vertices for the first and
    // last points, so the ENDS are right whichever parameters the bisection
    // returned. Only the interior carries the evidence — which is why this
    // compares the sample mean against the midpoint of the ends rather than
    // checking the extent.
    const mean = heights.reduce((total, height) => total + height, 0) / heights.length
    const endpointMidpoint = (first + last) / 2
    const span = Math.abs(last - first)

    expect(span).toBeGreaterThan(1)

    // z varies monotonically along this arc, so points sampled across it have a
    // mean close to the midpoint of its ends. When the solve resolves to the
    // wrong part of the curve the interior points come from elsewhere and drag
    // the mean off. Measured, as a fraction of the span:
    //
    //   0.3098  on main today
    //   0.2801  with the normalised-parameter fix but the dvec2 tEnd
    //   0.0220  with both
    //
    // 0.10 sits with a 4.5x margin below the passing value and a 2.8x margin
    // above the failing ones.
    expect(Math.abs(mean - endpointMidpoint) / span).toBeLessThan(0.10)
  })
})
