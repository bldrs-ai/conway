/* eslint-disable no-magic-numbers */
import {describe, expect, test} from '@jest/globals'

import fs from 'fs'
import ParsingBuffer from '../parsing/parsing_buffer'
import ModelFormatDetector, {
  ModelFormatType,
  describeUnrecognizedModel,
} from './model_format_detector'


const indexIfcBuffer: Buffer =
  fs.readFileSync('data/index.ifc')
const tubeBuffer: Buffer =
  fs.readFileSync('data/create-a-tube.step')
const gearBuffer: Buffer =
  fs.readFileSync('data/a-gear-with-3-inch-diameter-and-20-curved-teeth.step')
const configControlDesignBuffer: Buffer =
  fs.readFileSync('data/config-control-design-min.step')
const ap242Buffer: Buffer =
  fs.readFileSync('data/ap242-header-min.step')
const ap203MimBuffer: Buffer =
  fs.readFileSync('data/ap203-mim-header-min.step')
const nativeHDBuffer: Buffer =
  fs.readFileSync('data/native_hd.m3u8')
const emptyBuffer: Uint8Array = new Uint8Array( 0 )

const indexIfcBufferInput = new ParsingBuffer(indexIfcBuffer)
const tubeBufferInput = new ParsingBuffer(tubeBuffer)
const gearBufferInput = new ParsingBuffer(gearBuffer)
const configControlDesignBufferInput = new ParsingBuffer(configControlDesignBuffer)
const ap242BufferInput = new ParsingBuffer(ap242Buffer)
const ap203MimBufferInput = new ParsingBuffer(ap203MimBuffer)
const nativeHDBufferInput = new ParsingBuffer(nativeHDBuffer)
const emptyBufferInput = new ParsingBuffer(emptyBuffer)

/**
 * @return {ModelFormatType} The type for model formats, should be IFC.
 */
function testIndexIfc(): ModelFormatType | undefined  {
  return ModelFormatDetector.detect( indexIfcBufferInput )
}

/**
 * @return {ModelFormatType} The type for model formats, should be AP214.
 */
function testTubeStep(): ModelFormatType | undefined {
  return ModelFormatDetector.detect( tubeBufferInput )
}

/**
 * @return {ModelFormatType} The type for model formats, should be AP214.
 */
function testGearStep(): ModelFormatType | undefined {
  return ModelFormatDetector.detect( gearBufferInput )
}

/**
 * @return {ModelFormatType} The type for model formats, should be AP203.
 */
function testConfigControlDesignStep(): ModelFormatType | undefined {
  return ModelFormatDetector.detect( configControlDesignBufferInput )
}

/**
 * @return {ModelFormatType} The type for model formats, should be AP242.
 */
function testAp242Step(): ModelFormatType | undefined {
  return ModelFormatDetector.detect( ap242BufferInput )
}

/**
 * NIST "AP203 geometry only" exports use the explicit AP203_*_MIM_LF schema
 * name rather than CONFIG_CONTROL_DESIGN.
 *
 * @return {ModelFormatType} The type for model formats, should be AP203.
 */
function testAp203MimStep(): ModelFormatType | undefined {
  return ModelFormatDetector.detect( ap203MimBufferInput )
}

/**
 * @return {ModelFormatType} The type for model formats, should be AP214.
 */
function testNotAModel(): ModelFormatType | undefined {
  return ModelFormatDetector.detect( nativeHDBufferInput )
}

/**
 * @return {ModelFormatType} The type for model formats, should be AP214.
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

  test('testConfigControlDesignStep()', () => {

    expect(testConfigControlDesignStep()).toBe(ModelFormatType.AP203)

  })

  test('testAp242Step()', () => {

    expect(testAp242Step()).toBe(ModelFormatType.AP242)

  })

  test('testAp203MimStep()', () => {

    expect(testAp203MimStep()).toBe(ModelFormatType.AP203)

  })

  test('testNotAModel()', () => {

    expect(testNotAModel()).toBe(void 0)

  })

  test('testEmpty()', () => {

    expect(testEmpty()).toBe(void 0)

  })


})

describe('describeUnrecognizedModel (conway#741)', () => {

  const header = indexIfcBuffer.toString('latin1')

  /**
   * @param text Latin-1 text.
   * @return {Uint8Array} Its bytes.
   */
  const latin1 = (text: string) =>
    Uint8Array.from(text, (character) => character.charCodeAt(0) & 0xff)

  /**
   * @param text Text to encode as UTF-16LE with a BOM.
   * @return {Uint8Array} Its bytes.
   */
  const utf16le = (text: string) => {
    const out = new Uint8Array(2 + (text.length * 2))
    out[0] = 0xff
    out[1] = 0xfe
    for (let where = 0; where < text.length; ++where) {
      out[2 + (where * 2)] = text.charCodeAt(where) & 0xff
    }
    return out
  }

  test.each([
    ['empty', new Uint8Array(0), 'empty file'],
    ['whitespace only', latin1(' \r\n\t '), 'empty file'],
    ['zip', latin1('PK\x03\x04'), 'zip archive (such as .ifczip), not STEP text'],
    ['gzip', Uint8Array.of(0x1f, 0x8b, 8, 0), 'gzip-compressed, not STEP text'],
    ['UTF-16LE with BOM', utf16le(header), 'UTF-16 text; STEP files must be 8-bit text'],
    ['XML', latin1('<?xml version="1.0"?><ifcXML/>'), 'XML or HTML, not STEP text'],
    ['not STEP', nativeHDBuffer, 'no ISO-10303-21 header'],
    [
      'no FILE_SCHEMA',
      latin1(header.replace(/FILE_SCHEMA\(\('[^']*'\)\);/, '')),
      'no FILE_SCHEMA in header',
    ],
    [
      'unknown schema',
      latin1(header.replace(/FILE_SCHEMA\(\('[^']*'\)\)/, "FILE_SCHEMA(('STRUCTURAL_FRAME_SCHEMA'))")),
      'unrecognized FILE_SCHEMA STRUCTURAL_FRAME_SCHEMA',
    ],
  ])('%s', (_label, data, reason) => {

    // Every case is one detect() rejects; the description adds a reason
    // without changing that.
    expect(ModelFormatDetector.detect(new ParsingBuffer(data))).toBe(void 0)
    expect(describeUnrecognizedModel(data)).toBe(reason)
  })

  test('a header syntax error names the byte, and the schema when it parsed', () => {

    // An edition-3 ANCHOR section after a complete header: FILE_SCHEMA is
    // known, but the header parse fails where DATA was expected.
    const data = latin1(header.replace('ENDSEC;\n\nDATA;', 'ENDSEC;\nANCHOR;\nENDSEC;\nDATA;'))

    expect(ModelFormatDetector.detect(new ParsingBuffer(data))).toBe(void 0)
    expect(describeUnrecognizedModel(data))
        .toMatch(/^STEP header syntax error at byte \d+ \(FILE_SCHEMA IFC4\)$/)
  })
})
