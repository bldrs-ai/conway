import fs from 'fs'
import { describe, expect, test, beforeAll } from '@jest/globals'
import { IfcGeometryExtraction } from './ifc_geometry_extraction'
import { ParseResult } from '../step/parsing/step_parser'
import IfcStepParser from './ifc_step_parser'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ConwayGeometry, ParamsGetIfcCircle, ParamsGetIfcTrimmedCurve,
  NativeTransform3x3, NativeTransform4x4 } from '../../dependencies/conway-geom'
import { ColorRGBA } from '../core/canonical_material'
import { ExtractResult } from '../core/shared_constants'


let conwayModel:IfcGeometryExtraction

/**
 *
 *
 * @return {Promise< boolean | ExtractResult | void >}
 */
async function initializeGeometryExtractor():
  Promise< boolean | ExtractResult | void > {
  const parser = IfcStepParser.Instance
  const indexIfcBuffer: Buffer = fs.readFileSync('data/index.ifc')
  const bufferInput = new ParsingBuffer(indexIfcBuffer)
  const result0 = parser.parseHeader(bufferInput)[1]

  if (result0 !== ParseResult.COMPLETE) {
    return ExtractResult.INCOMPLETE
  }

  const conwayGeometry: ConwayGeometry = new ConwayGeometry()
  const initializationStatus = await conwayGeometry.initialize()

  if (!initializationStatus) {
    return
  }

  const [, model] = parser.parseDataToModel( bufferInput)

  if (model === void 0) {
    return ExtractResult.INCOMPLETE
  }

  conwayModel = new IfcGeometryExtraction(conwayGeometry, model)

  return conwayModel.isInitialized()
}

/**
 *  @return {boolean} indicating whether the wasm module is initialized.
 */
function isInitialized(): boolean {
  return conwayModel.isInitialized()
}

/**
 * @return {ExtractResult} indicating whether the geometry extraction was successful.
 */
function extractGeometry(): ExtractResult {
  return conwayModel.extractIFCGeometryData()[0]
}

/**
 * @return {number} indicating number of meshes
 */
function getMeshSize(): number {
  return Array.from( conwayModel.scene.walk() ).length
}

/**
 * Get the materials from the model.
 *
 * @return {number} The number of materials in this.
 */
function getMaterialCount(): number {
  return conwayModel.materials.size
}

/**
 * Test if a material colour at a particular index matches a value.
 *
 * @param materialIndex
 * @param equal
 * @return {boolean} True if a match, false otherwise.
 */
function materialColorMatches(materialIndex: number, equal: ColorRGBA): boolean {
  return Array.from(
      conwayModel.materials.materials() )[ materialIndex ].
      baseColor.
      every((value, index) => equal[index] === value )
}

/**
 * @return {boolean} indicating if the geometry extraction module is still initialized or not
 */
function destroy(): boolean {
  conwayModel.destroy()
  return conwayModel.isInitialized()
}

beforeAll(async () => {

  await initializeGeometryExtractor()

})

describe('Ifc Geometry Extraction', () => {

  test('initialize()', () => {

    expect(isInitialized()).toBe(true)

  })

  test('extract()', () => {

    expect(extractGeometry()).toBe(ExtractResult.COMPLETE)

  })

  test('materialExtractionLength()', () => {
    const testParameter:number = 1
    expect(getMaterialCount()).toBe(testParameter)

  })

  test('materialColorMatches(0)', () => {
    // eslint-disable-next-line no-magic-numbers
    expect(materialColorMatches(0, [0.4, 0.8, 0, 1])).toBe(true)
  })

  test('geometryArrayLength()', () => {
    const testParameter:number = 7
    expect(getMeshSize()).toBe(testParameter)

  })

  test('destroy()', () => {
    expect(destroy()).toBe(false)
  })

})

