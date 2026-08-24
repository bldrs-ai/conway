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

import { beforeAll, describe, expect, jest, test } from '@jest/globals'

import { ConwayGeometry } from '../../../dependencies/conway-geom'
import { IfcGeometryExtraction } from '../../ifc/ifc_geometry_extraction'
import { IfcProduct, IfcRelAggregates } from '../../ifc/ifc4_gen'
import IfcStepModel from '../../ifc/ifc_step_model'
import IfcStepParser from '../../ifc/ifc_step_parser'
import ParsingBuffer from '../../parsing/parsing_buffer'
import {
  InMemoryStepByteStore,
  StepBufferNotResidentError,
  WindowedStepBufferProvider,
} from '../../step/step_buffer_provider'
import { openStreamedIfcModelFromStore } from '../../ifc/ifc_stream_open'
import { IfcAPI } from './ifc_api'
import Logger from '../../logging/logger'

const SETTINGS = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true }

/** Related products in data/aggregate_paged_prefetch.ifc's one relationship. */
const RELATED_PRODUCTS = 12

/** Relationships in the same fixture. */
const RELATIONSHIPS = 1

/** Window for the non-residency case: small enough to evict. */
const CRAMPED_CHUNK = 4 * 1024

/** Chunks the cramped window keeps. */
const CRAMPED_RESIDENT_CHUNKS = 2

/**
 * Batch size for the progress pumps: one budget unit per call, so every
 * call is one reported progress event and the run-length assertions below
 * read directly as "how long did the bar sit still".
 */
const ONE_PER_CALL = 1

type ProgressEvent = { phase: string, completed: number, total?: number }

/**
 * One drained pump run: its geometry events, its `remaining` series, and
 * how many meshes the model held at the end.
 *
 * The mesh count is what separates "the load survived" from "the load
 * survived by extracting nothing" — the failure mode a blanket catch over
 * a paging error would produce.
 */
type PumpRun =
  { geometry: ProgressEvent[], remaining: number[], meshes: number }

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

/**
 * The largest single fall in `remaining` between consecutive pump calls.
 *
 * Read off the pump's own return value rather than off the progress
 * events, deliberately: the tracker coalesces updates, so this fixture's
 * fifteen pump calls surface as two `geometry` events and a jump between
 * them is invisible there. `remaining` is reported by every call.
 *
 * With one budget unit per call an honest denominator falls by exactly
 * one. A denominator that counted work the pass will not run cannot fall
 * that way: it walks down through the counted prefix one unit at a time
 * and then drops the whole uncounted-for tail at once, the moment the
 * cursors say the pass is drained. That single drop is the "jumps forward
 * by thousands of products" of the conway#569 review.
 *
 * @param remaining The `remaining` each pump call returned, in order.
 * @return {number} Largest fall; 0 for fewer than two calls.
 */
function largestDrop( remaining: number[] ): number {

  let largest = 0

  for ( let where = 1; where < remaining.length; ++where ) {

    const fall = remaining[ where - 1 ] - remaining[ where ]

    if ( fall > largest ) {
      largest = fall
    }
  }

  return largest
}

/**
 * Drive the RESIDENT pump — what a synchronous embedder and most of the
 * suite run — over `source` to exhaustion, one budget unit per call.
 *
 * @param source The IFC bytes to open.
 * @return {Promise<PumpRun>} The geometry-phase events and the `remaining`
 * series, both in order.
 */
async function pumpResident( source: Uint8Array ): Promise< PumpRun > {

  const events: ProgressEvent[] = []
  const remainingSeries: number[] = []

  let meshes = 0

  const deferredID = await api.OpenModelStreamed( source, {
    ...SETTINGS,
    DEFER_GEOMETRY: true,
    ON_PROGRESS: ( event: ProgressEvent ) => events.push( {
      phase: event.phase,
      completed: event.completed,
      total: event.total,
    } ),
  } )

  expect( deferredID ).toBeGreaterThanOrEqual( 0 )

  try {

    for ( ; ; ) {
      const { extracted, remaining } =
        api.ExtractGeometryBatch( deferredID, ONE_PER_CALL )

      if ( remaining === 0 && extracted === 0 ) {
        break
      }

      remainingSeries.push( remaining )
    }

    meshes = api.LoadAllGeometry( deferredID ).size()

  } finally {
    api.CloseModel( deferredID )
  }

  const geometry = events.filter( ( event ) => event.phase === 'geometry' )

  expect( geometry.length ).toBeGreaterThan( 0 )

  return { geometry, remaining: remainingSeries, meshes }
}

