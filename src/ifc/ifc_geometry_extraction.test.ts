import fs from 'fs'
import { describe, expect, test, beforeAll } from '@jest/globals'
import { ExtractResult, IfcGeometryExtraction } from './ifc_geometry_extraction'
import { ParseResult } from '../step/parsing/step_parser'
import IfcStepParser from './ifc_step_parser'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ConwayGeometry } from '../../dependencies/conway-geom/conway_geometry'
import { CanonicalMaterial, ColorRGBA } from '../core/canonical_material'


let conwayModel:IfcGeometryExtraction

/**
 *
 */
async function initializeGeometryExtractor() {
  const parser = IfcStepParser.Instance
  const indexIfcBuffer: Buffer = fs.readFileSync('index.ifc')
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
 *  @return {boolean} indicating whether the wasm module is initialized.
 */
function isInitialized(): Boolean {
  return conwayModel.isInitialized()
}

/**
 * @return {ExtractResult} indicating whether the geometry extraction was successful.
 */
function extractGeometry(): ExtractResult {
  return conwayModel.extractIFCGeometryData(true)[0]
}

/**
 * @return {number} indicating number of meshes
 */
function getMeshSize(): Number {
  return Array.from( conwayModel.scene.walk() ).length
}

/**
 * Get the materials from the model.
 *
 * @return {IterableIterator< CanonicalMaterial >} The materials for this.
 */
function getMaterialCount(): number {
  return conwayModel.materials.size
}

/**
 * Get the materials from the model.
 *
 * @return {IterableIterator< CanonicalMaterial >} The materials for this.
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
function destroy(): Boolean {
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
    const testParameter:Number = 1
    expect(getMaterialCount()).toBe(testParameter)

  })

  test('materialColorMatches(0)', () => {
    // eslint-disable-next-line no-magic-numbers
    expect(materialColorMatches(0, [0.4, 0.8, 0, 1])).toBe(true)
  })

  test('geometryArrayLength()', () => {
    const testParameter:Number = 7
    expect(getMeshSize()).toBe(testParameter)

  })

  test('destroy()', () => {
    expect(destroy()).toBe(false)
  })

})
