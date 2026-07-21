/* eslint-disable no-magic-numbers */
// Phase B: the pump must guarantee source residency BEFORE the synchronous
// extract runs, admit strictly by priority under the batch cap, coalesce
// re-entrant cycles, and survive prefetch failures without stalling.
import { describe, expect, test } from '@jest/globals'

import { DemandGeometryQueue, GeometryTiles } from './demand_geometry_queue'
import { DemandResidencyPump, ResidencyPrefetcher } from './demand_residency_pump'

/**
 * A mock tiles backend that records extraction order and asserts every
 * extracted product was made resident first.
 *
 * @param residentSource Set the prefetcher fills.
 * @return {object} `{ tiles, extracted }`.
 */
function residencyCheckedTiles( residentSource: Set<number> ): {
  tiles: GeometryTiles, extracted: number[],
} {
  const extracted: number[] = []

  const tiles: GeometryTiles = {
    extract( id ) {
      if ( !residentSource.has( id ) ) {
        throw new Error( `extract(${id}) before source residency` )
      }
      extracted.push( id )
      return 10
    },
    release() { /* tiles free */ },
  }

  return { tiles, extracted }
}

/**
 * A controllable prefetcher: records call order; optionally fails given ids.
 *
 * @param residentSource The set fulfilled prefetches add to.
 * @param failIDs IDs whose prefetch rejects.
 * @return {object} `{ prefetcher, calls }`.
 */
function mockPrefetcher( residentSource: Set<number>, failIDs: Set<number> = new Set() ): {
  prefetcher: ResidencyPrefetcher, calls: number[],
} {
  const calls: number[] = []

  const prefetcher: ResidencyPrefetcher = {
    ensureResidentByLocalID: async ( localID ) => {
      calls.push( localID )
      if ( failIDs.has( localID ) ) {
        throw new Error( `range fetch failed for ${localID}` )
      }
      residentSource.add( localID )
    },
  }

  return { prefetcher, calls }
}

describe( 'DemandResidencyPump', () => {

  test( 'prefetches source bytes before any synchronous extract', async () => {
    const residentSource = new Set<number>()
    const { tiles, extracted } = residencyCheckedTiles( residentSource )
    const { prefetcher, calls } = mockPrefetcher( residentSource )
    const pump = new DemandResidencyPump(
        new DemandGeometryQueue( tiles, 1000 ), prefetcher )

    pump.request( 1, 10 )
    pump.request( 2, 20 )

    const result = await pump.pump()

    // The residency-checked tiles throw if this ordering ever breaks.
    expect( result.extracted ).toBe( 2 )
    expect( new Set( calls ) ).toEqual( new Set( [ 1, 2 ] ) )
    expect( extracted ).toEqual( [ 2, 1 ] ) // still priority-ordered
  } )

  test( 'admits strictly by priority under the batch cap', async () => {
    const residentSource = new Set<number>()
    const { tiles, extracted } = residencyCheckedTiles( residentSource )
    const { prefetcher, calls } = mockPrefetcher( residentSource )
    const queue = new DemandGeometryQueue( tiles, 1_000_000 )
    const pump = new DemandResidencyPump( queue, prefetcher, 3 )

    for ( let id = 0; id < 10; ++id ) {
      pump.request( id, id ) // rising priority: 7, 8, 9 are most wanted
    }

    await pump.pump()

    expect( new Set( calls ) ).toEqual( new Set( [ 7, 8, 9 ] ) )
    expect( extracted ).toEqual( [ 9, 8, 7 ] )
    expect( pump.pendingCount ).toBe( 7 )

    await pump.pump()
    expect( extracted ).toEqual( [ 9, 8, 7, 6, 5, 4 ] )
  } )

  test( 'requesting a resident product refreshes ranking without prefetch', async () => {
    const residentSource = new Set<number>()
    const { tiles } = residencyCheckedTiles( residentSource )
    const { prefetcher, calls } = mockPrefetcher( residentSource )
    const queue = new DemandGeometryQueue( tiles, 1000 )
    const pump = new DemandResidencyPump( queue, prefetcher )

    pump.request( 1, 10 )
    await pump.pump()
    expect( calls ).toEqual( [ 1 ] )

    // Re-request while resident: no new prefetch, no new pending entry.
    pump.request( 1, 99 )
    expect( pump.pendingCount ).toBe( 0 )
    await pump.pump()
    expect( calls ).toEqual( [ 1 ] )
  } )

  test( 'a failed prefetch re-queues and later retries; others proceed', async () => {
    const residentSource = new Set<number>()
    const { tiles, extracted } = residencyCheckedTiles( residentSource )
    const failIDs = new Set( [ 2 ] )
    const { prefetcher } = mockPrefetcher( residentSource, failIDs )
    const pump = new DemandResidencyPump(
        new DemandGeometryQueue( tiles, 1000 ), prefetcher )

    pump.request( 1, 10 )
    pump.request( 2, 20 )

    const first = await pump.pump()

    expect( first.prefetchFailures ).toBe( 1 )
    expect( extracted ).toEqual( [ 1 ] )
    expect( pump.pendingCount ).toBe( 1 ) // 2 re-queued

    // The transient failure clears; the retry succeeds.
    failIDs.clear()
    const second = await pump.pump()

    expect( second.prefetchFailures ).toBe( 0 )
    expect( extracted ).toEqual( [ 1, 2 ] )
  } )

  test( 're-entrant pump calls coalesce onto the in-flight cycle', async () => {
    const residentSource = new Set<number>()
    const { tiles } = residencyCheckedTiles( residentSource )
    const { prefetcher, calls } = mockPrefetcher( residentSource )
    const pump = new DemandResidencyPump(
        new DemandGeometryQueue( tiles, 1000 ), prefetcher )

    pump.request( 1, 10 )

    const a = pump.pump()
    const b = pump.pump()

    expect( b ).toBe( a ) // same promise, no interleaved second cycle
    await a
    expect( calls ).toEqual( [ 1 ] )

    // After settling, pump() starts a fresh cycle.
    pump.request( 2, 5 )
    await pump.pump()
    expect( calls ).toEqual( [ 1, 2 ] )
  } )

  test( 'an empty admission cycle still drains the queue-side pending set', async () => {
    const residentSource = new Set<number>( [ 1, 2 ] )
    const { tiles, extracted } = residencyCheckedTiles( residentSource )
    const { prefetcher } = mockPrefetcher( residentSource )
    // Tiny budget: only one of the two fits per pump; the loser stays
    // pending inside the QUEUE (deferred by budget), not the pump.
    const queue = new DemandGeometryQueue( tiles, 10 )
    const pump = new DemandResidencyPump( queue, prefetcher )

    pump.request( 1, 10 )
    pump.request( 2, 20 )
    await pump.pump()

    expect( extracted ).toEqual( [ 2 ] )
    expect( queue.stats.pendingCount ).toBe( 1 )

    // No new admissions; the cycle still gives the queue its pump call.
    // (1 cannot displace 2 at this budget, so it stays pending — the point
    // is the queue got the chance.)
    const result = await pump.pump()
    expect( result.extracted ).toBe( 0 )
    expect( queue.stats.pendingCount ).toBe( 1 )
  } )
} )
