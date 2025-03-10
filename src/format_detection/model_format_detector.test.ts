import {describe, expect, test} from '@jest/globals'

import fs from 'fs'
import ParsingBuffer from '../parsing/parsing_buffer'
import ModelFormatDetector, { ModelFormatType } from './model_format_detector'


const indexIfcBuffer: Buffer =
  fs.readFileSync('data/index.ifc')
const tubeBuffer: Buffer =
  fs.readFileSync('data/create-a-tube.step')
const gearBuffer: Buffer =
  fs.readFileSync('data/a-gear-with-3-inch-diameter-and-20-curved-teeth.step')
const nativeHDBuffer: Buffer =
  fs.readFileSync('data/native_hd.m3u8')
const emptyBuffer: Uint8Array = new Uint8Array( 0 )

const indexIfcBufferInput = new ParsingBuffer(indexIfcBuffer)
const tubeBufferInput = new ParsingBuffer(tubeBuffer)
const gearBufferInput = new ParsingBuffer(gearBuffer)
const nativeHDBufferInput = new ParsingBuffer(nativeHDBuffer)
const emptyBufferInput = new ParsingBuffer(emptyBuffer)

/**
 * @returns The type for model formats, should be IFC.
 */
function testIndexIfc(): ModelFormatType | undefined  {
  return ModelFormatDetector.detect( indexIfcBufferInput )
}

/**
 * @returns The type for model formats, should be AP214.
 */
function testTubeStep(): ModelFormatType | undefined {
  return ModelFormatDetector.detect( tubeBufferInput )
}

/**
 * @returns The type for model formats, should be AP214.
 */
function testGearStep(): ModelFormatType | undefined {
  return ModelFormatDetector.detect( gearBufferInput )
}

/**
 * @returns The type for model formats, should be AP214.
 */
function testNotAModel(): ModelFormatType | undefined {
  return ModelFormatDetector.detect( nativeHDBufferInput )
}

/**
 * @returns The type for model formats, should be AP214.
 */
function testEmpty(): ModelFormatType | undefined {
  return ModelFormatDetector.detect( emptyBufferInput )
}


describe('Model Format Detector', () => {

  test('testIndexIfc()', () => {

    expect(testIndexIfc()).toBe(ModelFormatType.IFC)

  })

  test('testTubeStep()', () => {

    expect(testTubeStep()).toBe(ModelFormatType.AP214)

  })

  test('testGearStep()', () => {

    expect(testGearStep()).toBe(ModelFormatType.AP214)

  })

  test('testNotAModel()', () => {

    expect(testNotAModel()).toBe(void 0)

  })

  test('testEmpty()', () => {

    expect(testEmpty()).toBe(void 0)

  })


})
