import fs from 'fs'
import { beforeAll, describe, expect, test } from '@jest/globals'
import { IfcPropertyExtraction, PropertyExtractResult } from './ifc_property_extraction'
import { ParseResult } from '../step/parsing/step_parser'
import IfcStepParser from './ifc_step_parser'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ConwayGeometry } from '../../dependencies/conway-geom'


const conwayGeometry = new ConwayGeometry()

/**
 * Intialize conway geom.
 */
async function initializeConwayGeom() {

  await conwayGeometry.initialize()
}


/**
 * @returns indicating whether the IFC properties extraction was successful.
 */
function parseProperties(): PropertyExtractResult {
  const parser = IfcStepParser.Instance
  const indexIfcBuffer: Buffer = fs.readFileSync('data/index.ifc')
  const bufferInput = new ParsingBuffer(indexIfcBuffer)
  const result0 = parser.parseHeader(bufferInput)[1]

  if (result0 !== ParseResult.COMPLETE) {
    return PropertyExtractResult.INCOMPLETE
  }

  const [, model] = parser.parseDataToModel( bufferInput)

  if (model === void 0) {
    return PropertyExtractResult.INCOMPLETE
  }

  return IfcPropertyExtraction.extractIFCProperties(model, true)
}


describe('Ifc Properties Extraction', () => {

  beforeAll(async () => {

    await initializeConwayGeom()

  })

  test('parseProperties()', () => {

    expect(parseProperties()).toBe(PropertyExtractResult.COMPLETE)

  })
})
