const BINARY_LITERAL_4_TRAILING_ZEROS = 0b110010000
const BINARY_9_BITS_OF_32             = 0b11001000011000001100100000010000

import {describe, expect, test} from '@jest/globals'
import { extractOneHotLow, pop32 } from './bit_operations'


describe( 'Index Bit Operations Test', () => {
  test( 'extractOneHotLow()', () => {

     
    expect( extractOneHotLow( BINARY_LITERAL_4_TRAILING_ZEROS ) ).toBe( 4 )

  } )

  test( 'pop32()', () => {

     
    expect( pop32( BINARY_9_BITS_OF_32 ) ).toBe( 9 )

  } )

})
