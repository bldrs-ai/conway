/* eslint-disable no-magic-numbers */
// M3 production design: the geometry narrowing of the mem system, alone and
// composed with DemandGeometryQueue. The load-bearing assertions: shared
// representations are stored once and never freed while any product still
// holds them, and the queue's logical budget always covers the pool's
// physical use (so an extract can never blow the pool mid-flight).
import { describe, expect, test } from '@jest/globals'

import { DemandGeometryQueue } from './demand_geometry_queue'
import { GeometryAsset, GeometryTilePool, InstanceAssetSource } from './geometry_tile_pool'
import { ChunkedPool } from './mem/chunked_pool'

/**
 * A recording mock of the domain half: instance → assets from a fixture map,
 * with materialize/discard calls captured.
 *
 * @param composition Instance → assets fixture.
 * @return {object} `{ source, materialized, discarded }`.
 */
function mockSource( composition: Record<number, GeometryAsset<string>[]> ): {
  source: InstanceAssetSource<string>,
  materialized: string[],
  discarded: string[],
} {
  const materialized: string[] = []
  const discarded: string[] = []

  const source: InstanceAssetSource<string> = {
    assetsOf: ( instanceID ) => composition[ instanceID ] ?? [],
    materialize: ( assetID ) => {
      materialized.push( assetID )
    },
    discard: ( assetID ) => {
      discarded.push( assetID )
    },
  }

  return { source, materialized, discarded }
}

