/* eslint-disable no-magic-numbers */
// mem: the fixed-chunk pool bounds resident memory by construction — acquire
// rounds to whole chunks, all-or-nothing, and the high-water mark can never
// exceed the budget.
import { describe, expect, test } from '@jest/globals'

import { ChunkedPool } from './chunked_pool'

describe( 'ChunkedPool', () => {

  test( 'sizes itself in whole chunks from the byte budget', () => {
    const pool = new ChunkedPool( 1050, 100 )

    expect( pool.totalChunks ).toBe( 10 )
    expect( pool.totalBytes ).toBe( 1000 )
    expect( pool.freeChunks ).toBe( 10 )
    expect( pool.bytesInUse ).toBe( 0 )
  } )

  test( 'acquire rounds up to whole chunks', () => {
    const pool = new ChunkedPool( 1000, 100 )

    const span = pool.acquire( 250 )

    expect( span?.chunks.length ).toBe( 3 )
    expect( span?.byteSize ).toBe( 250 )
    expect( pool.bytesInUse ).toBe( 300 )
    expect( pool.chunkRound( 250 ) ).toBe( 300 )
  } )

  test( 'acquire is all-or-nothing at exhaustion', () => {
    const pool = new ChunkedPool( 300, 100 )

    expect( pool.acquire( 200 ) ).toBeDefined()

    // 2 chunks needed, 1 free → refused with no state change.
    const refused = pool.acquire( 101 )
    expect( refused ).toBeUndefined()
    expect( pool.freeChunks ).toBe( 1 )
    expect( pool.stats.failedAcquires ).toBe( 1 )

    // Exactly one chunk still fits.
    expect( pool.acquire( 100 ) ).toBeDefined()
    expect( pool.freeChunks ).toBe( 0 )
  } )

  test( 'released chunks are reusable (steady-state churn stays bounded)', () => {
    const pool = new ChunkedPool( 500, 100 )

    for ( let round = 0; round < 50; ++round ) {
      const a = pool.acquire( 300 )
      const b = pool.acquire( 200 )
      expect( a ).toBeDefined()
      expect( b ).toBeDefined()
      expect( pool.bytesInUse ).toBe( 500 )
      pool.release( a! )
      pool.release( b! )
      expect( pool.bytesInUse ).toBe( 0 )
    }

    // The pool never grew: churn recycles the same chunks.
    expect( pool.totalChunks ).toBe( 5 )
    expect( pool.stats.acquires ).toBe( 100 )
    expect( pool.stats.releases ).toBe( 100 )
  } )

  test( 'a zero-byte acquire holds no chunks but round-trips', () => {
    const pool = new ChunkedPool( 100, 100 )

    const span = pool.acquire( 0 )
    expect( span?.chunks.length ).toBe( 0 )
    expect( pool.freeChunks ).toBe( 1 )
    pool.release( span! )
  } )

  test( 'rejects invalid construction', () => {
    expect( () => new ChunkedPool( 100, 0 ) ).toThrow()
    expect( () => new ChunkedPool( 50, 100 ) ).toThrow()
  } )
} )
