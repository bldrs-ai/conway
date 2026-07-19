/* eslint-disable no-magic-numbers */
// M3: the demand-geometry scheduler — priority ordering, byte budget, and
// eviction — tested against a mock tiles backend so the policy is settled
// independently of the wasm extract/reclaim work.
import { describe, expect, test } from '@jest/globals'

import { DemandGeometryQueue, GeometryTiles } from './demand_geometry_queue'

/**
 * A mock tiles backend: every product costs a fixed number of bytes and
 * records the extract/release calls so tests can assert on them.
 *
 * @param costBytes Per-tile resident cost.
 * @return {object} `{ tiles, extracted, released }`.
 */
function mockTiles( costBytes: number ) {
  const extracted: number[] = []
  const released: number[] = []
  const tiles: GeometryTiles = {
    extract( id ) {
      extracted.push( id )
      return costBytes
    },
    release( id ) {
      released.push( id )
    },
  }
  return { tiles, extracted, released }
}

describe( 'DemandGeometryQueue', () => {

  test( 'materialises highest-priority requests first', () => {
    const { tiles, extracted } = mockTiles( 10 )
    const q = new DemandGeometryQueue( tiles, 1000 )

    q.request( 1, 5 )
    q.request( 2, 50 )
    q.request( 3, 20 )
    q.pump()

    // Extracted in descending priority: 2 (50), 3 (20), 1 (5).
    expect( extracted ).toEqual( [ 2, 3, 1 ] )
    expect( q.stats.residentCount ).toBe( 3 )
    expect( q.stats.residentBytes ).toBe( 30 )
  } )

  test( 'evicts the lowest-priority tile when the budget is exceeded', () => {
    const { tiles, released } = mockTiles( 100 )
    // Budget holds 3 tiles (300).
    const q = new DemandGeometryQueue( tiles, 300 )

    for ( const [ id, pri ] of [ [ 1, 10 ], [ 2, 20 ], [ 3, 30 ] ] ) {
      q.request( id, pri )
    }
    q.pump()
    expect( q.stats.residentCount ).toBe( 3 )

    // A 4th, higher-priority request must evict the lowest (id 1, pri 10).
    q.request( 4, 40 )
    q.pump()

    expect( q.isResident( 4 ) ).toBe( true )
    expect( q.isResident( 1 ) ).toBe( false )
    expect( released ).toContain( 1 )
    expect( q.stats.residentBytes ).toBeLessThanOrEqual( 300 )
  } )

  test( 'a request below every resident tile does not displace them', () => {
    const { tiles, extracted } = mockTiles( 100 )
    const q = new DemandGeometryQueue( tiles, 200 ) // holds 2

    q.request( 1, 50 )
    q.request( 2, 40 )
    q.pump()
    expect( q.stats.residentCount ).toBe( 2 )

    // Low-priority newcomer can't beat either resident tile → stays pending.
    q.request( 3, 5 )
    const n = q.pump()
    expect( n ).toBe( 0 )
    expect( q.isResident( 3 ) ).toBe( false )
    expect( extracted ).toEqual( [ 1, 2 ] )
    expect( q.stats.pendingCount ).toBe( 1 )
  } )

  test( 're-requesting an evicted product re-extracts it', () => {
    const { tiles, extracted } = mockTiles( 100 )
    const q = new DemandGeometryQueue( tiles, 100 ) // holds 1

    q.request( 1, 10 )
    q.pump()
    q.request( 2, 20 ) // evicts 1
    q.pump()
    expect( q.isResident( 1 ) ).toBe( false )

    q.request( 1, 30 ) // evicts 2, re-extracts 1
    q.pump()
    expect( q.isResident( 1 ) ).toBe( true )
    // 1 extracted twice (first fill, then re-fill after eviction).
    expect( extracted.filter( ( id ) => id === 1 ).length ).toBe( 2 )
  } )

  test( 'requesting an already-resident product does not re-extract', () => {
    const { tiles, extracted } = mockTiles( 10 )
    const q = new DemandGeometryQueue( tiles, 1000 )

    q.request( 1, 10 )
    q.pump()
    q.request( 1, 99 ) // already resident — just bumps ranking
    q.pump()

    expect( extracted ).toEqual( [ 1 ] )
  } )

  test( 'a per-pump extraction cap bounds work per call', () => {
    const { tiles } = mockTiles( 1 )
    const q = new DemandGeometryQueue( tiles, 1_000_000 )

    for ( let id = 0; id < 100; ++id ) {
      q.request( id, id )
    }
    expect( q.pump( 10 ) ).toBe( 10 )
    expect( q.stats.residentCount ).toBe( 10 )
    expect( q.stats.pendingCount ).toBe( 90 )
  } )

  test( 'evictAll releases everything', () => {
    const { tiles, released } = mockTiles( 10 )
    const q = new DemandGeometryQueue( tiles, 1000 )

    for ( let id = 0; id < 5; ++id ) {
      q.request( id, id )
    }
    q.pump()
    q.evictAll()

    expect( q.stats.residentCount ).toBe( 0 )
    expect( q.stats.residentBytes ).toBe( 0 )
    expect( released.sort() ).toEqual( [ 0, 1, 2, 3, 4 ] )
  } )

  test( 'keeps the resident set bounded by the budget across a demand stream', () => {
    const { tiles } = mockTiles( 100 )
    const q = new DemandGeometryQueue( tiles, 500 ) // holds 5

    // A moving "viewport": 200 products stream past with rising priority.
    for ( let id = 0; id < 200; ++id ) {
      q.request( id, id )
      q.pump()
      expect( q.stats.residentBytes ).toBeLessThanOrEqual( 500 )
    }
    // The 5 most-wanted (highest ids) remain.
    expect( q.stats.residentCount ).toBe( 5 )
    for ( const id of [ 195, 196, 197, 198, 199 ] ) {
      expect( q.isResident( id ) ).toBe( true )
    }
  } )
} )
