import fs from 'fs'
import { describe, expect, test, beforeAll } from '@jest/globals'
import { IfcGeometryExtraction } from './ifc_geometry_extraction'
import { ParseResult } from '../step/parsing/step_parser'
import IfcStepParser from './ifc_step_parser'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ConwayGeometry } from '../../dependencies/conway-geom'
import { PackedMesh } from '../core/packed_mesh'
import IfcStepModel from './ifc_step_model'
import { ExtractResult } from '../core/shared_constants'


let conwayModel:IfcGeometryExtraction

/**
 * Initialize the geometry extractor with index IFC.
 */
async function initializeGeometryExtractor() {
  const parser = IfcStepParser.Instance
  const indexIfcBuffer: Buffer = fs.readFileSync('data/index.ifc')
  const bufferInput = new ParsingBuffer(indexIfcBuffer)
  const result0 = parser.parseHeader(bufferInput)[1]

  if (result0 !== ParseResult.COMPLETE) {
    return ExtractResult.INCOMPLETE
  }

  const [, model] = parser.parseDataToModel(bufferInput)

  if (model === void 0) {
    return ExtractResult.INCOMPLETE
  }
  const conwayGeometry: ConwayGeometry = new ConwayGeometry()
  const initializationStatus = await conwayGeometry.initialize()

  if (!initializationStatus) {
    return
  }

  conwayModel = new IfcGeometryExtraction(conwayGeometry, model)

  return conwayModel.isInitialized()
}

/**
 * Extract the geometry from index IFC
 *
 * @return {ExtractResult} indicating whether the geometry extraction was successful.
 */
function extractGeometry(): ExtractResult {
  return conwayModel.extractIFCGeometryData()[0]
}

let packedModel: PackedMesh< IfcStepModel > | undefined

/**
 * Build the packed mesh model if it hasn't been built and memoize it,
 * and return the memoized value.
 *
 * @return {PackedMesh | undefined} The packed mesh if it can be built,
 * or undefined (void 0) otherwise.
 */
function packMesh(): PackedMesh< IfcStepModel > | undefined {

  if ( extractGeometry() !== ExtractResult.COMPLETE ) {
    return
  }

  if ( packedModel !== void 0 ) {
    return packedModel
  }

  packedModel = conwayModel.scene.buildPackedMeshModel()

  return packedModel
}

const FIRST_BUILDING_ELEMENT = 265

/**
 * Test that the extracted element matches the particular triangle.
 *
 * @return {boolean} True if the first element has the expected express ID
 */
function isFirstElementCorrect(): boolean {

  const packedModelLocal = packMesh()

  if ( packedModelLocal === void 0 ) {
    return false
  }

  const element =
    conwayModel.model.getElementByLocalID( packedModelLocal.triangleElementMaps[ 0 ].map[ 0 ] )

  if ( element?.expressID === FIRST_BUILDING_ELEMENT ) {
    return true
  }

  return false
}

/**
 * Test that the extracted element matches the particular triangle.
 *
 * @return {boolean} True if the first element has the expected express ID
 */
function correctTriangleCount(): boolean {

  const packedModelLocal = packMesh()

  if ( packedModelLocal === void 0 ) {
    return false
  }

  return packedModelLocal.primitives.every(
      (value, index) =>
        packedModelLocal.triangleElementMaps[ index ].size ===
        // eslint-disable-next-line no-magic-numbers, new-cap
        Math.trunc( value[ 0 ].GetIndexDataSize() / 3 ) )
}

beforeAll(async () => {

  await initializeGeometryExtractor()

})

describe('IfcSceneBuilder', () => {

  test('packMesh()', () => {

    expect(packMesh()).toBeDefined()

  })

  test('isFirstElementCorrect()', () => {

    expect(isFirstElementCorrect()).toBe(true)

  })

  test('correctTriangleCount()', () => {

    expect(correctTriangleCount()).toBe(true)

  })
})
