import fs from 'fs'
import { describe, expect, test, beforeAll } from '@jest/globals'
import { AP214GeometryExtraction } from './ap214_geometry_extraction'
import { ParseResult } from '../step/parsing/step_parser'
import IfcStepParser from './ap214_step_parser'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ConwayGeometry, GeometryObject } from '../../dependencies/conway-geom'
import { ExtractResult } from '../core/shared_constants'


let conwayTubeModel:AP214GeometryExtraction
let conwayGearModel:AP214GeometryExtraction

/**
 * Initialise geometry extraction
 *
 * @return {Promise< ExtractResult | boolean | void >} A promise with the result.
 */
async function initializeGeometryExtractor():
 Promise< ExtractResult | boolean | void > {
  const parser = IfcStepParser.Instance
  const tubeBuffer: Buffer =
    fs.readFileSync('data/create-a-tube.step')
  const gearBuffer: Buffer =
    fs.readFileSync('data/a-gear-with-3-inch-diameter-and-20-curved-teeth.step')
  const tubeBufferInput = new ParsingBuffer(tubeBuffer)
  const gearBufferInput = new ParsingBuffer(gearBuffer)
  const result0 = parser.parseHeader(tubeBufferInput)[1]
  const result1 = parser.parseHeader(gearBufferInput)[1]

  if (result0 !== ParseResult.COMPLETE || result1 !== ParseResult.COMPLETE) {
    return ExtractResult.INCOMPLETE
  }

  const conwayGeometryTube: ConwayGeometry = new ConwayGeometry()
  const conwayGeometryGear: ConwayGeometry = new ConwayGeometry()
  let initializationStatus = await conwayGeometryTube.initialize()

  initializationStatus &&= await conwayGeometryGear.initialize()

  if (!initializationStatus) {
    return
  }

  const [, model0] = parser.parseDataToModel( tubeBufferInput )
  const [, model1] = parser.parseDataToModel( gearBufferInput )

  if (model0 === void 0 || model1 === void 0) {
    return ExtractResult.INCOMPLETE
  }

  conwayTubeModel = new AP214GeometryExtraction( conwayGeometryTube, model0 )
  conwayGearModel = new AP214GeometryExtraction( conwayGeometryGear, model1 )

  const tubeModelResult = conwayTubeModel.isInitialized()
  const gearModelResult = conwayGearModel.isInitialized()

  return tubeModelResult && gearModelResult
}

/**
 *  @return {boolean} indicating whether the wasm module is initialized.
 */
function isInitialized(): boolean {
  return conwayTubeModel.isInitialized() &&
    conwayGearModel.isInitialized()
}

/**
 * @return {ExtractResult} indicating whether the geometry extraction was successful.
 */
function extractTubeGeometry(): ExtractResult {
  return conwayTubeModel.extractAP214GeometryData()[0]
}

/**
 * @return {ExtractResult} indicating whether the geometry extraction was successful.
 */
function extractGearGeometry(): ExtractResult {
  return conwayGearModel.extractAP214GeometryData()[0]
}

/**
 * Get the number of triangles in a mesh.
 *
 * @param model
 * @return {number} Number of triangles in a model's mesh.
 */
function getMeshSize( model: AP214GeometryExtraction ): number {

  return Array.from( model.scene.walk() ).reduce<number>(
      ( ( previous, current ) => (
         
        current[2].geometry as GeometryObject ).GetIndexDataSize() + previous ),
      0 )
}

/**
 * @return {number} indicating number of meshes
 */
function getTubeMeshSize(): number {

  return getMeshSize( conwayTubeModel )
}

/**
 * @return {number} indicating number of meshes
 */
function getGearMeshSize(): number {

  return getMeshSize( conwayGearModel )
}

/**
 * @return {boolean} indicating if the geometry extraction module is still initialized or not
 */
function destroy(): boolean {
  conwayTubeModel.destroy()
  conwayGearModel.destroy()

  return conwayTubeModel.isInitialized() ||
    conwayGearModel.isInitialized()
}