/**
 * Drive the WINDOWED async pump — what Share drives — over `source` to
 * exhaustion, one budget unit per call.
 *
 * @param source The IFC bytes to serve through a store.
 * @return {Promise<PumpRun>} The geometry-phase events and the `remaining`
 * series, both in order.
 */
async function pumpWindowed( source: Uint8Array ): Promise< PumpRun > {

  const events: ProgressEvent[] = []
  const remainingSeries: number[] = []

  let meshes = 0

  const deferredID = await api.OpenModelStream(
      new InMemoryStepByteStore( source ), {
        ...SETTINGS,
        DEFER_GEOMETRY: true,
        ON_PROGRESS: ( event: ProgressEvent ) => events.push( {
          phase: event.phase,
          completed: event.completed,
          total: event.total,
        } ),
      } )

  expect( deferredID ).toBeGreaterThanOrEqual( 0 )

  // The branch under test only exists on an external source: a store-backed
  // open is what runs the paged aggregate-target walk that captures the
  // counts.
  expect( api.getPassthrough( deferredID )!.sourceIsExternal ).toBe( true )

  try {

    for ( ; ; ) {
      // eslint-disable-next-line new-cap
      const { extracted, remaining } =
        await api.ExtractGeometryBatchAsync( deferredID, ONE_PER_CALL )

      if ( remaining === 0 && extracted === 0 ) {
        break
      }

      remainingSeries.push( remaining )
    }

    meshes = api.LoadAllGeometry( deferredID ).size()

  } finally {
    api.CloseModel( deferredID )
  }

  const geometry = events.filter( ( event ) => event.phase === 'geometry' )

  expect( geometry.length ).toBeGreaterThan( 0 )

  return { geometry, remaining: remainingSeries, meshes }
}

/**
 * Products the target walk defers to the aggregates pass for `source`.
 *
 * A plain resident parse, which is the walk both pumps' worklists are
 * partitioned by. Measured rather than assumed because how a MALFORMED
 * relationship splits is precisely what conway#568 changed.
 *
 * @param source The IFC bytes.
 * @return {Promise<number>} Size of the deferral set.
 */
async function deferredTargetCount( source: Uint8Array ): Promise< number > {

  const parser = IfcStepParser.Instance
  const parsing = new ParsingBuffer( source )

  parser.parseHeader( parsing )

  const model = parser.parseDataToModel( parsing )[ 1 ] as IfcStepModel

  const geometry = new ConwayGeometry()

  expect( await geometry.initialize() ).toBe( true )

  return new IfcGeometryExtraction( geometry, model )
      .aggregateTargetLocalIDs().size
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

    const { geometry } = await pumpResident( buffer )

    // The assertion #565 turns on. Before the fix this read
    // `productCount - RELATED_PRODUCTS + RELATIONSHIPS` — eleven short.
    expect( geometry[ 0 ].total ).toBe( expectedTotal() )

    // A denominator only helps if the numerator reaches it.
    expect( geometry[ geometry.length - 1 ].completed ).toBe( expectedTotal() )

    // One budget unit per call, so the bar advances on every call but the
    // repeated end-of-phase one. The pre-fix pump stalled for twelve.
    expect( longestStall( geometry ) ).toBeLessThanOrEqual( 2 )
  }, 240000 )

  test( 'the windowed async pump reports the same denominator', async () => {

    const { geometry } = await pumpWindowed( buffer )

    expect( geometry[ 0 ].total ).toBe( expectedTotal() )
    expect( geometry[ geometry.length - 1 ].completed ).toBe( expectedTotal() )
    expect( longestStall( geometry ) ).toBeLessThanOrEqual( 2 )
  }, 240000 )
} )

