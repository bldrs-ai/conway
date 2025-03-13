import {describe, expect, test} from '@jest/globals'
import StepCommentParser from './step_comment_parser'


const parserInstance = StepCommentParser.Instance

/**
 * Test parsing a correct comment
 *
 * @return {boolean} True if the test passes.
 */
function testParseCorrectValue() {
  const data = new TextEncoder().encode( '/* Test sdfdsf /\\/ * */' )

  const result = parserInstance.match( data, 0, data.length )

  return result === data.length
}

/**
 * Test that parsing an unterminated comment fails.
 *
 * @return {boolean} True if the test passes.
 */
function testParseUnterminated() {
  const data = new TextEncoder().encode( '/* Test' )

  const result = parserInstance.match( data, 0, data.length )

  return result === void 0
}

/**
 * Test that parsing an non-descriminated comment fails.
 *
 * @return {boolean} True if the test passes.
 */
function testParseMissingDiscriminator() {
  const data = new TextEncoder().encode( 'TEST */' )

  const result = parserInstance.match( data, 0, data.length )

  return result === void 0
}

describe( 'Step Comment Parsing Test', () => {
  test( 'testParseCorrectValue()', () => {

    expect( testParseCorrectValue() ).toBe( true )

  } )

  test( 'testParseUnterminated()', () => {

    expect( testParseUnterminated() ).toBe( true )

  } )

  test( 'testParseMissingDiscriminator()', () => {

    expect( testParseMissingDiscriminator() ).toBe( true )

  } )
})