describe('AP214 Geometry Extraction', () => {

  beforeAll(async () => {

    await initializeGeometryExtractor()

  })

  test('initialize()', () => {

    expect(isInitialized()).toBe(true)

  })

  test('extractTubeGeometry()', () => {

    expect(extractTubeGeometry()).toBe(ExtractResult.COMPLETE)

  })

  test('extractGearGeometry()', () => {

    expect(extractGearGeometry()).toBe(ExtractResult.COMPLETE)

  })

  test('tubeGeometryArrayLength()', () => {
    // Dropped from 9108 with conway-geom#153: cylindrical faces CDT their
    // trim loops in a (theta, z) unwrap instead of refining earcut chords
    // until the triangle budget ran out.
    const testParameter:number = 828
    expect(getTubeMeshSize()).toBe(testParameter)

  })

  test('gearGeometryArrayLength()', () => {
    const testParameter:number = 48108
    expect(getGearMeshSize()).toBe(testParameter)

  })

  test('uniformScaleAffine scales basis AND translation, preserves bottom row', () => {

    // Direct unit test for the affine scale helper used by the unit-conversion
    // path in doTransforms (see https://github.com/bldrs-ai/conway/issues/308).
    // Models a placement in mm with a 1000 mm x-translation, 50 mm
    // y-translation, converted to metres (factor = 1/MM_PER_M).
    const MM_PER_M = 1000
    const TX_MM = 1000
    const TY_MM = 50
    const factor = 1 / MM_PER_M

    const model = conwayTubeModel as unknown as {
      wasmModule: { Glmdmat4: new () => { setValues(v: number[]): void; getValues(): number[] } }
      uniformScaleAffine(mat: unknown, factor: number): { getValues(): number[] }
    }

    const input = new model.wasmModule.Glmdmat4()
    // Column-major: cols 0..2 = basis (identity), col 3 = translation
    input.setValues([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      TX_MM, TY_MM, 0, 1,
    ])

    const v = model.uniformScaleAffine(input, factor).getValues()

    // Basis diagonal scaled by factor.
    expect(v[0]).toBeCloseTo(factor)
    expect(v[5]).toBeCloseTo(factor)
    expect(v[10]).toBeCloseTo(factor)

    // Translation scaled by factor (mm -> m). This is the bug the C++
    // `uniformScale` left in source units before; the helper fixes it.
    expect(v[12]).toBeCloseTo(TX_MM * factor)
    expect(v[13]).toBeCloseTo(TY_MM * factor)
    expect(v[14]).toBeCloseTo(0)

    // Bottom row left at [0, 0, 0, 1].
    expect(v[3]).toBe(0)
    expect(v[7]).toBe(0)
    expect(v[11]).toBe(0)
    expect(v[15]).toBe(1)
  })

  test('uniformScaleAffine with factor=1 returns the original matrix entries', () => {

    const model = conwayTubeModel as unknown as {
      wasmModule: { Glmdmat4: new () => { setValues(v: number[]): void; getValues(): number[] } }
      uniformScaleAffine(mat: unknown, factor: number): { getValues(): number[] }
    }

    // A column-major rotation+translation matrix with non-trivial entries
    // (60-degree z-rotation, arbitrary translation).
    const COS60 = Math.cos(Math.PI / 3)
    const SIN60 = Math.sin(Math.PI / 3)
    const TY = 20
    const TZ = 30
    const original = [
       COS60,  SIN60, 0, 0,
      -SIN60,  COS60, 0, 0,
       0,      0,     1, 0,
       10,     TY,   TZ, 1,
    ]
    const input = new model.wasmModule.Glmdmat4()
    input.setValues(original)

    const v = model.uniformScaleAffine(input, 1).getValues()
    for (let i = 0; i < original.length; ++i) {
      expect(v[i]).toBeCloseTo(original[i])
    }
  })

  test('uniformScaleBasis scales the 3x3 basis but PRESERVES translation', () => {

    // Direct unit test for the rigid-transform scale helper used by the
    // unit-conversion path in doTransforms (see
    // https://github.com/bldrs-ai/conway/issues/308 and PR #309/#334).
    // An assembly relationship placement is rigid: when the two related
    // shapes are in different length units, only the 3x3 basis is rescaled;
    // the translation column is a physical offset that must NOT move, or the
    // sub-components collapse toward the origin (the "port cluster"). Models a
    // placement in mm with a 1000 mm x / 50 mm y translation, converted to
    // metres (factor = 1/MM_PER_M).
    const MM_PER_M = 1000
    const TX_MM = 1000
    const TY_MM = 50
    const factor = 1 / MM_PER_M

    const model = conwayTubeModel as unknown as {
      wasmModule: { Glmdmat4: new () => { setValues(v: number[]): void; getValues(): number[] } }
      uniformScaleBasis(mat: unknown, factor: number): { getValues(): number[] }
    }

    const input = new model.wasmModule.Glmdmat4()
    // Column-major: cols 0..2 = basis (identity), col 3 = translation.
    input.setValues([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      TX_MM, TY_MM, 0, 1,
    ])

    const v = model.uniformScaleBasis(input, factor).getValues()

    // Basis diagonal scaled by factor.
    expect(v[0]).toBeCloseTo(factor)
    expect(v[5]).toBeCloseTo(factor)
    expect(v[10]).toBeCloseTo(factor)

    // Translation PRESERVED — this is the #308 invariant that distinguishes
    // uniformScaleBasis from uniformScaleAffine (which scales translation too).
    // Scaling these to TX_MM*factor / TY_MM*factor is exactly the regression
    // that re-clustered the Arty board's parts.
    expect(v[12]).toBeCloseTo(TX_MM)
    expect(v[13]).toBeCloseTo(TY_MM)
    expect(v[14]).toBeCloseTo(0)

    // Bottom row left at [0, 0, 0, 1].
    expect(v[3]).toBe(0)
    expect(v[7]).toBe(0)
    expect(v[11]).toBe(0)
    expect(v[15]).toBe(1)
  })

  test('uniformScaleBasis and uniformScaleAffine differ only on the translation column', () => {

    // Pins the #308 contract: for the SAME placement input the two helpers
    // agree on the 3x3 basis and disagree on translation — basis preserves it,
    // affine scales it. A future refactor that collapsed the two helpers would
    // trip this and re-introduce the cluster regression.
    const factor = 0.5
    const TX = 7
    const TY = -3
    const TZ = 11

    const model = conwayTubeModel as unknown as {
      wasmModule: { Glmdmat4: new () => { setValues(v: number[]): void; getValues(): number[] } }
      uniformScaleBasis(mat: unknown, factor: number): { getValues(): number[] }
      uniformScaleAffine(mat: unknown, factor: number): { getValues(): number[] }
    }

    const values = [
      2, 0, 0, 0,
      0, 2, 0, 0,
      0, 0, 2, 0,
      TX, TY, TZ, 1,
    ]
    const basisInput = new model.wasmModule.Glmdmat4()
    basisInput.setValues(values)
    const affineInput = new model.wasmModule.Glmdmat4()
    affineInput.setValues(values)

    const basis = model.uniformScaleBasis(basisInput, factor).getValues()
    const affine = model.uniformScaleAffine(affineInput, factor).getValues()

    // Basis diagonal (column-major 0,5,10) identical between the two helpers —
    // both scale the 3x3 basis the same way. (Indexed access keeps these out
    // of no-magic-numbers via ignoreArrayIndexes.)
    expect(basis[0]).toBeCloseTo(affine[0])
    expect(basis[5]).toBeCloseTo(affine[5])
    expect(basis[10]).toBeCloseTo(affine[10])

    // Translation column (12,13,14): basis keeps it, affine scales it.
    expect(basis[12]).toBeCloseTo(TX)
    expect(basis[13]).toBeCloseTo(TY)
    expect(basis[14]).toBeCloseTo(TZ)
    expect(affine[12]).toBeCloseTo(TX * factor)
    expect(affine[13]).toBeCloseTo(TY * factor)
    expect(affine[14]).toBeCloseTo(TZ * factor)
  })

  test('destroy()', () => {
    expect(destroy()).toBe(false)
  })

})