describe('the counts cost only the path that reads them (conway#569 review)', () => {

  /**
   * A fresh extraction over the fixture, plus the model it walks.
   *
   * @param source The IFC bytes.
   * @param windowed Whether to open through a store, so the paged walk runs.
   * @return {Promise<object>} The extraction and its model.
   */
  async function extractionFor( windowed: boolean ):
      Promise< { extraction: IfcGeometryExtraction, model: IfcStepModel } > {

    let model: IfcStepModel

    if ( windowed ) {

      const open = await openStreamedIfcModelFromStore(
          new InMemoryStepByteStore( buffer ) )

      expect( open.model ).toBeDefined()

      model = open.model as IfcStepModel

      expect( model.isSourceExternal ).toBe( true )

    } else {

      // A plain resident parse — the shape the whole-model extraction and a
      // synchronous embedder both take, and the one where
      // ensureAggregateTargetLocalIDs short-circuits to the sync walk.
      const parser = IfcStepParser.Instance
      const parsing = new ParsingBuffer( buffer )

      parser.parseHeader( parsing )

      model = parser.parseDataToModel( parsing )[ 1 ] as IfcStepModel

      expect( model.isSourceExternal ).toBe( false )
    }

    const geometry = new ConwayGeometry()

    expect( await geometry.initialize() ).toBe( true )

    return { extraction: new IfcGeometryExtraction( geometry, model ), model }
  }

  test( 'the sync walk collects no counts at all', async () => {
    // The walk the WHOLE-MODEL extraction shares. It used to fill a
    // Map<relationship, count> and keep it for the model's life, for a
    // reader that path does not have. Measured on an adverse model — 50,000
    // relationships over 100,000 products — that was 1.75 MB retained at
    // 36.7 bytes per relationship, beside the 16.4 MB the target Set from
    // the same walk retains. Now nothing.
    const { extraction } = await extractionFor( false )

    const targets = extraction.aggregateTargetLocalIDs()

    expect( targets.size ).toBe( RELATED_PRODUCTS )
    expect( extraction.takeAggregateRelatedProductCounts() ).toBeUndefined()
  }, 240000 )

  test( 'the paged walk collects them, and hands them over exactly once', async () => {
    // The windowed source is the one place the count is free, because that
    // walk is already paging and scanning every relationship record.
    const { extraction } = await extractionFor( true )

    await extraction.ensureAggregateTargetLocalIDs()

    const counts = extraction.takeAggregateRelatedProductCounts()

    expect( counts ).toBeDefined()
    expect( [ ...counts!.values() ] ).toEqual( [ RELATED_PRODUCTS ] )

    // Handed over, not cached: the prefix the pump builds is the durable
    // structure, and a second copy for the model's life has no reader.
    // Safe because setGeometryShard refuses once a worklist exists, so the
    // prefix is built exactly once.
    expect( extraction.takeAggregateRelatedProductCounts() ).toBeUndefined()
  }, 240000 )
} )

