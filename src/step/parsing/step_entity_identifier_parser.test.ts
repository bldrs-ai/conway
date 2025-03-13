import {describe, expect, test} from '@jest/globals'
import StepEntityIdentifierParser from './step_entity_identifier_parser'


const parserInstance = StepEntityIdentifierParser.Instance

/**
 * Test an identifier string with capitals, underscores and trialing numbers.
 *
 * @return {boolean} True if the test passes.
 */
function testParseCorrectValue() {
  const data = new TextEncoder().encode( 'TESTENTIT_TEST123' )

  const result = parserInstance.match( data, 0, data.length )

  return result === data.length
}

/**
 * Test an identifier with a space after it to make sure it terminates before the space.
 *
 * @return {boolean} True if the test parses.
 */
function testParseSpaceAtEnd() {
  const data = new TextEncoder().encode( 'TESTENTIT_TEST123 ' )

  const result = parserInstance.match( data, 0, data.length )

  return result === ( data.length - 1 )
}

/**
 * Test an identifier with clower case to make sure it fails.
 *
 * @return {boolean} True if the test parses.
 */
function testParseLowerCase() {
  const data = new TextEncoder().encode( 'testent_123' )

  const result = parserInstance.match( data, 0, data.length )

  return result === void 0
}

/**
 * Test an identifier with a starting number to make sure it fails.
 *
 * @return {boolean} True if the test parses.
 */
function testParserStartWithDigit() {
  const data = new TextEncoder().encode( '5TESTENTIT_TEST123' )

  const result = parserInstance.match( data, 0, data.length )

  return result === void 0
}

describe( 'Step Entity Idenitfier Parsing Test', () => {
  test( 'testParseCorrectValue()', () => {

    expect( testParseCorrectValue() ).toBe( true )

  } )

  test( 'testParseSpaceAtEnd()', () => {

    expect( testParseSpaceAtEnd() ).toBe( true )

  } )

  test( 'testParseLowerCase()', () => {

    expect( testParseLowerCase() ).toBe( true )

  } )

  test( 'testParserStartWithDigit()', () => {

    expect( testParserStartWithDigit() ).toBe( true )

  } )
})
