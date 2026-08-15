import { describe, expect, test } from '@jest/globals'

import { wasmAddress } from './wasm_address'


const LOW_ADDRESS = 64
const SIGNED_2_GIB_ADDRESS = -2147483648
const UNSIGNED_2_GIB_ADDRESS = 2147483648


describe( 'wasmAddress', () => {

  test( 'preserves ordinary pointers', () => {
    expect( wasmAddress( LOW_ADDRESS ) ).toBe( LOW_ADDRESS )
  } )

  test( 'normalizes a signed pointer above 2 GiB', () => {
    expect( wasmAddress( SIGNED_2_GIB_ADDRESS ) )
      .toBe( UNSIGNED_2_GIB_ADDRESS )
  } )
} )
