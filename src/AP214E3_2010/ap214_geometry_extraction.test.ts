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
 *
 */
async function initializeGeometryExtractor() {
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
function isInitialized(): Boolean {
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
 * @return {number} Number of triangles in a model's mesh.
 */
function getMeshSize( model: AP214GeometryExtraction ): number {

  return Array.from( model.scene.walk() ).reduce<number>(
      ( ( previous, current ) => (
        // eslint-disable-next-line new-cap
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
function destroy(): Boolean {
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
    const testParameter:Number = 7182
    expect(getTubeMeshSize()).toBe(testParameter)

  })

  test('gearGeometryArrayLength()', () => {
    const testParameter:Number = 33948
    expect(getGearMeshSize()).toBe(testParameter)

  })

  test('destroy()', () => {
    expect(destroy()).toBe(false)
  })

})