describe('getIfcCircle 2D cartesian trim (test-models#20 driveway)', () => {

  // Pins conway-geom#... : a 2D IfcCircle trimmed by two distinct Cartesian
  // points (IfcTrimmingPreference.CARTESIAN, the case used by the
  // IFCCOMPOSITECURVE driveway boundary in ISSUE_126_model.ifc /
  // bldrs-ai/test-models#20) must tessellate the arc between those two
  // points, not collapse to the start point twice. Before the fix, the 2D
  // byPos branch of ConwayGeometryProcessor::getIfcCircle computed both
  // startDegrees and endDegrees from trim1Cartesian2D (a copy/paste of the
  // start-angle calculation), so any 2D Cartesian-trimmed circle produced a
  // zero-length arc regardless of trim2 — exactly what turned the
  // driveway's two IFCTRIMMEDCURVE/IFCCIRCLE segments into straight
  // 2-point stand-ins instead of curves.
  test('tessellates a quarter arc between two distinct trim points', async () => {
    const conwayGeometry: ConwayGeometry = new ConwayGeometry()
    const initializationStatus = await conwayGeometry.initialize()

    expect(initializationStatus).toBe(true)

    const radius = 100

    // Identity placement: circle centred at the origin, X/Y axes aligned.
    const axis2Placement2D =
      (new (conwayGeometry.wasmModule!.Glmdmat3)) as NativeTransform3x3
    const axis2Placement3D =
      (new (conwayGeometry.wasmModule!.Glmdmat4)) as NativeTransform4x4

    const paramsGetIfcTrimmedCurve: ParamsGetIfcTrimmedCurve = {
      masterRepresentation: 0, // IfcTrimmingPreference.CARTESIAN
      dimensions: 2,
      senseAgreement: true,
      // 0 degrees
      trim1Cartesian2D: { x: radius, y: 0 },
      trim1Cartesian3D: { x: 0, y: 0, z: 0 },
      trim1Double: 0,
      // 90 degrees — distinct from trim1, unlike the start point.
      trim2Cartesian2D: { x: 0, y: radius },
      trim2Cartesian3D: { x: 0, y: 0, z: 0 },
      trim2Double: 0,
      trimExists: true,
    }

    const parameters: ParamsGetIfcCircle = {
      dimensions: 2,
      axis2Placement2D,
      axis2Placement3D,
      radius,
      radius2: radius,
      paramsGetIfcTrimmedCurve,
      isEdge: false,
    }

    const curve = conwayGeometry.getIfcCircle(parameters)
    const pointCount = curve.getPointsSize()

    // A degenerate (zero-length) arc collapses to 2 duplicate points; a real
    // quarter-circle tessellation is many more than that.
    expect(pointCount).toBeGreaterThan(2)

    const start = curve.get2d(0)
    const end = curve.get2d(pointCount - 1)
    const precisionDigits = 6

    expect(start.x).toBeCloseTo(radius, precisionDigits)
    expect(start.y).toBeCloseTo(0, precisionDigits)
    expect(end.x).toBeCloseTo(0, precisionDigits)
    expect(end.y).toBeCloseTo(radius, precisionDigits)

    // A genuine arc bulges away from the chord between its endpoints; the
    // degenerate-arc bug left every intermediate point pinned to the start.
    const midpoint = curve.get2d(Math.floor(pointCount / 2))
    const distanceFromStart = Math.hypot(midpoint.x - start.x, midpoint.y - start.y)

    expect(distanceFromStart).toBeGreaterThan(radius / 4)

    conwayGeometry.destroy()
  })
})

