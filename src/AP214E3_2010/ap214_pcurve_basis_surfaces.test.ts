import fs from 'fs'
import { describe, expect, test, beforeAll } from '@jest/globals'
import { Vector3 } from '../../dependencies/conway-geom'
import { CurveObject } from '../../dependencies/conway-geom/interface/curve_object'
import { ConwayGeometry } from '../../dependencies/conway-geom'
import Logger, { LogEntry, LogLevel } from '../logging/logger'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ParseResult } from '../step/parsing/step_parser'
import { AP214GeometryExtraction } from './ap214_geometry_extraction'
import { pcurve } from './AP214E3_2010_gen'
import AP214StepParser from './ap214_step_parser'
import AP214StepModel from './ap214_step_model'


let extraction: AP214GeometryExtraction
let model: AP214StepModel

// Coordinates round-trip through the native curve at float precision (a
// CurveObject's get3d hands back ~1e-7 relative of what went in), so the
// checks here are geometric and to four decimal places rather than bit-exact.
const PRECISION_DIGITS = 4
const MONOTONIC_EPSILON = 1e-4

const CYLINDER_RADIUS = 25
const CYLINDER_TOP = 20
const CONE_ORIGIN_X = 5
const CONE_ORIGIN_Y = -3
const CONE_ORIGIN_Z = 50
const CONE_BASE_RADIUS = 10
const CONE_HEIGHT = 20
const CONE_SEMI_ANGLE = Math.PI / 6
const CONE_TOP_RADIUS = CONE_BASE_RADIUS + (CONE_HEIGHT * Math.tan(CONE_SEMI_ANGLE))
const SPHERE_RADIUS = 10
const SPHERE_HEIGHT = 5
const SPHERE_LATITUDE = Math.PI / 6
const SPHERE_RING_RADIUS = SPHERE_RADIUS * Math.cos(SPHERE_LATITUDE)
const TORUS_MAJOR_RADIUS = 20
const TORUS_MINOR_RADIUS = 5
const TORUS_OUTER = 25
const TORUS_INNER = 15
const PLANE_ORIGIN: Vector3 = { x: 1, y: 2, z: 3 }
const PLANE_END: Vector3 = { x: 5, y: 9, z: 3 }
const CURVE_3D_END_Y = 40
const PARAMETER_SAMPLES = 3

/**
 * Parse the fixture and set up geometry extraction.
 *
 * @return {Promise<boolean>} True if initialization succeeded.
 */
