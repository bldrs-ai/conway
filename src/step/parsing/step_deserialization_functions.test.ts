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
