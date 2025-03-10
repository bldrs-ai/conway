import {describe, expect, test} from '@jest/globals'
import IntegerParser from './integer_parser'


const parserInstance = IntegerParser.Instance

/**
 * Tests parsing an unsigned number.
 * @returns True if the test passes.
 */
function testUnsigned() {
  const data = new TextEncoder().encode( '0123456789' )

  const result = parserInstance.unsigned( data, 0, data.length )

  return result === data.length
}

/**
 * Tests that parsing an unsigned with a negative fails.
 * @returns True if the test passes.
 */
function testUnsignedNegative() {
  const data = new TextEncoder().encode( '-0123456789' )

  const result = parserInstance.unsigned( data, 0, data.length )

  return result === void 0
}

/**
 * Tests parsing an signed positive number.
 * @returns True if the test passes.
 */
function testSignedNoNegative() {
  const data = new TextEncoder().encode( '0123456789' )

  const result = parserInstance.signed( data, 0, data.length )

  return result === data.length
}

/**
 * Tests parsing an signed negative number.
 * @returns True if the test passes.
 */
function testSignedNegative() {
  const data = new TextEncoder().encode( '-0123456789' )

  const result = parserInstance.signed( data, 0, data.length )

  return result === data.length
}

/**
 * Tests parsing failing for a non-number input.
 * @returns True if the test passes.
 */
function testNotInteger() {
  const data = new TextEncoder().encode( 'TEST' )

  const result = parserInstance.signed( data, 0, data.length )

  return result === void 0
}


/**
 * Tests parsing a signed number terminating correctly at a space.
 * @returns True if the test passes.
 */
function testTermination() {
  const data = new TextEncoder().encode( '-0123456789 ' )

  const result = parserInstance.signed( data, 0, data.length )

  return result === ( data.length - 1 )
}

describe( 'Integer Parsing Test', () => {

  test( 'testUnsigned()', () => {

    expect( testUnsigned() ).toBe( true )

  } )

  test( 'testUnsignedNegative()', () => {

    expect( testUnsignedNegative() ).toBe( true )

  } )

  test( 'testSignedNoNegative()', () => {

    expect( testSignedNoNegative() ).toBe( true )

  } )

  test( 'testSignedNegative()', () => {

    expect( testSignedNegative() ).toBe( true )

  } )

  test( 'testNotInteger()', () => {

    expect( testNotInteger() ).toBe( true )

  } )

  test( 'testTermination()', () => {

    expect( testTermination() ).toBe( true )

  } )
})
