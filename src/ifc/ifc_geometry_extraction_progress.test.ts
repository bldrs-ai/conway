import fs from 'fs'
import { beforeAll, describe, expect, test } from '@jest/globals'
import { ConwayGeometry } from '../../dependencies/conway-geom'
import ParsingBuffer from '../parsing/parsing_buffer'
import { IfcGeometryExtraction } from './ifc_geometry_extraction'
import IfcStepModel from './ifc_step_model'
import IfcStepParser from './ifc_step_parser'


const conwayGeometry = new ConwayGeometry()

/**
 * Parse the shared index.ifc fixture into a fresh model.
 *
 * @return {IfcStepModel} The parsed model.
 */
function parseFixtureModel(): IfcStepModel {
  const parser = IfcStepParser.Instance
  const indexIfcBuffer: Buffer = fs.readFileSync('data/index.ifc')
  const bufferInput = new ParsingBuffer(indexIfcBuffer)

  parser.parseHeader(bufferInput)

  const model = parser.parseDataToModel(bufferInput)[1]

  expect(model).toBeDefined()

  return model!
}

beforeAll(async () => {
  await conwayGeometry.initialize()
})

describe('geometry extraction progress', () => {

  test('progress ticks are monotonic with a stable total', () => {

    const model = parseFixtureModel()
    const extraction = new IfcGeometryExtraction(conwayGeometry, model)

    const ticks: [number, number][] = []

    const [result] = extraction.extractIFCGeometryData(
        (completed, total) => ticks.push([completed, total]))

    expect(result).toBeDefined()
    expect(ticks.length).toBeGreaterThan(0)

    const total = ticks[0][1]

    for (let where = 0; where < ticks.length; ++where) {
      expect(ticks[where][1]).toBe(total)

      if (where > 0) {
        expect(ticks[where][0]).toBe(ticks[where - 1][0] + 1)
      }
    }

    expect(ticks[ticks.length - 1][0]).toBeLessThanOrEqual(total)
  })

  test('restores memoization state when the progress consumer throws', () => {

    const model = parseFixtureModel()

    const defaultCsgDepth = 20

    // lowMemoryMode makes the extraction flip elementMemoization off inside
    // its try block — the generator's finally must restore it even when the
    // driver loop is exited by a consumer exception mid-extraction.
    const extraction =
      new IfcGeometryExtraction(conwayGeometry, model, true, defaultCsgDepth, true)

    expect(model.elementMemoization).toBe(true)

    expect(() => extraction.extractIFCGeometryData(() => {
      throw new Error('progress consumer failure')
    })).toThrow('progress consumer failure')

    expect(model.elementMemoization).toBe(true)
  })
})
