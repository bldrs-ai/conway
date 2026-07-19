/* eslint-disable no-magic-numbers */
// M4: the range-fetched byte source models an HTTP-Range / block store — it
// returns exactly the requested bytes while accounting for the (possibly
// wider, block-aligned) fetch it would really incur. Index-first open reads
// back from those stats to prove it touched only a fraction of the file.
import { describe, expect, test } from '@jest/globals'

import { RangeByteSource } from './range_byte_source'

/**
 * A deterministic ramp buffer: byte i === i mod 256.
 *
 * @param n Length.
 * @return {Uint8Array} The buffer.
 */
function ramp( n: number ): Uint8Array {
  const bytes = new Uint8Array( n )

  for ( let where = 0; where < n; ++where ) {
    bytes[ where ] = where & 0xFF
  }

  return bytes
}

describe( 'RangeByteSource', () => {

  test( 'returns exactly the requested range', async () => {
    const source = new RangeByteSource( ramp( 1000 ) )

    const got = await source.read( 100, 16 )

    expect( got.byteLength ).toBe( 16 )
    expect( Array.from( got ) ).toEqual(
        Array.from( { length: 16 }, ( _v, i ) => ( 100 + i ) & 0xFF ) )
  } )

  test( 'unaligned reads fetch exactly what is served', async () => {
    const source = new RangeByteSource( ramp( 1000 ) )

    await source.read( 10, 20 )
    await source.read( 500, 4 )

    const stats = source.stats
    expect( stats.requestCount ).toBe( 2 )
    expect( stats.bytesServed ).toBe( 24 )
    expect( stats.bytesFetched ).toBe( 24 )
  } )

  test( 'block alignment over-reads to whole blocks', async () => {
    const source = new RangeByteSource( ramp( 10_000 ), 4096 )

    // A 10-byte read at offset 100 sits inside the first 4096-byte block.
    await source.read( 100, 10 )
    expect( source.stats.bytesFetched ).toBe( 4096 )
    expect( source.stats.bytesServed ).toBe( 10 )

    // A read straddling the first/second block boundary pulls two blocks.
    await source.read( 4090, 20 )
    expect( source.stats.bytesFetched ).toBe( 4096 + 8192 )
    expect( source.stats.bytesServed ).toBe( 30 )
  } )

  test( 'clamps reads at end of source', async () => {
    const source = new RangeByteSource( ramp( 100 ) )

    const got = await source.read( 90, 50 )

    expect( got.byteLength ).toBe( 10 )
    expect( source.stats.bytesServed ).toBe( 10 )
  } )

  test( 'a read fully past the end is empty and fetches nothing', async () => {
    const source = new RangeByteSource( ramp( 100 ) )

    const got = await source.read( 200, 10 )

    expect( got.byteLength ).toBe( 0 )
    expect( source.stats.bytesFetched ).toBe( 0 )
  } )

  test( 'block-aligned fetch never exceeds the source length', async () => {
    const source = new RangeByteSource( ramp( 5000 ), 4096 )

    // Last block is partial (5000 = 4096 + 904); fetching into it must clamp.
    await source.read( 4990, 10 )

    expect( source.stats.bytesFetched ).toBe( 5000 - 4096 )
    expect( source.stats.bytesFetched ).toBeLessThanOrEqual( 5000 )
  } )

  test( 'reports byteLength of the backing source', () => {
    expect( new RangeByteSource( ramp( 777 ) ).byteLength ).toBe( 777 )
  } )
} )
