import fs from 'fs'
import { beforeAll, describe, expect, test } from '@jest/globals'
import { IfcGeometryExtraction } from './ifc_geometry_extraction'
import { ParseResult } from '../step/parsing/step_parser'
import IfcStepParser from './ifc_step_parser'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ConwayGeometry } from '../../dependencies/conway-geom'
import { ExtractResult } from '../core/shared_constants'


let conwayModel: IfcGeometryExtraction

/**
 * Initializes the IFC geometry extraction.
 *
 * @return {Promise<boolean | ExtractResult | void>} Resolves to true,
 * ExtractResult, or void depending on initialization outcome.
 */
async function initialize(): Promise<boolean | ExtractResult | void> {
  const parser = IfcStepParser.Instance
  const buffer = fs.readFileSync('data/block.ifc')
  const input = new ParsingBuffer(buffer)
  const headerResult = parser.parseHeader(input)[1]

  if (headerResult !== ParseResult.COMPLETE) {
    return ExtractResult.INCOMPLETE
  }

  const geom = new ConwayGeometry()
  const init = await geom.initialize()

  if (!init) {
    return
  }

  const [, model] = parser.parseDataToModel(input)

  if (model === void 0) {
    return ExtractResult.INCOMPLETE
  }

  conwayModel = new IfcGeometryExtraction(geom, model)

  return conwayModel.isInitialized()
}

/**
 * Extracts the IFC geometry data.
 *
 * @return {ExtractResult} The result of the extraction.
 */
function extract(): ExtractResult {
  return conwayModel.extractIFCGeometryData()[0]
}

/**
 * Counts the number of meshes in the scene.
 *
 * @return {number} The number of meshes in the scene.
 */
function meshCount(): number {
  return Array.from(conwayModel.scene.walk()).length
}

beforeAll(async () => {
  await initialize()
})

describe('IfcBlock Extraction', () => {
  test('initialize()', () => {
    expect(conwayModel.isInitialized()).toBe(true)
  })

  test('extract()', () => {
    expect(extract()).toBe(ExtractResult.COMPLETE)
  })

  test('meshCount()', () => {
    const expected = 1
    expect(meshCount()).toBe(expected)
  })
})