describe( 'the denominator stops where the pass stops (conway#569 review)', () => {

  /**
   * The fixture's one relationship with an unresolvable reference spliced
   * in after its third related product.
   *
   * `#9999` is not in the file (its express IDs stop at #7097), so the
   * pass's classification — `getTypedElementByExpressID` as an
   * `IfcObjectDefinition` — finds nothing and
   * `relatedProductByExpressID_` throws the same
   * "Value in STEP was incorrectly typed" the generated getter would. The
   * permissive catch in the aggregates pass then abandons the REST of the
   * relationship, so it extracts three products and stops.
   *
   * The nine behind the bad entry are not lost: since conway#568 the
   * target walk classifies through the same call and stops at the same
   * entry, so it defers only the three and the per-product pass takes the
   * rest. Which is why the denominator below is derived from the deferral
   * set rather than assuming all twelve are deferred — the two passes
   * partition the products differently here than on a healthy model.
   *
   * The mutation is done here rather than committed as a second `data/`
   * fixture so the diff against the healthy run is one visible line.
   *
   * @return {Uint8Array} The spliced source.
   */
  function malformedSource(): Uint8Array {

    const source = new TextDecoder().decode( buffer )

    // Asserted rather than assumed: a fixture edit that renumbered these
    // would otherwise leave the splice silently not happening, and the
    // test would then pass by testing the healthy model twice.
    expect( source.includes( HEALTHY_LIST_PREFIX ) ).toBe( true )
    expect( source.includes( '#9999' ) ).toBe( false )

    return new TextEncoder().encode(
        source.replace( HEALTHY_LIST_PREFIX, SPLICED_LIST_PREFIX ) )
  }

  /** Start of the relationship's RelatedObjects list in the fixture. */
  const HEALTHY_LIST_PREFIX = '(#1000,#1020,#1040,#1060,'

  /** The same list with an unresolvable reference as its fourth entry. */
  const SPLICED_LIST_PREFIX = '(#1000,#1020,#1040,#9999,#1060,'

  /** Related products the pass reaches before the bad entry stops it. */
  const REACHABLE_PRODUCTS = 3

  /**
   * What the two passes will actually cost on the spliced fixture: the
   * products the aggregates pass does not take, plus the three related
   * products it reaches, plus the `next()` that returns `done` after the
   * catch has abandoned the relationship.
   *
   * `deferred` is MEASURED rather than assumed. How the target walk splits
   * this fixture is exactly what conway#568 changed, and the assertion here
   * is about the aggregates term — that it counts the three products the
   * pass reaches and not the twelve the list names. Hard-coding the split
   * would make this test fail on a change that does not touch what it is
   * testing.
   *
   * @param deferred Products the target walk keeps for the aggregates pass.
   * @return {number} The expected geometry-phase denominator.
   */
  const expectedTruncatedTotal = ( deferred: number ) =>
    ( productCount - deferred ) + REACHABLE_PRODUCTS + RELATIONSHIPS

  test( 'a bad reference truncates the count on both pumps', async () => {

    const source = malformedSource()
    const deferred = await deferredTargetCount( source )

    // The pass logs the abandoned relationship once per open. Diverted
    // rather than left on the console, and asserted: it is the evidence
    // that the pass really did abandon the relationship, which is the whole
    // premise of the expected denominator below.
    const errors = jest.spyOn( Logger, 'error' ).mockImplementation( () => {} )

    let resident: PumpRun
    let windowed: PumpRun
    let logged: number

    try {

      resident = await pumpResident( source )
      windowed = await pumpWindowed( source )
      logged = errors.mock.calls.length

    } finally {
      errors.mockRestore()
    }

    // One per open: the aggregates pass reaching the bad entry, throwing
    // out of relatedProductByExpressID_ and abandoning the relationship.
    expect( logged ).toBe( 2 )

    // The finding (conway#569 review round 2). The windowed pump captured
    // its counts during the aggregate-target walk, which skips a dangling
    // reference and keeps scanning — so it costed all twelve related
    // products while the pass runs three. The resident pump never had the
    // defect: it derives its counts from relatedAggregateProductLocalIDs,
    // which classifies through the pass's own call and stops where the pass
    // stops. The two agreeing is the assertion, and they agree because they
    // are now the same call.
    expect( windowed.geometry[ 0 ].total ).toBe( expectedTruncatedTotal( deferred ) )
    expect( resident.geometry[ 0 ].total ).toBe( expectedTruncatedTotal( deferred ) )

    // A real truncation: the aggregates term costs the three products the
    // pass reaches, not the twelve the list names.
    expect( expectedTruncatedTotal( deferred ) ).toBeLessThan(
        ( productCount - deferred ) + RELATED_PRODUCTS + RELATIONSHIPS )

    // What the over-count looked like from outside: `remaining` walks down
    // through the three reachable products one unit per call and then drops
    // the nine it costed but never ran, in one step, the moment the cursors
    // say the pass is drained. One budget unit per call, so an honest
    // denominator never falls by more than one.
    expect( largestDrop( windowed.remaining ) ).toBe( 1 )
    expect( largestDrop( resident.remaining ) ).toBe( 1 )

    // The numerator still reaches the denominator — the property the
    // healthy cases pin, restated here because a truncated denominator is
    // only right if the pass fills it.
    expect( windowed.geometry[ windowed.geometry.length - 1 ].completed )
        .toBe( expectedTruncatedTotal( deferred ) )
    expect( resident.geometry[ resident.geometry.length - 1 ].completed )
        .toBe( expectedTruncatedTotal( deferred ) )
  }, 240000 )
} )

