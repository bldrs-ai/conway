// Pins for the module-level scratch parsing buffer used by numeric
// extraction. The scratch is reinit-pointed at the caller's buffer on
// every read and, without an explicit release, silently pins the LAST
// buffer it saw — after a parse, the model's entire source. The
// model's cache-release/spill path calls releaseScratchParsingBuffer()
// to drop that pin (heap-snapshot verified: the source ArrayBuffer is
// unreachable after spill + release, where before it was retained via
// Context[parsingBufferReusable] → ParsingBuffer.buffer).
import { describe, expect, test } from '@jest/globals'

import {
  releaseScratchParsingBuffer,
  stepEnterTypedValue,
  stepExtractNumber,
} from './step_deserialization_functions'


const REAL_VALUE = 42.5
const INT_VALUE = 7


describe( 'releaseScratchParsingBuffer', () => {

  test( 'extraction works again after a release (scratch reinits on use)', () => {

    const bytes = new TextEncoder().encode( '42.5,' )

    expect( stepExtractNumber( bytes, 0, bytes.length ) ).toBe( REAL_VALUE )

    releaseScratchParsingBuffer()

    // The release must not break subsequent extraction — every use
    // reinits the scratch with the caller's buffer.
    const more = new TextEncoder().encode( '7,' )

    expect( stepExtractNumber( more, 0, more.length ) ).toBe( INT_VALUE )

    // And releasing twice is harmless.
    releaseScratchParsingBuffer()
    releaseScratchParsingBuffer()

    expect( stepExtractNumber( bytes, 0, bytes.length ) ).toBe( REAL_VALUE )
  })
})


describe( 'stepEnterTypedValue', () => {

  /**
   * Encode and enter, returning both the cursor and what it points at, so a
   * failed expectation says which byte the function landed on.
   *
   * @param text The STEP text to read from position 0.
   * @param typeName The expected wrapper type name.
   * @return {[number, string]} The returned cursor and the character there.
   */
  const enter = ( text: string, typeName: string ): [ number, string ] => {

    const bytes = new TextEncoder().encode( text )
    const cursor = stepEnterTypedValue( bytes, 0, bytes.length, typeName )

    return [ cursor, text[ cursor ] ?? '' ]
  }

  test( 'enters a matching wrapper, landing on the value', () => {

    // The case from bldrs-ai/conway#489: 274 occurrences in the public
    // regression baseline, every one of them throwing and losing its
    // styled item because the enum parse started on the 'N'.
    // Positions derived rather than written out, so the expectation says
    // "just past the wrapper" rather than asserting an opaque index.
    expect( enter( 'NULL_STYLE(.NULL.)', 'NULL_STYLE' ) )
        .toEqual( [ 'NULL_STYLE('.length, '.' ] )
    expect( enter( 'IFCNULLSTYLE(.NULL.)', 'IFCNULLSTYLE' ) )
        .toEqual( [ 'IFCNULLSTYLE('.length, '.' ] )
  })

  test( 'leaves a bare value alone', () => {

    // Both forms are legal for a select member, so entering must be a no-op
    // on the bare one rather than a precondition.
    expect( enter( '.NULL.', 'NULL_STYLE' ) ).toEqual( [ 0, '.' ] )
  })

  test( 'does not treat a lower-case spelling as the type name', () => {

    // Not a policy choice here: StepEntityIdentifierParser matches
    // `[A-Z][A-Z0-9_]*`, so a lower-case wrapper is not an identifier at all
    // and the value is left to be read bare (where it then fails as the
    // malformed input it is).
    expect( enter( 'null_style(.NULL.)', 'NULL_STYLE' ) ).toEqual( [ 0, 'n' ] )
  })

  test( 'skips whitespace and comments before and after the paren', () => {

    const spaced = 'NULL_STYLE /* c */ ( /* d */ .NULL.)'

    expect( enter( spaced, 'NULL_STYLE' ) ).toEqual( [ spaced.indexOf( '.NULL.' ), '.' ] )
  })

  test( 'refuses a wrapper that is not this type', () => {

    // The point of verifying the name rather than skipping any identifier:
    // a mismatched wrapper stays a type error instead of being silently
    // read as the member it is not.
    expect( enter( 'SOME_OTHER_TYPE(.NULL.)', 'NULL_STYLE' ) ).toEqual( [ 0, 'S' ] )

    // A prefix must not match either - length is checked before the bytes.
    expect( enter( 'NULL_STYLE_EXTRA(.NULL.)', 'NULL_STYLE' ) ).toEqual( [ 0, 'N' ] )
  })

  test( 'refuses an identifier with no parenthesis', () => {

    expect( enter( 'NULL_STYLE', 'NULL_STYLE' ) ).toEqual( [ 0, 'N' ] )
    expect( enter( 'NULL_STYLE.NULL.', 'NULL_STYLE' ) ).toEqual( [ 0, 'N' ] )
  })

  test( 'refuses a reference or a bare number', () => {

    expect( enter( '#4085', 'NULL_STYLE' ) ).toEqual( [ 0, '#' ] )
    expect( enter( '0.7', 'NULL_STYLE' ) ).toEqual( [ 0, '0' ] )
  })
})
