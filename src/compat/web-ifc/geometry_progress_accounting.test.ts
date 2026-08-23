/* eslint-disable no-magic-numbers */
// conway#565: the demand pumps' geometry progress counted RELATIONSHIPS,
// not the products under them. `IfcRelAggregates` is one unit of work
// however many products it carries, so SKYLARK250 — every product an
// aggregate target, two relationships, one holding ~1,960 products —
// reported `0/2` once, then `1/2` for 186 consecutive events, then `2/2`.
// A bar that moves once a second into the load and then sits at 50% for
// the remaining minute and a half of extraction.
//
// The fixture here is the same shape at a size a test can assert on:
// data/aggregate_paged_prefetch.ifc has ONE relationship carrying twelve
// related products, so a relationship-counted denominator undercounts the
// pass by eleven.
//
// Both pumps are covered. `pumpGeometryBatch_` (resident, what a
// synchronous embedder and most of the suite drive) and
// `extractGeometryBatchAsync`'s windowed branch (what Share drives) had
// the identical accounting, and #565 called out that fixing only the async
// twin leaves the other half reporting the old numbers.
import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import { IfcProduct } from '../../ifc/ifc4_gen'
import IfcStepModel from '../../ifc/ifc_step_model'
import { InMemoryStepByteStore } from '../../step/step_buffer_provider'
import { openStreamedIfcModelFromStore } from '../../ifc/ifc_stream_open'
import { IfcAPI } from './ifc_api'

const SETTINGS = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true }

/** Related products in data/aggregate_paged_prefetch.ifc's one relationship. */
const RELATED_PRODUCTS = 12

/** Relationships in the same fixture. */
const RELATIONSHIPS = 1

/**
 * Batch size for the progress pumps: one budget unit per call, so every
 * call is one reported progress event and the run-length assertions below
 * read directly as "how long did the bar sit still".
 */
const ONE_PER_CALL = 1

type ProgressEvent = { phase: string, completed: number, total?: number }

let api: IfcAPI
let buffer: Uint8Array
let productCount: number

/**
 * The longest run of consecutive events reporting the same `completed`.
 *
 * This is the shape #565 is about rather than a proxy for it: the defect
 * was never missing events (189 of them fired across the SKYLARK load), it
 * was that they all carried the same numbers.
 *
 * @param events The geometry-phase events, in order.
 * @return {number} Longest identical run.
 */
function longestStall( events: ProgressEvent[] ): number {

  let longest = 0
  let run = 0
  let previous: number | undefined

  for ( const event of events ) {

    run = event.completed === previous ? run + 1 : 1
    previous = event.completed

    if ( run > longest ) {
      longest = run
    }
  }

  return longest
}

beforeAll( async () => {
  api = new IfcAPI()
  await api.Init()

  buffer = new Uint8Array( fs.readFileSync( 'data/aggregate_paged_prefetch.ifc' ) )

  // Counted from the file rather than hard-coded, so the expected
  // denominator below stays true if the fixture gains a product.
  const open = await openStreamedIfcModelFromStore(
      new InMemoryStepByteStore( buffer ) )

  expect( open.model ).toBeDefined()

  productCount = [ ...( open.model as IfcStepModel ).types( IfcProduct ) ].length

  expect( productCount ).toBeGreaterThan( RELATED_PRODUCTS )
}, 240000 )

describe( 'geometry progress counts products, not relationships (conway#565)', () => {

  /**
   * Every product costs one unit whichever pass extracts it, plus the one
   * terminating `next()` each relationship spends returning `done`.
   *
   * The twelve related products are NOT double-counted: they are excluded
   * from the per-product worklist precisely because the aggregates pass is
   * their only extraction (see aggregateTargetLocalIDs), so the two passes
   * partition the product set rather than overlapping. Which is why the
   * relationship-counted denominator undercounted rather than merely being
   * coarse — it dropped eleven of the twelve entirely.
   *
   * @return {number} The expected geometry-phase denominator.
   */
  const expectedTotal = () => productCount + RELATIONSHIPS

  test( 'the resident pump reports a denominator in products', async () => {

    const events: ProgressEvent[] = []

    const deferredID = await api.OpenModelStreamed( buffer, {
      ...SETTINGS,
      DEFER_GEOMETRY: true,
      ON_PROGRESS: ( event: ProgressEvent ) => events.push( {
        phase: event.phase,
        completed: event.completed,
        total: event.total,
      } ),
    } )

    expect( deferredID ).toBeGreaterThanOrEqual( 0 )

    for ( ; ; ) {
      const { extracted, remaining } =
        api.ExtractGeometryBatch( deferredID, ONE_PER_CALL )

      if ( remaining === 0 && extracted === 0 ) {
        break
      }
    }

    const geometry = events.filter( ( event ) => event.phase === 'geometry' )

    expect( geometry.length ).toBeGreaterThan( 0 )

    // The assertion #565 turns on. Before the fix this read
    // `productCount - RELATED_PRODUCTS + RELATIONSHIPS` — eleven short.
    expect( geometry[ 0 ].total ).toBe( expectedTotal() )

    // A denominator only helps if the numerator reaches it.
    expect( geometry[ geometry.length - 1 ].completed ).toBe( expectedTotal() )

    // One budget unit per call, so the bar advances on every call but the
    // repeated end-of-phase one. The pre-fix pump stalled for twelve.
    expect( longestStall( geometry ) ).toBeLessThanOrEqual( 2 )

    api.CloseModel( deferredID )
  }, 240000 )

  test( 'the windowed async pump reports the same denominator', async () => {

    const events: ProgressEvent[] = []

    const deferredID = await api.OpenModelStream(
        new InMemoryStepByteStore( buffer ), {
          ...SETTINGS,
          DEFER_GEOMETRY: true,
          ON_PROGRESS: ( event: ProgressEvent ) => events.push( {
            phase: event.phase,
            completed: event.completed,
            total: event.total,
          } ),
        } )

    expect( deferredID ).toBeGreaterThanOrEqual( 0 )
    expect( api.getPassthrough( deferredID )!.sourceIsExternal ).toBe( true )

    for ( ; ; ) {
      // eslint-disable-next-line new-cap
      const { extracted, remaining } =
        await api.ExtractGeometryBatchAsync( deferredID, ONE_PER_CALL )

      if ( remaining === 0 && extracted === 0 ) {
        break
      }
    }

    const geometry = events.filter( ( event ) => event.phase === 'geometry' )

    expect( geometry.length ).toBeGreaterThan( 0 )
    expect( geometry[ 0 ].total ).toBe( expectedTotal() )
    expect( geometry[ geometry.length - 1 ].completed ).toBe( expectedTotal() )
    expect( longestStall( geometry ) ).toBeLessThanOrEqual( 2 )

    api.CloseModel( deferredID )
  }, 240000 )
} )
