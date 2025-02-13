import fs from 'fs'
import { describe, expect, test, beforeAll } from '@jest/globals'
import { IfcGeometryExtraction } from '../ifc/ifc_geometry_extraction'
import { ParseResult } from '../step/parsing/step_parser'
import IfcStepParser from '../ifc/ifc_step_parser'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ConwayGeometry } from '../../dependencies/conway-geom'
import { PackedMesh } from '../core/packed_mesh'
import IfcStepModel from '../ifc/ifc_step_model'
import { IfcProduct } from '../ifc/ifc4_gen'
import { ExtractResult } from './shared_constants'


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

  const conwayGeometry: ConwayGeometry = new ConwayGeometry()
  const initializationStatus = await conwayGeometry.initialize()

  if (!initializationStatus) {
    return
  }

  const [, model] = parser.parseDataToModel( bufferInput )

  if (model === void 0) {
    return ExtractResult.INCOMPLETE
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

const ELEMENT_CURSOR_TRIANGLES_SET_COUNT = 7

/**
 * Get all the elements in a from a product query, find their matching triangles
 * given the cursor, then check the triangle map matches.
 *
 * @return {boolean} True if all triangle elements map, false if otherwise.
 */
function checkTrianglesMatch(): boolean {

  const packedModelLocal = packMesh()

  if ( packedModelLocal === void 0 ) {
    return false
  }

  const elementsCursor = packedModelLocal.model.typeIndex.cursor( ...IfcProduct.query )

  let currentCount = 0

  for ( const [localId, primitiveIndex, triangleSet] of
    packedModelLocal.triangles( elementsCursor ) ) {

    const element = packedModelLocal.model.getElementByLocalID(localId)

    if ( element === void 0 ) {
      return false
    }

    const triangleMap = packedModelLocal.triangleElementMaps[ primitiveIndex ].map

    for ( const triangleIndex of triangleSet ) {

      if ( triangleMap[ triangleIndex ] !== localId ) {
        return false
      }
    }

    ++currentCount
  }

  return currentCount === ELEMENT_CURSOR_TRIANGLES_SET_COUNT
}

beforeAll(async () => {

  await initializeGeometryExtractor()

})

describe('IfcSceneBuilder', () => {

  test('checkTrianglesMatch()', () => {

    expect(checkTrianglesMatch()).toBe(true)

  })
})
