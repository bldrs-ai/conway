/* eslint-disable no-magic-numbers */
// conway#541: the sidecar's trust gate is a hash of the source, and taking it
// the obvious way costs a second full read of the file — per consumer, if each
// verifies independently. Folding it into the parse's own pass is only sound
// if it produces the SAME digest `hashSource` does over a materialised buffer,
// so that equality is what this file pins, on the real window shapes the
// streaming builder produces.
import * as fs from 'fs'

import { describe, expect, test } from '@jest/globals'

import { BufferByteSource } from './byte_source'
import { HashingByteSource } from './source_hash'
import { hashSource } from './index_sidecar'


/**
 * Drive a hashing source the way the streaming index builder does: an
 * initial fill, then slides that keep an unconsumed tail and append fresh
 * bytes after it.
 *
 * @param bytes The source bytes.
 * @param windowBytes The window size.
 * @param tailBytes Bytes retained at each slide (the unconsumed record tail).
 * @return {Promise<number>} The digest.
 */
async function hashThroughWindow(
    bytes: Uint8Array,
    windowBytes: number,
    tailBytes: number ): Promise<number> {

  const source = new HashingByteSource( new BufferByteSource( bytes ) )
  const window = new Uint8Array( windowBytes )

  let windowStart = 0
  let windowLength = await source.read( 0, windowBytes, window, 0 )

  while ( windowStart + windowLength < bytes.length ) {

    const cursor = windowLength - tailBytes
    const tail = windowLength - cursor

    window.copyWithin( 0, cursor, windowLength )

    const got = await source.read(
        windowStart + windowLength, windowBytes - tail, window, tail )

    windowStart += cursor
    windowLength = tail + got
  }

  return await source.finishAsync()
}


describe( 'HashingByteSource', () => {

  test( 'reproduces hashSource over a real file, window shape and all', async () => {
    const bytes = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )

    // Several window/tail shapes, because the whole risk is a boundary being
    // hashed twice or not at all, and a single shape would only prove one.
    for ( const [ windowBytes, tailBytes ] of
      [ [ 4096, 1024 ], [ 1024, 3 ], [ 64, 63 ], [ bytes.length + 512, 0 ] ] ) {

      expect( await hashThroughWindow( bytes, windowBytes, tailBytes ) )
          .toBe( hashSource( bytes ) )
    }
  } )

  test( 'reproduces hashSource on pseudo-random bytes', async () => {
    const bytes = new Uint8Array( 200_000 )

    // Deterministic (a seeded LCG), so a failure is reproducible rather than
    // a once-a-week mystery.
    let state = 0x12345678

    for ( let where = 0; where < bytes.length; ++where ) {
      state = ( Math.imul( state, 1103515245 ) + 12345 ) >>> 0
      bytes[ where ] = ( state >>> 16 ) & 0xFF
    }

    expect( await hashThroughWindow( bytes, 4096, 97 ) ).toBe( hashSource( bytes ) )
  } )

  test( 'finishes the tail a parse stopped short of', async () => {
    // A parse ends at END-ISO-10303-21, which can be before the window
    // reaches EOF. The digest still has to cover the whole file.
    const bytes = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )
    const source = new HashingByteSource( new BufferByteSource( bytes ) )
    const window = new Uint8Array( 4096 )

    await source.read( 0, 4096, window, 0 )
    expect( source.covered ).toBe( 4096 )

    expect( await source.finishAsync() ).toBe( hashSource( bytes ) )
    expect( source.covered ).toBe( bytes.length )
  } )

  test( 'absorbs the grow-and-restart re-read from offset 0', async () => {
    // The builder doubles its window and re-parses from the start when a
    // record will not fit. Those bytes are already hashed; re-folding them
    // would silently produce a digest of a different byte string.
    const bytes = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )
    const source = new HashingByteSource( new BufferByteSource( bytes ) )

    const small = new Uint8Array( 2048 )
    await source.read( 0, 2048, small, 0 )

    const big = new Uint8Array( 8192 )
    await source.read( 0, 8192, big, 0 )

    expect( source.covered ).toBe( 8192 )
    expect( await source.finishAsync() ).toBe( hashSource( bytes ) )
  } )

  test( 'throws rather than hash a gap', async () => {
    // A hash that quietly means nothing is the failure worth being loud
    // about: it would still compare equal to itself and pass every gate.
    const source =
      new HashingByteSource( new BufferByteSource( new Uint8Array( 4096 ) ) )
    const into = new Uint8Array( 256 )

    await source.read( 0, 256, into, 0 )

    await expect( source.read( 512, 256, into, 0 ) )
        .rejects.toThrow( /sequential/ )
  } )
} )
