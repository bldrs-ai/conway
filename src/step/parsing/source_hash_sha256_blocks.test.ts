/* eslint-disable no-magic-numbers */
// bldrs-ai/Share#2092: the FNV-1a source hash is a per-byte JS loop folded
// into the parse's reads, and on Firefox's engine worker it and the sidecar
// export cost ~10 s of a 40.7 s PSB parse. `'sha256Blocks'` moves the
// per-byte work to the platform's native digest. What this file pins:
//
//  - the digest is the documented definition (checked against node:crypto,
//    an independent SHA-256), at the block edges;
//  - it does not depend on the shape of the reads that fed it — the
//    streaming builder's overlapping window slides, a parse that stops
//    short of EOF, one whole-buffer read — so a parse and a later verify
//    over a store always agree;
//  - the parse's thread runs no per-byte loop over the source under it,
//    counted rather than timed: every source byte reaches the native digest
//    exactly once, and `Math.imul` (the FNV loop's step) runs only for the
//    sampled digest's ~0.5 MB, not once per source byte;
//  - the digests left running are bounded, and a failed one fails the hash.
import { createHash } from 'crypto'

import { afterEach, describe, expect, jest, test } from '@jest/globals'

import { BufferByteSource, ReadableByteSource } from './byte_source'
import {
  HashingByteSource,
  hashSourceAsync,
  MAX_BLOCK_DIGESTS_IN_FLIGHT,
  nativeDigestProvider,
  resolveSourceHashAlgorithm,
  SOURCE_HASH_BLOCK_BYTES,
  SourceDigestProvider,
  sourceHashOptionsFor,
} from './source_hash'
import {
  hashSampledBuffer,
  hashSource,
  sampledSourceSpans,
} from './index_sidecar'


const BLOCK = SOURCE_HASH_BLOCK_BYTES

afterEach( () => {
  jest.restoreAllMocks()
} )


/**
 * Run `body` on a platform with no WebCrypto (Node before 19, an insecure
 * browser context): `globalThis.crypto` is a plain data property in
 * Node/Jest, so it is redefined and put back rather than spied on.
 *
 * @param body What to run.
 */
function withoutWebCrypto( body: () => void ): void {

  const descriptor = Object.getOwnPropertyDescriptor( globalThis, 'crypto' )

  Object.defineProperty( globalThis, 'crypto', { value: void 0, configurable: true, writable: true } )

  try {
    body()
  } finally {
    if ( descriptor !== void 0 ) {
      Object.defineProperty( globalThis, 'crypto', descriptor )
    } else {
      delete ( globalThis as { crypto?: unknown } ).crypto
    }
  }
}


/**
 * Deterministic, non-repeating bytes (an LCG), so a block swapped for
 * another would change the digest.
 *
 * @param length How many.
 * @param seed The seed.
 * @return {Uint8Array} The bytes.
 */
function bytesOf( length: number, seed = 1 ): Uint8Array {

  const bytes = new Uint8Array( length )
  let state = seed >>> 0

  for ( let where = 0; where < length; ++where ) {
    state = ( Math.imul( state, 1664525 ) + 1013904223 ) >>> 0
    bytes[ where ] = state >>> 24
  }

  return bytes
}


/**
 * The `'sha256Blocks'` definition (`Sha256BlockFold`), computed with
 * node:crypto rather than the code under test.
 *
 * @param bytes The source.
 * @return {number} The digest.
 */
function referenceDigest( bytes: Uint8Array ): number {

  const chain = createHash( 'sha256' )
  const length = Buffer.alloc( 8 )

  length.writeDoubleLE( bytes.byteLength, 0 )
  chain.update( length )

  for ( let at = 0; at < bytes.byteLength; at += BLOCK ) {
    chain.update(
        createHash( 'sha256' ).update( bytes.subarray( at, Math.min( at + BLOCK, bytes.byteLength ) ) ).digest() )
  }

  return chain.digest().readUInt32LE( 0 )
}


/**
 * A provider over the real one that counts what it is handed.
 *
 * @return {object} The provider and its counters.
 */
function countingProvider() {

  const native = nativeDigestProvider()!
  const counts = { calls: 0, bytes: 0, maxInFlight: 0, inFlight: 0 }

  const provider: SourceDigestProvider = {
    digest: async ( algorithm, data ) => {

      ++counts.calls
      counts.bytes += data.byteLength
      counts.maxInFlight = Math.max( counts.maxInFlight, ++counts.inFlight )

      // Copy now, as WebCrypto does, then resolve on a later task so the
      // feeder genuinely runs ahead of the digests.
      const copy = data.slice()

      await new Promise( ( resolve ) => setTimeout( resolve, 0 ) )

      const digest = await native.digest( algorithm, copy )

      --counts.inFlight

      return digest
    },
  }

  return { provider, counts }
}