async function initialize(): Promise<boolean> {
  const parser = AP214StepParser.Instance
  const buffer: Buffer = fs.readFileSync('data/pcurve-basis-surfaces.step')
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
 * Find the fixture's pcurve carrying a given name.
 *
 * @param name The PCURVE's name attribute.
 * @return {pcurve} The matching pcurve.
 */
function pcurveNamed(name: string): pcurve {

  const found = Array.from(model.types(pcurve)).find((item) => item.name === name)

  expect(found).toBeDefined()

  return found!
}

/**
 * Extract a pcurve through extractCurve - the arm that dispatches to
 * extractPScurve1 - and read its points out.
 *
 * @param name The PCURVE's name attribute.
 * @return {Vector3[]} The extracted curve's points, empty if it was dropped.
 */
function extractedPoints(name: string): Vector3[] {

  const curve: CurveObject | undefined = extraction.extractCurve(pcurveNamed(name))

  if (curve === void 0) {
    return []
  }

  const points: Vector3[] = []

  for (let index = 0; index < curve.getPointsSize(); ++index) {
    points.push(curve.get3d(index))
  }

  return points
}

/**
 * Find a buffered warning containing a given fragment.
 *
 * @param fragment Text the message must contain.
 * @return {LogEntry | undefined} The matching entry.
 */
function warningContaining(fragment: string): LogEntry | undefined {

  return Logger.getLogs().find(
      (entry) => entry.level === 'warning' && entry.message.includes(fragment))
}

describe('AP214 pcurve basis surfaces (bldrs-ai/conway#505)', () => {

  beforeAll(async () => {

    Logger.clearLogs()

    // The b-spline basis surface warns by design below, and the echo would be
    // noise in the test console. The buffer these tests read is filled
    // regardless of the console threshold.
    const threshold = Logger.getLogLevel()

    Logger.setLogLevel(LogLevel.OFF)

    try {

      expect(await initialize()).toBe(true)

    } finally {

      Logger.setLogLevel(threshold)
    }
  })

  // (u, v) walks a straight line from (0, 0) to (pi, 20): a half turn of the
  // cylinder while climbing its full height, which is a helix arc and not the
  // chord across it.
  test('a cylindrical basis surface maps (u, v) onto the cylinder', () => {

    const points = extractedPoints('cylinder')

    // More points than the parameter curve has: the angular span is
    // subdivided rather than chorded across.
    expect(points.length).toBeGreaterThan(PARAMETER_SAMPLES)

    let previousZ = -Infinity

    for (const point of points) {

      expect(Math.sqrt((point.x * point.x) + (point.y * point.y)))
          .toBeCloseTo(CYLINDER_RADIUS, PRECISION_DIGITS)

      // v maps to height along the axis, so it climbs with the parameter.
      expect(point.z).toBeGreaterThanOrEqual(previousZ - MONOTONIC_EPSILON)

      previousZ = point.z
    }

    const first = points[0]
    const last = points[points.length - 1]

    expect(first.x).toBeCloseTo(CYLINDER_RADIUS, PRECISION_DIGITS)
    expect(first.y).toBeCloseTo(0, PRECISION_DIGITS)
    expect(first.z).toBeCloseTo(0, PRECISION_DIGITS)

    expect(last.x).toBeCloseTo(-CYLINDER_RADIUS, PRECISION_DIGITS)
    expect(last.y).toBeCloseTo(0, PRECISION_DIGITS)
    expect(last.z).toBeCloseTo(CYLINDER_TOP, PRECISION_DIGITS)
  })

  // A generator line at u = 0 on a cone whose placement is offset and turned a
  // quarter turn about z, so the local frame has to be applied for the mapped
  // points to land: local +x is world +y here.
  //
  // This also pins the cone's v convention, the point a review of this code
  // queried (bldrs-ai/conway#520): ISO 10303-42 measures v along the axis, so
  // the far end is a ring of 10 + 20 tan(30 deg) = 21.547005 at an axial 20,
  // landing at (5, 18.547005, 70). Were v distance along the generator, the
  // same (0, 20) would give a ring of 10 + 20 sin(30 deg) = 20 at an axial
  // 20 cos(30 deg), i.e. (5, 17, 67.320508), and both of the assertions on
  // `last` below would fail.
  test('a conical basis surface applies the taper and the placement frame', () => {

    const points = extractedPoints('cone')

    expect(points.length).toBeGreaterThan(1)

    const first = points[0]
    const last = points[points.length - 1]

    expect(first.x).toBeCloseTo(CONE_ORIGIN_X, PRECISION_DIGITS)
    expect(first.y).toBeCloseTo(CONE_ORIGIN_Y + CONE_BASE_RADIUS, PRECISION_DIGITS)
    expect(first.z).toBeCloseTo(CONE_ORIGIN_Z, PRECISION_DIGITS)

    // Radius at the far end is base + height * tan(30 degrees).
    expect(last.x).toBeCloseTo(CONE_ORIGIN_X, PRECISION_DIGITS)
    expect(last.y).toBeCloseTo(CONE_ORIGIN_Y + CONE_TOP_RADIUS, PRECISION_DIGITS)
    expect(last.z).toBeCloseTo(CONE_ORIGIN_Z + CONE_HEIGHT, PRECISION_DIGITS)
  })

  // u sweeps a quarter turn at a fixed latitude of 30 degrees.
  test('a spherical basis surface maps latitude to height', () => {

    const points = extractedPoints('sphere')

    expect(points.length).toBeGreaterThan(2)

    for (const point of points) {

      expect(Math.sqrt(
          (point.x * point.x) + (point.y * point.y) + (point.z * point.z)))
          .toBeCloseTo(SPHERE_RADIUS, PRECISION_DIGITS)

      expect(point.z).toBeCloseTo(SPHERE_HEIGHT, PRECISION_DIGITS)
    }

    const first = points[0]
    const last = points[points.length - 1]

    expect(first.x).toBeCloseTo(SPHERE_RING_RADIUS, PRECISION_DIGITS)
    expect(first.y).toBeCloseTo(0, PRECISION_DIGITS)

    expect(last.x).toBeCloseTo(0, PRECISION_DIGITS)
    expect(last.y).toBeCloseTo(SPHERE_RING_RADIUS, PRECISION_DIGITS)
  })

  // v walks half way around the tube at a fixed u, from the outer equator to
  // the inner one.
  test('a toroidal basis surface maps the tube angle', () => {

    const points = extractedPoints('torus')

    expect(points.length).toBeGreaterThan(2)

    for (const point of points) {

      const planar = Math.sqrt((point.x * point.x) + (point.y * point.y))
      const fromTubeCentre = Math.sqrt(
          ((planar - TORUS_MAJOR_RADIUS) * (planar - TORUS_MAJOR_RADIUS)) +
          (point.z * point.z))

      expect(fromTubeCentre).toBeCloseTo(TORUS_MINOR_RADIUS, PRECISION_DIGITS)
    }

    const first = points[0]
    const last = points[points.length - 1]

    expect(first.x).toBeCloseTo(TORUS_OUTER, PRECISION_DIGITS)
    expect(first.z).toBeCloseTo(0, PRECISION_DIGITS)

    expect(last.x).toBeCloseTo(TORUS_INNER, PRECISION_DIGITS)
    expect(last.z).toBeCloseTo(0, PRECISION_DIGITS)
  })

  // The planar case the extractor already claimed to support: (u, v) are
  // distances along the placement's x and y axes, so the parameter curve's
  // (4, 7) lands 4 and 7 from an origin at (1, 2, 3).
  test('a planar basis surface maps (u, v) along the placement axes', () => {

    const points = extractedPoints('plane')

    expect(points.length).toBe(2)

    expect(points[0].x).toBeCloseTo(PLANE_ORIGIN.x, PRECISION_DIGITS)
    expect(points[0].y).toBeCloseTo(PLANE_ORIGIN.y, PRECISION_DIGITS)
    expect(points[0].z).toBeCloseTo(PLANE_ORIGIN.z, PRECISION_DIGITS)

    expect(points[1].x).toBeCloseTo(PLANE_END.x, PRECISION_DIGITS)
    expect(points[1].y).toBeCloseTo(PLANE_END.y, PRECISION_DIGITS)
    expect(points[1].z).toBeCloseTo(PLANE_END.z, PRECISION_DIGITS)
  })

  // The residue: dropped, but under a message that names the basis surface so
  // the family can be sized per type rather than as one undifferentiated row.
  test('an unsupported basis surface is dropped with its type named', () => {

    expect(extractedPoints('bspline').length).toBe(0)

    const warning = warningContaining('Unsupported PCURVE basis surface')

    expect(warning).toBeDefined()
    expect(warning!.message).toContain('B_SPLINE_SURFACE_WITH_KNOTS')
    expect(warning!.expressIDs.has(
        String(pcurveNamed('bspline').expressID))).toBe(true)
  })

  // The pcurve here is one variant of a complex instance that also carries a
  // SURFACE_CURVE; its curve_3d runs +y from (25, 0, 0), which the pcurve's
  // own parameter curve (a helix on the cylinder) never touches.
  test('an explicit curve_3d on the same instance beats the mapping', () => {

    const points = extractedPoints('complex')

    expect(points.length).toBe(2)

    expect(points[0].x).toBeCloseTo(CYLINDER_RADIUS, PRECISION_DIGITS)
    expect(points[0].y).toBeCloseTo(0, PRECISION_DIGITS)
    expect(points[0].z).toBeCloseTo(0, PRECISION_DIGITS)

    expect(points[1].x).toBeCloseTo(CYLINDER_RADIUS, PRECISION_DIGITS)
    expect(points[1].y).toBeCloseTo(CURVE_3D_END_Y, PRECISION_DIGITS)
    expect(points[1].z).toBeCloseTo(0, PRECISION_DIGITS)
  })
})
