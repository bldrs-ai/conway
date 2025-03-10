import {describe, expect, test} from '@jest/globals'
import StepEntityIdentifierParser from './step_enum_parser'


const parserInstance = StepEntityIdentifierParser.Instance

/**
 * Tests parsing a simple enum value.
 * @returns True if the test parses.
 */
function testParseCorrectValue() {
  const data = new TextEncoder().encode( '.TEST.' )

  const result = parserInstance.match( data, 0, data.length )

  return result === data.length
}

/**
 * Tests an unterminated enum value failing parse.
 * @returns True if the test parses.
 */
function testParseUnterminated() {
  const data = new TextEncoder().encode( '.TEST' )

  const result = parserInstance.match( data, 0, data.length )

  return result === void 0
}

/**
 * Tests an enum value failing on missing starting discriminator.
 * @returns True if the test parses.
 */
function testParseMissingDiscriminator() {
  const data = new TextEncoder().encode( 'TEST.' )

  const result = parserInstance.match( data, 0, data.length )

  return result === void 0
}

/**
 * Tests a parse failing for enum missing any letters between dots.
 * @returns True if the test parses.
 */
function testParseMissingLetter() {
  const data = new TextEncoder().encode( '..' )

  const result = parserInstance.match( data, 0, data.length )

  return result === void 0
}

/**
 * Tests a parse failing for lower case.
 * @returns True if the test parses.
 */
function testParseLowerCase() {
  const data = new TextEncoder().encode( '.test.' )

  const result = parserInstance.match( data, 0, data.length )

  return result === void 0
}

describe( 'Step Enum Parsing Test', () => {
  test( 'testParseCorrectValue()', () => {

    expect( testParseCorrectValue() ).toBe( true )

  } )
  test( 'testParseUnterminated()', () => {

    expect( testParseUnterminated() ).toBe( true )

  } )
  test( 'testParseMissingDiscriminator()', () => {

    expect( testParseMissingDiscriminator() ).toBe( true )

  } )
  test( 'testParseMissingLetter()', () => {

    expect( testParseMissingLetter() ).toBe( true )

  } )
  test( 'testParseLowerCase()', () => {

    expect( testParseLowerCase() ).toBe( true )

  } )
})