/**
 * Drive a hashing source the way the streaming index builder does: a fill,
 * then slides that keep an unconsumed tail and append fresh bytes after it.
 * Every read lands in the SAME window buffer, which the next read
 * overwrites — so this also proves the digest copies what it is handed.
 *
 * @param hashing The source.
 * @param windowBytes The window size.
 * @param tailBytes Bytes kept at each slide.
 * @param stopAt Stop reading once the window reaches this offset (the
 * parse that ends at `END-ISO-10303-21` short of EOF).
 * @return {Promise<number>} The digest.
 */
async function hashThroughWindow(
    hashing: HashingByteSource,
    windowBytes: number,
    tailBytes: number,
    stopAt = hashing.byteLength ): Promise< number > {

  const window = new Uint8Array( windowBytes )
  let windowStart = 0
  let fill = await hashing.read( 0, windowBytes, window, 0 )

  while ( windowStart + fill < stopAt ) {

    const keep = Math.min( tailBytes, fill )

    window.copyWithin( 0, fill - keep, fill )
    windowStart += fill - keep

    const got = await hashing.read( windowStart + keep, windowBytes - keep, window, keep )

    if ( got === 0 ) {
      break
    }

    fill = keep + got
  }

  return await hashing.finishAsync()
}


describe( 'the sha256Blocks digest (bldrs-ai/Share#2092)', () => {

  test.each( [ 0, 1, BLOCK - 1, BLOCK, BLOCK + 1, 2 * BLOCK + 3 ] )(
      'matches its definition at length %i', async ( length ) => {

        const bytes = bytesOf( length )

        expect( await hashSourceAsync(
            new BufferByteSource( bytes ), void 0, { algorithm: 'sha256Blocks' } ) )
            .toBe( referenceDigest( bytes ) )
      } )

  test( 'is the same digest whatever reads fed it', async () => {

    const bytes = bytesOf( 2 * BLOCK + 12345 )
    const expected = referenceDigest( bytes )
    const make = () =>
      new HashingByteSource( new BufferByteSource( bytes ), { algorithm: 'sha256Blocks' } )

    // Window slides that straddle every block boundary, the builder's shape.
    expect( await hashThroughWindow( make(), 1024 * 1024 + 7, 4099 ) ).toBe( expected )
    // Windows larger than a block, so some blocks pass straight through.
    expect( await hashThroughWindow( make(), BLOCK + BLOCK / 2, 1000 ) ).toBe( expected )
    // A parse that stops early: finishAsync reads and folds the tail.
    expect( await hashThroughWindow( make(), 3 * 1024 * 1024, 17, BLOCK / 2 ) ).toBe( expected )
    // The verify's own reads: a chunk-at-a-time pass with another chunk size.
    expect( await hashSourceAsync(
        new BufferByteSource( bytes ), 3 * 1024 * 1024 + 1, { algorithm: 'sha256Blocks' } ) )
        .toBe( expected )
  } )

  test( 'differs from FNV-1a, and FNV-1a is still the default', async () => {

    const bytes = bytesOf( BLOCK + 99 )
    const fnv = new HashingByteSource( new BufferByteSource( bytes ) )

    expect( fnv.algorithm ).toBe( 'fnv1a32' )
    expect( await hashThroughWindow( fnv, 1 << 20, 64 ) ).toBe( hashSource( bytes ) )
    expect( await hashSourceAsync( new BufferByteSource( bytes ) ) ).toBe( hashSource( bytes ) )
    expect( referenceDigest( bytes ) ).not.toBe( hashSource( bytes ) )
  } )

  test( 'keeps the sampled digest FNV-1a, unchanged', async () => {

    const bytes = bytesOf( 2 * BLOCK + 5 )
    const hashing =
      new HashingByteSource( new BufferByteSource( bytes ), { algorithm: 'sha256Blocks' } )

    await hashThroughWindow( hashing, 1 << 20, 100 )

    expect( hashing.sampledHash ).toBe( hashSampledBuffer( bytes ) )
  } )
} )