describe( 'a malformed relationship does not fail the load (conway#569 review)', () => {

  /**
   * The fixture's one relationship with `RelatedObjects` replaced by a bare
   * reference where the STEP aggregate belongs — `#100,#1000)` for
   * `#100,(#1000,...))`.
   *
   * Round 2's `#9999` splice exercises a bad ENTRY inside a well-formed
   * list. This is the other failure: the FIELD is not a list, so
   * `stepExtractArrayBegin` throws before any entry is seen and every read
   * of that field fails, `forEachReferenceInField` and the generated
   * `RelatedObjects` getter alike.
   *
   * @return {Uint8Array} The spliced source.
   */
  function scalarRelatedObjects(): Uint8Array {

    const source = new TextDecoder().decode( buffer )

    expect( source.includes( HEALTHY_FIELD ) ).toBe( true )

    return new TextEncoder().encode(
        source.replace( HEALTHY_FIELD, SCALAR_FIELD ) )
  }

  /** The relationship's RelatingObject and RelatedObjects, as authored. */
  const HEALTHY_FIELD =
    '#100,(#1000,#1020,#1040,#1060,#1080,#1100,#150,#1120,#1140,#160,#161,' +
    '#170,#1160,#1180,#1200,#1220,#151))'

  /** The same two fields with a scalar where the aggregate belongs. */
  const SCALAR_FIELD = '#100,#1000)'

  test( 'both pumps drain, and the products fall back to the first pass',
      async () => {

        const source = scalarRelatedObjects()

        const errors = jest.spyOn( Logger, 'error' ).mockImplementation( () => {} )

        let resident: PumpRun
        let windowed: PumpRun
        let logged: number

        try {

          // The P1 itself: before the fix these rejected — the resident pump
          // out of adoptAggregateStepPrefix_ while building worklists, the
          // windowed one out of the paged walk, and (pre-existing) out of
          // AggregateExtractPager.begin. A progress counter failed the load.
          resident = await pumpResident( source )
          windowed = await pumpWindowed( source )
          logged = errors.mock.calls.length

        } finally {
          errors.mockRestore()
        }

        // Once per open: the aggregates pass reading the same field, getting
        // the same throw, and abandoning the relationship in its permissive
        // catch. Tolerated identically everywhere is the property.
        expect( logged ).toBe( 2 )

        // Nothing was quietly dropped. The target scan tolerates the field
        // the same way, so it defers none of the twelve and they are
        // extracted by the per-product pass instead — which is why the
        // denominator is the healthy one rather than a truncated one, and
        // why the mesh count matches a healthy load.
        expect( windowed.geometry[ 0 ].total ).toBe( productCount + RELATIONSHIPS )
        expect( resident.geometry[ 0 ].total ).toBe( productCount + RELATIONSHIPS )

        expect( windowed.geometry[ windowed.geometry.length - 1 ].completed )
            .toBe( productCount + RELATIONSHIPS )
        expect( resident.geometry[ resident.geometry.length - 1 ].completed )
            .toBe( productCount + RELATIONSHIPS )

        const healthy = await pumpResident( buffer )

        expect( healthy.meshes ).toBeGreaterThan( 0 )
        expect( resident.meshes ).toBe( healthy.meshes )
        expect( windowed.meshes ).toBe( healthy.meshes )
      }, 240000 )

  test( 'a non-resident read still propagates', async () => {

    // The other half of the split, and the reason the catch tests the error
    // type instead of swallowing everything: a blanket catch would report
    // this as a malformed field, the pager would page nothing, and the
    // products would go missing silently — a worse defect than the one the
    // catch fixes. Regressing that turns this test red.
    const store = new InMemoryStepByteStore( buffer )

    const open = await openStreamedIfcModelFromStore( store, { pool: CRAMPED_CHUNK } )

    expect( open.model ).toBeDefined()

    // Deliberately NOT the opened model: a store-backed open takes the
    // provider's defaults and this fixture fits inside one chunk, so
    // nothing can ever be non-resident and the assertion would be vacuous.
    // Two 4 KiB chunks is a window narrow enough to mean it.
    const cramped = new IfcStepModel(
        void 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        open.columns as any,
        new WindowedStepBufferProvider( store, CRAMPED_CHUNK, CRAMPED_RESIDENT_CHUNKS ) )

    const geometry = new ConwayGeometry()

    expect( await geometry.initialize() ).toBe( true )

    const extraction = new IfcGeometryExtraction( geometry, cramped )

    let relAggregate: IfcRelAggregates | undefined

    for ( const candidate of cramped.types( IfcRelAggregates ) ) {
      relAggregate = candidate
      break
    }

    expect( relAggregate ).toBeDefined()

    expect( () => extraction.relatedAggregateProductLocalIDs( relAggregate! ) )
        .toThrow( StepBufferNotResidentError )
  }, 240000 )
} )