describe( 'GeometryTilePool', () => {

  test( 'a shared representation is materialised once and stored once', () => {
    // Products 1 and 2 both instance rep-X (mapped item); 2 also has its own.
    const { source, materialized } = mockSource( {
      1: [ { assetID: 'rep-X', byteSize: 100 } ],
      2: [ { assetID: 'rep-X', byteSize: 100 }, { assetID: 'rep-Y', byteSize: 100 } ],
    } )
    const tiles = new GeometryTilePool( new ChunkedPool( 1000, 100 ), source )

    tiles.extract( 1 )
    tiles.extract( 2 )

    expect( materialized ).toEqual( [ 'rep-X', 'rep-Y' ] )
    // Physically: two assets, 200 bytes — not 300.
    expect( tiles.assets.pool.bytesInUse ).toBe( 200 )
    expect( tiles.assets.refCountOf( 'rep-X' ) ).toBe( 2 )
  } )

  test( 'evicting one product never discards a representation another still renders', () => {
    const { source, discarded } = mockSource( {
      1: [ { assetID: 'rep-X', byteSize: 100 } ],
      2: [ { assetID: 'rep-X', byteSize: 100 } ],
    } )
    const tiles = new GeometryTilePool( new ChunkedPool( 1000, 100 ), source )

    tiles.extract( 1 )
    tiles.extract( 2 )

    tiles.release( 1 )
    expect( discarded ).toEqual( [] )
    expect( tiles.assets.isResident( 'rep-X' ) ).toBe( true )

    tiles.release( 2 )
    expect( discarded ).toEqual( [ 'rep-X' ] )
    expect( tiles.assets.pool.bytesInUse ).toBe( 0 )
  } )

  test( 'extract charges the logical (chunk-rounded, fully-charged) cost', () => {
    const { source } = mockSource( {
      1: [ { assetID: 'a', byteSize: 150 }, { assetID: 'b', byteSize: 10 } ],
      2: [ { assetID: 'a', byteSize: 150 } ],
    } )
    const tiles = new GeometryTilePool( new ChunkedPool( 1000, 100 ), source )

    // 150 → 200 rounded, 10 → 100 rounded.
    expect( tiles.extract( 1 ) ).toBe( 300 )
    // Sharing is deliberately double-charged logically (conservative)...
    expect( tiles.extract( 2 ) ).toBe( 200 )
    // ...while physical stays single-stored.
    expect( tiles.assets.pool.bytesInUse ).toBe( 300 )
  } )

  test( 'a failed extract unwinds cleanly, discarding what it materialised', () => {
    // Asset a fits; asset b cannot (pool holds 2 chunks, b needs 3). The
    // extract must throw, and the unwind must keep the materialize/discard
    // pairing for a (which it took to zero references) and leave the pool
    // exactly as before — a failed extract has no effect.
    const { source, materialized, discarded } = mockSource( {
      1: [ { assetID: 'a', byteSize: 100 }, { assetID: 'b', byteSize: 300 } ],
    } )
    const pool = new ChunkedPool( 200, 100 )
    const tiles = new GeometryTilePool( pool, source )

    expect( () => tiles.extract( 1 ) ).toThrow( /exhausted/ )

    expect( materialized ).toEqual( [ 'a' ] )
    expect( discarded ).toEqual( [ 'a' ] )
    expect( pool.bytesInUse ).toBe( 0 )
    expect( tiles.assets.isResident( 'a' ) ).toBe( false )
  } )

  test( 'a failed extract never discards an asset another instance still holds', () => {
    // Instance 1 holds shared. Instance 2 wants shared + big; big fails.
    // The unwind drops 2's reference on shared but must NOT discard it —
    // instance 1 still renders it.
    const { source, discarded } = mockSource( {
      1: [ { assetID: 'shared', byteSize: 100 } ],
      2: [ { assetID: 'shared', byteSize: 100 }, { assetID: 'big', byteSize: 300 } ],
    } )
    const pool = new ChunkedPool( 200, 100 )
    const tiles = new GeometryTilePool( pool, source )

    tiles.extract( 1 )
    expect( () => tiles.extract( 2 ) ).toThrow( /exhausted/ )

    expect( discarded ).toEqual( [] )
    expect( tiles.assets.isResident( 'shared' ) ).toBe( true )
    expect( tiles.assets.refCountOf( 'shared' ) ).toBe( 1 )
    expect( pool.bytesInUse ).toBe( 100 )
  } )

  test( 'double extract and unmatched release are errors', () => {
    const { source } = mockSource( { 1: [ { assetID: 'a', byteSize: 10 } ] } )
    const tiles = new GeometryTilePool( new ChunkedPool( 1000, 100 ), source )

    tiles.extract( 1 )
    expect( () => tiles.extract( 1 ) ).toThrow( /already extracted/ )
    expect( () => tiles.release( 2 ) ).toThrow( /un-extracted/ )
  } )

  test( 'a malformed byte size throws before any state changes', () => {
    // A buggy source returning a negative size must fail at zero state —
    // no references taken, nothing materialised, pool untouched.
    const { source, materialized } = mockSource( {
      1: [ { assetID: 'ok', byteSize: 100 }, { assetID: 'bad', byteSize: -5 } ],
    } )
    const pool = new ChunkedPool( 1000, 100 )
    const tiles = new GeometryTilePool( pool, source )

    expect( () => tiles.extract( 1 ) ).toThrow( /Invalid byte size/ )
    expect( materialized ).toEqual( [] )
    expect( pool.bytesInUse ).toBe( 0 )
    expect( tiles.assets.isResident( 'ok' ) ).toBe( false )
  } )

  test( 'composed with the demand queue: budget holds, shared reps survive eviction', () => {
    // 20 products all sharing one heavy rep, each with a light unique rep —
    // the mapped-item shape (fixtures, repeated windows).
    const composition: Record<number, GeometryAsset<string>[]> = {}

    for ( let id = 0; id < 20; ++id ) {
      composition[ id ] = [
        { assetID: 'shared-heavy', byteSize: 400 },
        { assetID: `unique-${id}`, byteSize: 100 },
      ]
    }

    const { source, materialized, discarded } = mockSource( composition )
    const pool = new ChunkedPool( 4000, 100 )
    const tiles = new GeometryTilePool( pool, source )
    // Queue budget == pool budget: the safety invariant under test.
    const queue = new DemandGeometryQueue( tiles, 4000 )

    // Stream demand across all 20 products with rising priority.
    for ( let id = 0; id < 20; ++id ) {
      queue.request( id, id )
      queue.pump()

      // Physical use never exceeds the logical budget the queue enforces.
      expect( pool.bytesInUse ).toBeLessThanOrEqual( queue.stats.residentBytes )
      expect( queue.stats.residentBytes ).toBeLessThanOrEqual( 4000 )
    }

    // The shared rep was materialised exactly once across all that churn...
    expect( materialized.filter( ( a ) => a === 'shared-heavy' ).length ).toBe( 1 )
    // ...and never discarded, because some product always held it.
    expect( discarded ).not.toContain( 'shared-heavy' )

    // Evicting everything finally discards it and empties the pool.
    queue.evictAll()
    expect( discarded ).toContain( 'shared-heavy' )
    expect( pool.bytesInUse ).toBe( 0 )
  } )

  test( 'composed queue at exact pool budget never exhausts the pool', () => {
    // Every product unique (worst case for the invariant: no sharing slack).
    const composition: Record<number, GeometryAsset<string>[]> = {}

    for ( let id = 0; id < 50; ++id ) {
      composition[ id ] = [ { assetID: `u-${id}`, byteSize: 190 } ]
    }

    const { source } = mockSource( composition )
    const pool = new ChunkedPool( 1000, 100 )
    const tiles = new GeometryTilePool( pool, source )
    const queue = new DemandGeometryQueue( tiles, 1000 )

    // 190 rounds to 200 → 5 tiles fit. Churn all 50 through; extract must
    // never throw pool-exhausted because logical charges cover physical.
    for ( let id = 0; id < 50; ++id ) {
      queue.request( id, id )
      queue.pump()
    }

    expect( queue.stats.residentCount ).toBe( 5 )
    expect( pool.bytesInUse ).toBe( 1000 )
    expect( pool.stats.failedAcquires ).toBe( 0 )
  } )
} )