describe('getIfcCircle 2D Cartesian trim on an eccentric ellipse (codex review, conway-geom#204)', () => {

  // getIfcCircle backs both IfcCircle (radius === radius2, always) and
  // IfcEllipse (radius !== radius2) extraction — see extractIfcEllipse's
  // call site. Once the driveway fix above (test-models#20) made the 2D
  // byPos start/end angles distinct, a second, latent bug in the same
  // branch became reachable: the angle was computed from each trim
  // point's raw POLAR angle, but the sampling loop below walks the
  // curve's PARAMETRIC angle t of (x, y) = (r1 cos t, r2 sin t). For a
  // circle (r1 === r2) those two angles coincide, so the driveway (and
  // every other Cartesian-trimmed IfcCircle) was unaffected. For an
  // eccentric ellipse they diverge — a trim point authored at parametric
  // 45 degrees on a 2:1 ellipse sits at polar angle ~26.6 degrees — so
  // the tessellation swept to the wrong angle and then jumped in a
  // visible kink to reach the trim point pinned as the curve's exact
  // last vertex. Mirrors conway-geom's existing getAP214Circle fix for
  // the equivalent AP214/STEP defect (test-models#45).
  test('sweeps to the parametric trim angle, not the polar angle', async () => {
    const conwayGeometry: ConwayGeometry = new ConwayGeometry()

    expect(await conwayGeometry.initialize()).toBe(true)

    const radius = 200 // semi-major
    const radius2 = 100 // semi-minor (2:1 ellipse)

    const axis2Placement2D =
      (new (conwayGeometry.wasmModule!.Glmdmat3)) as NativeTransform3x3
    const axis2Placement3D =
      (new (conwayGeometry.wasmModule!.Glmdmat4)) as NativeTransform4x4

    const degreesPerHalfTurn = 180
    const parametricDegreesToRadians = Math.PI / degreesPerHalfTurn
    const startParamDeg = 0
    const endParamDeg = 45

    // Cartesian points authored at PARAMETRIC angle, as an IFC exporter
    // would place them on the actual ellipse boundary.
    const trim1 = {
      x: radius * Math.cos(startParamDeg * parametricDegreesToRadians),
      y: radius2 * Math.sin(startParamDeg * parametricDegreesToRadians),
    }
    const trim2 = {
      x: radius * Math.cos(endParamDeg * parametricDegreesToRadians),
      y: radius2 * Math.sin(endParamDeg * parametricDegreesToRadians),
    }

    const paramsGetIfcTrimmedCurve: ParamsGetIfcTrimmedCurve = {
      masterRepresentation: 0, // IfcTrimmingPreference.CARTESIAN
      dimensions: 2,
      senseAgreement: true,
      trim1Cartesian2D: trim1,
      trim1Cartesian3D: { x: 0, y: 0, z: 0 },
      trim1Double: 0,
      trim2Cartesian2D: trim2,
      trim2Cartesian3D: { x: 0, y: 0, z: 0 },
      trim2Double: 0,
      trimExists: true,
    }

    const parameters: ParamsGetIfcCircle = {
      dimensions: 2,
      axis2Placement2D,
      axis2Placement3D,
      radius,
      radius2,
      paramsGetIfcTrimmedCurve,
      isEdge: false,
    }

    const curve = conwayGeometry.getIfcCircle(parameters)
    const pointCount = curve.getPointsSize()

    expect(pointCount).toBeGreaterThan(2)

    // The last point is always pinned exactly to trim2 (regardless of the
    // bug); the defect showed up as a visible kink in the second-to-last
    // point — swept to ~26.6 degrees (polar) instead of ~45 degrees
    // (parametric), roughly 48 units from trim2 instead of a few units.
    const last = curve.get2d(pointCount - 1)
    const secondToLast = curve.get2d(pointCount - 2)
    const kinkDistance = Math.hypot(secondToLast.x - last.x, secondToLast.y - last.y)

    expect(kinkDistance).toBeLessThan(radius / 10)

    // Every sampled point should lie on the ellipse itself.
    const onEllipseTolerance = 1e-6

    for (let index = 0; index < pointCount; ++index) {
      const point = curve.get2d(index)
      const normalizedX = point.x / radius
      const normalizedY = point.y / radius2
      const ellipseResidual = (normalizedX * normalizedX) + (normalizedY * normalizedY) - 1

      expect(Math.abs(ellipseResidual)).toBeLessThan(onEllipseTolerance)
    }

    conwayGeometry.destroy()
  })
})
