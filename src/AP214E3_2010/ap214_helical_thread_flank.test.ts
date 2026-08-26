import fs from 'fs'
import { describe, expect, test, beforeAll } from '@jest/globals'
import { AP214GeometryExtraction } from './ap214_geometry_extraction'
import { advanced_face, b_spline_curve, edge_curve } from './AP214E3_2010_gen'
import { ParseResult } from '../step/parsing/step_parser'
import AP214StepParser from './ap214_step_parser'
import AP214StepModel from './ap214_step_model'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ConwayGeometry } from '../../dependencies/conway-geom'

/* eslint-disable no-magic-numbers -- the two ADVANCED_FACE express IDs, the
   degeneracy epsilon and the sagitta threshold are all quantities of this
   fixture rather than of the code under test; naming them would move the
   evidence away from the assertion that rests on it. */


let extraction: AP214GeometryExtraction
let model: AP214StepModel

/**
 * Parse the fixture and set up geometry extraction.
 *
 * @return {Promise<boolean>} True if initialization succeeded.
 */
async function initialize(): Promise<boolean> {
  const parser = AP214StepParser.Instance
  const buffer: Buffer = fs.readFileSync('data/issue-594-helical-thread-flank.step')
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

/**
 * Largest distance from any point of a polyline to the straight line through
 * its two endpoints.
 *
 * This is the quantity that separates an arc from the chord across it, and it
 * is what the defect destroyed: a collapsed extraction returns the two
 * endpoints and nothing between, so its sagitta is exactly zero.
 *
 * @param points The polyline, in order.
 * @return {number} The sagitta, in model units.
 */
function sagitta(points: { x: number, y: number, z: number }[]): number {

  const first = points[0]
  const last = points[points.length - 1]

  const axis = { x: last.x - first.x, y: last.y - first.y, z: last.z - first.z }
  const axisLength = Math.hypot(axis.x, axis.y, axis.z)

  if (axisLength < 1e-12) {
    return 0
  }

  let worst = 0

  for (const point of points) {

    const delta = {
      x: point.x - first.x,
      y: point.y - first.y,
      z: point.z - first.z,
    }

    const along =
      (delta.x * axis.x + delta.y * axis.y + delta.z * axis.z) /
      (axisLength * axisLength)

    worst = Math.max(worst, Math.hypot(
        delta.x - along * axis.x,
        delta.y - along * axis.y,
        delta.z - along * axis.z))
  }

  return worst
}

describe('AP214 helical thread flank on a cylinder (bldrs-ai/conway#594)', () => {

  beforeAll(async () => {
    expect(await initialize()).toBe(true)
  })

  // Two ADVANCED_FACEs lifted out of `Orbiter_v1.1_Gear_7.5.step`
  // (bldrs-ai/test-models-private#93): #50698, a thread flank on a r=1.5
  // cylinder whose bound is two full-turn B-spline helices and two lines, and
  // #50632 from the same thread, which fails less badly because only one of
  // its two helices collapsed.
  //
  // What makes them a regression case is the knot vectors, not the shape: the
  // four helices carry knot domains of [-1.418, -0.473], [-14.068, -13.122],
  // [59.691, 65.974] and [-72.256, -65.974]. getBSplineCurve used to search
  // for a cartesian trim over the raw knot values clamped into [0, 1], while
  // the interpolator it was searching takes a normalised parameter — so every
  // one of these domains collapsed to a single point and the edge came back as
  // its two endpoints.
  const HELICAL_FACES = [50698, 50632]

  test('a B-spline edge is extracted as an arc, not as the chord across it', () => {

    const faces = Array.from(model.types(advanced_face))

    for (const face of faces) {
      extraction.extractFaces([face], face.localID)
    }

    const bsplineEdges =
      Array.from(model.types(edge_curve))
          .filter((edge) => edge.edge_geometry instanceof b_spline_curve)

    // Four helices across the two faces. A zero here would mean the fixture
    // stopped exercising the path, which reads identically to a pass.
    expect(bsplineEdges.length).toBe(4)

    for (const edge of bsplineEdges) {

      const curveObject = extraction.curves.get(edge.localID)

      expect(curveObject).toBeDefined()

      const points = []

      for (let index = 0; index < curveObject!.getPointsSize(); ++index) {

        const point = curveObject!.get3d(index)

        points.push({ x: point.x, y: point.y, z: point.z })
      }

      // Each of these is a full turn of a thread on a 1.5mm-radius cylinder,
      // so an honestly sampled arc bows ~1.5mm off its own chord (up to 3mm,
      // depending where the endpoints fall). The chord the defect produced
      // scores 0. 0.5mm is well clear of both.
      expect(sagitta(points)).toBeGreaterThan(0.5)
    }
  })

  test('a face whose helical edges both collapsed produces geometry', () => {

    for (const expressID of HELICAL_FACES) {

      const face = model.getElementByExpressID(expressID)

      expect(face).toBeInstanceOf(advanced_face)

      const mesh = model.geometry.getByLocalID(face!.localID)

      expect(mesh).toBeDefined()
      expect(mesh!.geometry.getTriangleCount()).toBeGreaterThan(0)
    }
  })
})
