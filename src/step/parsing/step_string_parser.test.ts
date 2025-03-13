import {describe, expect, test} from '@jest/globals'
import StepStringParser from './step_string_parser'


const parserInstance = StepStringParser.Instance


/**
 * Test that a STEP string parses as a correct value.
 *
 * @return {boolean} True if the test passes.
 */
function testParseCorrectValue() {
  const data = new TextEncoder().encode( '\'Test String\'' )

  const result = parserInstance.match( data, 0, data.length )

  return result === data.length
}


/**
 * Test that a STEP string escape sequence parses correctly.
 *
 * @return {boolean} True if the test passes.
 */
function testParseEscape() {
  const data = new TextEncoder().encode( '\'Test Escape \'\' \\S\\\' \\X\\ \\ \'' )

  const result = parserInstance.match( data, 0, data.length )

  return result === data.length
}


/**
 * Test that a STEP string with a missing discriminator fails  to parse correctly.
 *
 * @return {boolean} True if the test passes.
 */
function testParseMissingDiscriminator() {
  const data = new TextEncoder().encode( 'Test String\'' )

  const result = parserInstance.match( data, 0, data.length )

  return result === void 0
}


/**
 * Test that a STEP string with a missing terminator fails  to parse correctly.
 *
 * @return {boolean} True if the test passes.
 */
function testParseMissingTerminator() {
  const data = new TextEncoder().encode( '\'Test String' )

  const result = parserInstance.match( data, 0, data.length )

  return result === void 0
}

/**
 * Test that a STEP string with a bunch of escapes parses correctly.
 *
 * @return {boolean} True if the test passes.
 */
function extractCorrectValue() {
  const data = new TextEncoder().encode( '\'Test String\\X2\\1E53\\X0\\\'' )

  const result = parserInstance.extract( data, 0, data.length )

  return result === 'Test Stringṓ'
}

describe( 'Step String Parsing Test', () => {
  test( 'testParseCorrectValue()', () => {

    expect( testParseCorrectValue() ).toBe( true )

  } )
  test( 'testParseEscape()', () => {

    expect( testParseEscape() ).toBe( true )

  } )
  test( 'testParseMissingDiscriminator()', () => {

    expect( testParseMissingDiscriminator() ).toBe( true )

  } )
  test( 'testParseMissingTerminator()', () => {

    expect( testParseMissingTerminator() ).toBe( true )

  } )
  test( 'extractCorrectValue()', () => {

    expect( extractCorrectValue() ).toBe( true )

  } )
})
