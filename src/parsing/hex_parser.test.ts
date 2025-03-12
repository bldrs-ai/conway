import {describe, expect, test} from '@jest/globals'
import HexParser from './hex_parser'


const parserInstance = HexParser.Instance

/**
 * Tests correctly parsing a STEP hex number.
 *
 * @return {boolean} True if the test passes.
 */
function testParseCorrectValueStep() {
  const data = new TextEncoder().encode( '"201234567ABCDEF"' )

  const result = parserInstance.step( data, 0, data.length )

  return result === data.length
}

/**
 * Tests parsing a C style hex number.
 *
 * @return {boolean} True if the test passes.
 */
function testParseCorrectValueC() {
  const data = new TextEncoder().encode( '0x0123456789ABCDEF' )

  const result = parserInstance.prefixed( data, 0, data.length )

  return result === data.length
}

/**
 * Tests parsing an unprefixed hex number.
 *
 * @return {boolean} True if the test passes.
 */
function testParseCorrectValueUnprefixed() {
  const data = new TextEncoder().encode( '0123456789ABCDEF' )

  const result = parserInstance.unprefixed( data, 0, data.length )

  return result === data.length
}

/**
 * Tests that parsing an incorrectly formatted STEP hex number fails.
 *
 * @return {boolean} True if the test passes.
 */
function testParseIncorrectStep() {
  const data = new TextEncoder().encode( '"G1235"' )

  const result = parserInstance.step( data, 0, data.length )

  return result === void 0
}

/**
 * Tests that parsing an incorrectly formatted C prefixed hex number fails.
 *
 * @return {boolean} True if the test passes.
 */
function testParseIncorrectC() {
  const data = new TextEncoder().encode( 'X12450324BEF' )

  const result = parserInstance.prefixed( data, 0, data.length )

  return result === void 0
}

/**
 * Tests that extracting a STEP hex number works correctly.
 *
 * @return {boolean} True if the test passes.
 */
function testParseExtract() {
  const testDataMatch = Buffer.from( '0FFEDCBA76543210', 'hex' )

  const data = new TextEncoder().encode( '"201234567ABCDEFF0"' )

  const result = parserInstance.extractStep( data, 0, data.length )

  if ( result === void 0 ) {
    return false
  }

  const [extractedData, bitCount] = result

  if ( extractedData.length !== testDataMatch.length ) {
    return false
  }

  for ( let where = 0; where < extractedData.length; ++where ) {
    if ( extractedData[ where ] !== testDataMatch[ where ] ) {
      return false
    }
  }

   
  return ( ( testDataMatch.length * 8 ) - 2 ) === bitCount
}

describe( 'Hex Parsing Test', () => {

  test( 'testParseCorrectValueStep()', () => {

    expect( testParseCorrectValueStep() ).toBe( true )

  } )

  test( 'testParseCorrectValueC()', () => {

    expect( testParseCorrectValueC() ).toBe( true )

  } )

  test( 'testParseCorrectValueUnprefixed()', () => {

    expect( testParseCorrectValueUnprefixed() ).toBe( true )

  } )

  test( 'testParseIncorrectStep()', () => {

    expect( testParseIncorrectStep() ).toBe( true )

  } )

  test( 'testParseIncorrectC()', () => {

    expect( testParseIncorrectC() ).toBe( true )

  } )

  test( 'testParseExtract()', () => {

    expect( testParseExtract() ).toBe( true )

  } )
})
