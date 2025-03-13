import {describe, expect, test} from '@jest/globals'
import RealParser from './real_parser'


const parserInstance = RealParser.Instance

/**
 * Tests parsing an unsigned number.
 *
 * @return {boolean} True if the test passes.
 */
function testUnsigned() {
  const data = new TextEncoder().encode( '0123456789' )

  const result = parserInstance.unsigned( data, 0, data.length )

  return result === data.length
}

/**
 * Tests that parsing an unsigned with a negative fails.
 *
 * @return {boolean} True if the test passes.
 */
function testUnsignedNegative() {
  const data = new TextEncoder().encode( '-0123456789' )

  const result = parserInstance.unsigned( data, 0, data.length )

  return result === void 0
}

/**
 * Tests that parsing an unsigned with a negative fails.
 *
 * @return {boolean} True if the test passes.
 */
function testSignedPositive() {
  const data = new TextEncoder().encode( '+0123456789' )

  const result = parserInstance.unsigned( data, 0, data.length )

  return result === void 0
}


/**
 * Tests parsing an signed positive number.
 *
 * @return {boolean} True if the test passes.
 */
function testSignedNoNegative() {
  const data = new TextEncoder().encode( '0123456789' )

  const result = parserInstance.signed( data, 0, data.length )

  return result === data.length
}

/**
 * Tests parsing an signed negative number.
 *
 * @return {boolean} True if the test passes.
 */
function testSignedNegative() {
  const data = new TextEncoder().encode( '-0123456789' )

  const result = parserInstance.signed( data, 0, data.length )

  return result === data.length
}

/**
 * Tests parsing failing for a non-number input.
 *
 * @return {boolean} True if the test passes.
 */
function testNotInteger() {
  const data = new TextEncoder().encode( 'TEST' )

  const result = parserInstance.signed( data, 0, data.length )

  return result === void 0
}

/**
 * Tests parsing a signed number terminating correctly at a space.
 *
 * @return {boolean} True if the test passes.
 */
function testTermination() {
  const data = new TextEncoder().encode( '-0123456789 ' )

  const result = parserInstance.signed( data, 0, data.length )

  return result === ( data.length - 1 )
}

/**
 * Tests parsing an signed negative number with a bunch of decimal places.
 *
 * @return {boolean} True if the test passes.
 */
function testDecimalPoint() {
  const data = new TextEncoder().encode( '-0123456789.0123456789' )

  const result = parserInstance.signed( data, 0, data.length )

  return result === data.length
}

/**
 * Tests parsing an signed negative number with scientific notation (lowercase e).
 *
 * @return {boolean} True if the test passes.
 */
function testScientific() {
  const data = new TextEncoder().encode( '-0123456789.0123456789e534' )

  const result = parserInstance.signed( data, 0, data.length )

  return result === data.length
}

/**
 * Tests parsing an signed negative number with scientific notation (lowercase e)
 * with the decimal point just before e.
 *
 * @return {boolean} True if the test passes.
 */
function testScientificPeriod() {
  const data = new TextEncoder().encode( '-0123456789.e534' )

  const result = parserInstance.signed( data, 0, data.length )

  return result === data.length
}

/**
 * Tests parsing an signed negative number with scientific notation (uppercase E).
 *
 * @return {boolean} True if the test passes.
 */
function testScientificUpper() {
  const data = new TextEncoder().encode( '-0123456789.0123456789E534' )

  const result = parserInstance.signed( data, 0, data.length )

  return result === data.length
}

/**
 * Tests parsing an signed negative number with scientific notation (uppercase E) and no
 * decimal point.
 *
 * @return {boolean} True if the test passes.
 */
function testScientificNoDecimal() {
  const data = new TextEncoder().encode( '-0123456789e534' )

  const result = parserInstance.signed( data, 0, data.length )

  return result === data.length
}


describe('Real Parsing Test', () => {
  test('testUnsigned()', () => {

    expect(testUnsigned()).toBe(true)

  })

  test('testUnsignedNegative()', () => {

    expect(testUnsignedNegative()).toBe(true)

  })

  test('testSignedPositive()', () => {

    expect(testSignedPositive()).toBe(true)

  })

  test('testSignedNoNegative()', () => {

    expect(testSignedNoNegative()).toBe(true)

  })

  test('testSignedNegative()', () => {

    expect(testSignedNegative()).toBe(true)

  })

  test('testNotInteger()', () => {

    expect(testNotInteger()).toBe(true)

  })

  test('testTermination()', () => {

    expect(testTermination()).toBe(true)

  })

  test('testDecimalPoint()', () => {

    expect(testDecimalPoint()).toBe(true)

  })

  test('testScientific()', () => {

    expect(testScientific()).toBe(true)

  })
  test('testScientificPeriod()', () => {

    expect(testScientificPeriod()).toBe(true)

  })

  test('testScientificUpper()', () => {

    expect(testScientificUpper()).toBe(true)

  })

  test('testScientificNoDecimal()', () => {

    expect(testScientificNoDecimal()).toBe(true)

  })
})