describe( 'no per-byte JS loop runs over the source (bldrs-ai/Share#2092)', () => {

  // Counted, not timed. The FNV fold calls Math.imul once per byte; under
  // sha256Blocks the only JS loop left over the bytes is the sampled
  // digest's, over sampledSourceSpans (~0.5 MB). Spying on Math.imul counts
  // both folds in this module and in index_sidecar.ts, so the bound below
  // fails if either one runs over the whole source.
  const length = BLOCK + 54321
  const sampledBytes = sampledSourceSpans( length )
      .reduce( ( sum, [ start, end ] ) => sum + end - start, 0 )
  // The sampled digest's seed is the length as 8 bytes, folded too.
  const sampledFoldBytes = sampledBytes + 8

  test( 'every source byte reaches the native digest exactly once', async () => {

    const bytes = bytesOf( length )
    const { provider, counts } = countingProvider()
    const hashing = new HashingByteSource(
        new BufferByteSource( bytes ), { algorithm: 'sha256Blocks', provider } )

    const imul = jest.spyOn( Math, 'imul' )
    const digest = await hashThroughWindow( hashing, 1024 * 1024 + 3, 777 )

    expect( imul.mock.calls.length ).toBeLessThanOrEqual( sampledFoldBytes )
    imul.mockRestore()

    expect( digest ).toBe( referenceDigest( bytes ) )
    expect( hashing.nativeDigestBytes ).toBe( length )
    // The block digests' inputs are the source, once; the final digest's
    // is the chain (8 + 32 per block).
    const blocks = Math.ceil( length / BLOCK )

    expect( counts.calls ).toBe( blocks + 1 )
    expect( counts.bytes ).toBe( length + 8 + 32 * blocks )
  } )

  test( '...while the FNV-1a fold does run once per byte (the count can fail)', async () => {

    const bytes = bytesOf( length )
    const hashing = new HashingByteSource( new BufferByteSource( bytes ) )
    const imul = jest.spyOn( Math, 'imul' )

    await hashThroughWindow( hashing, 1024 * 1024 + 3, 777 )

    expect( imul.mock.calls.length ).toBeGreaterThanOrEqual( length )
    expect( hashing.nativeDigestBytes ).toBe( 0 )
  } )
} )


describe( 'the block digests left running are bounded', () => {

  test( 'one block per read never leaves more than the bound running', async () => {

    // Contents do not matter here, only the count of blocks.
    const bytes = new Uint8Array( 12 * BLOCK )

    for ( let block = 0; block < 12; ++block ) {
      bytes.fill( block, block * BLOCK, ( block + 1 ) * BLOCK )
    }

    const { provider, counts } = countingProvider()
    const hashing = new HashingByteSource(
        new BufferByteSource( bytes ), { algorithm: 'sha256Blocks', provider } )
    const window = new Uint8Array( BLOCK )

    for ( let at = 0; at < bytes.byteLength; at += BLOCK ) {
      await hashing.read( at, BLOCK, window, 0 )
    }

    expect( await hashing.finishAsync() ).toBe( referenceDigest( bytes ) )
    // The bound, plus the block the read that waits has just started.
    expect( counts.maxInFlight ).toBeLessThanOrEqual( MAX_BLOCK_DIGESTS_IN_FLIGHT + 1 )
    // ...and the feeder did run ahead of the digests, or the bound was
    // never exercised.
    expect( counts.maxInFlight ).toBeGreaterThan( 1 )
  } )

  test( 'a failed block digest fails the hash', async () => {

    const provider: SourceDigestProvider = {
      digest: () => Promise.reject( new Error( 'digest refused' ) ),
    }
    const source: ReadableByteSource = new BufferByteSource( bytesOf( BLOCK + 1 ) )

    await expect( hashSourceAsync( source, void 0, { algorithm: 'sha256Blocks', provider } ) )
        .rejects.toThrow( 'digest refused' )
  } )
} )


describe( 'resolveSourceHashAlgorithm', () => {

  test( 'asks for the block digest only where there is a digest to run it', () => {

    const provider = nativeDigestProvider()

    expect( provider ).toBeDefined()
    expect( resolveSourceHashAlgorithm( 'sha256Blocks', provider ) ).toBe( 'sha256Blocks' )
    expect( resolveSourceHashAlgorithm( 'sha256Blocks', void 0 ) ).toBe( 'fnv1a32' )
    expect( resolveSourceHashAlgorithm( void 0, provider ) ).toBe( 'fnv1a32' )
    expect( resolveSourceHashAlgorithm( 'fnv1a32', provider ) ).toBe( 'fnv1a32' )
  } )

  test( 'a hasher asked for it with no digest refuses rather than recording FNV', () => {

    withoutWebCrypto( () => {

      expect( nativeDigestProvider() ).toBeUndefined()
      expect( sourceHashOptionsFor( 'sha256Blocks' ).algorithm ).toBe( 'fnv1a32' )
      expect( () => new HashingByteSource(
          new BufferByteSource( bytesOf( 4 ) ), { algorithm: 'sha256Blocks' } ) )
          .toThrow( /no crypto\.subtle\.digest/ )
    } )
  } )
} )
