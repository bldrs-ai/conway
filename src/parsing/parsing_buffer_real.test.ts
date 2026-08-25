import {describe, expect, test} from '@jest/globals'
import ParsingBuffer from './parsing_buffer'


/**
 * Parse one STEP/IFC real literal through the same entry point the entity
 * parsers use.
 *
 * A trailing space stands in for the delimiter a real always has after it in
 * a STEP file; readReal reads up to it and leaves the cursor there.
 *
 * @param literal The literal to parse, exactly as it appears in a file.
 * @return {number | undefined} What readReal made of it.
 */
function readReal( literal: string ): number | undefined {
  const data = new TextEncoder().encode( `${literal} ` )

  return new ParsingBuffer( data ).readReal()
}


/**
 * Relative difference between a parsed value and the runtime's own decimal
 * conversion of the same literal.
 *
 * readReal scales the mantissa against a power-of-ten table rather than
 * deferring to `Number()`, so it is correctly rounded only to within a few
 * ULP. That accuracy contract is long-standing and is not what these tests
 * are about; they are about literals that used to come back NaN.
 *
 * @param literal The literal to parse and to use as the reference.
 * @return {number} The relative error, or Infinity if the parse is not finite.
 */
function relativeErrorAgainstRuntime( literal: string ): number {
  const got      = readReal( literal )
  const expected = Number( literal )

  if ( typeof got !== 'number' || !Number.isFinite( got ) ) {
    return Infinity
  }

  if ( expected === 0 ) {
    return Math.abs( got )
  }

  return Math.abs( ( got - expected ) / expected )
}


// A total decimal shift of 64 — fractional digits plus exponent, not the
// exponent alone — is the boundary the radix table's last index sits on.
// readReal used to clamp the per-iteration shift to RADIX_LUT_SIZE, and
// radixLUT[RADIX_LUT_SIZE] is one past the end of a Float64Array, which reads
// `undefined` rather than throwing; dividing by that yields NaN silently. 306
// direction and coordinate values in Orbiter_v1.1_Gear_7.5.step parsed that
// way, putting NaN into every placement built from them (bldrs-ai/conway#589).
const TOLERANCE = 1e-12

const IN_RANGE = [
  '0.1',
  '-1.5E-8',
  '1.0E-50',
  '9.86076131526265E-32',
  '4.37905770101505E-47',
]

// '1.0' contributes one fractional digit, so E-63 is a shift of exactly 64:
// the first literal that used to be NaN. The last four are real values taken
// from corpus models.
const PAST_THE_TABLE = [
  '1.0E-63',
  '1.0E-64',
  '1.0E-65',
  '1.33564029830467E-63',
  '-1.94469227207812E-62',
  '3.52475474722604E-62',
  '5.25674630405262E-61',
]

// The positive-exponent loop carries the same clamp, so it had the same
// boundary: 1.0E+64 was the largest that survived. 5.0E-324 is the smallest
// denormal, which scaling has to reach without passing through NaN.
const LARGE_AND_DENORMAL = [
  '1.0E+64',
  '1.0E+65',
  '1.5E308',
  '5.0E-324',
]


describe( 'ParsingBuffer.readReal', () => {

  test.each( [ ...IN_RANGE, ...PAST_THE_TABLE, ...LARGE_AND_DENORMAL ] )(
      'parses %s to the same value the runtime does', ( literal ) => {

        expect( Number.isFinite( readReal( literal ) ) ).toBe( true )
        expect( relativeErrorAgainstRuntime( literal ) )
            .toBeLessThanOrEqual( TOLERANCE )
      } )

  test( 'scales past the radix table in more than one step', () => {

    // A shift of 200 is three trips through the loop, which is what proves
    // the clamp is a chunk size and not a ceiling on the exponent.
    expect( relativeErrorAgainstRuntime( '1.0E-200' ) )
        .toBeLessThanOrEqual( TOLERANCE )
    expect( relativeErrorAgainstRuntime( '1.0E+200' ) )
        .toBeLessThanOrEqual( TOLERANCE )
  } )

  test( 'still overflows and underflows where a double must', () => {

    expect( readReal( '1.0E+400' ) ).toBe( Infinity )
    expect( readReal( '1.0E-400' ) ).toBe( 0 )
  } )
} )
