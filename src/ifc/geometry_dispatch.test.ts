/* eslint-disable no-magic-numbers */
import * as fs from 'fs'

import { describe, expect, test } from '@jest/globals'

import { IfcAPI } from '../compat/web-ifc/ifc_api'
import {
  InMemoryStepByteStore,
  StepBufferNotResidentError,
} from '../step/step_buffer_provider'
import IfcStepModel from './ifc_step_model'
import {
  computeDispatchKeys,
  geometryDispatchKey,
  shardOfDispatchKey,
} from './geometry_dispatch'


const SETTINGS = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true }


describe( 'geometryDispatchKey', () => {

  test( 'products sharing a representation map key together, and land together',
      async () => {

        // The whole claim in one assertion. data/mapped_shared_representation.ifc
        // has two products 15 apart instancing one IfcRepresentationMap; a
        // partition that splits them makes both shards build the same
        // geometry, which is the +25% to +40% round-robin costs on real
        // models. They must key identically WITHOUT anything having been
        // extracted — that is what makes this usable at dispatch time.
        const api = new IfcAPI()

        await api.Init()

        const fixture = new Uint8Array(
            fs.readFileSync( 'data/mapped_shared_representation.ifc' ) )

        const modelID = await api.OpenModelStreamed(
            fixture, { ...SETTINGS, DEFER_GEOMETRY: true } )

        // The passthrough's internals are not on the public interface;
        // reaching in is deliberate, as in the pump tests.
        const passthrough = api.getPassthrough( modelID ) as unknown as {
          model: [ IfcStepModel ],
          ensureDemandWorklists_(): void,
          demandProducts_?: number[],
        }

        const model = passthrough.model[ 0 ]

        passthrough.ensureDemandWorklists_()

        const products = passthrough.demandProducts_ ?? []

        expect( products.length ).toBeGreaterThan( 2 )

        const keys = products.map(
            ( localID ) => geometryDispatchKey( model, localID ) )

        // The two mapped products share a key; the fillers, which each own
        // their geometry, do not join them.
        const byKey = new Map< number, number >()

        for ( const key of keys ) {
          byKey.set( key, ( byKey.get( key ) ?? 0 ) + 1 )
        }

        const shared = [ ...byKey.values() ].filter( ( count ) => count > 1 )

        expect( shared ).toEqual( [ 2 ] )

        // ...and at every shard count they co-locate, which is the property
        // the partition actually consumes.
        for ( const shardCount of [ 2, 3, 4, 8 ] ) {

          const sharedKey = [ ...byKey.entries() ]
              .find( ( [ , count ] ) => count > 1 )![ 0 ]

          const shards = new Set(
              keys.filter( ( key ) => key === sharedKey )
                  .map( ( key ) => shardOfDispatchKey( key, shardCount ) ) )

          expect( shards.size ).toBe( 1 )
        }

        api.CloseModel( modelID )
      }, 240000 )

  test( 'a key is produced for every product, resolvable or not', async () => {

    // Totality matters more than accuracy here: this runs per product on the
    // dispatch path, and a product with no representation, or one whose
    // attributes do not resolve, must still be placeable. A thrown error
    // costs the model; a poor key costs one duplicated extraction.
    const api = new IfcAPI()

    await api.Init()

    const fixture = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )

    const modelID = await api.OpenModelStreamed(
        fixture, { ...SETTINGS, DEFER_GEOMETRY: true } )

    const model = ( api.getPassthrough( modelID ) as unknown as
      { model: [ IfcStepModel ] } ).model[ 0 ]

    // Local IDs that exist, and one that does not.
    for ( const localID of [ 0, 1, 2, 999999 ] ) {

      const key = geometryDispatchKey( model, localID )

      expect( Number.isFinite( key ) ).toBe( true )
      expect( shardOfDispatchKey( key, 4 ) ).toBeGreaterThanOrEqual( 0 )
      expect( shardOfDispatchKey( key, 4 ) ).toBeLessThan( 4 )
    }

    // Degenerate shard counts collapse rather than throwing or indexing out
    // of range — a pool of one is a normal configuration.
    expect( shardOfDispatchKey( 12345, 1 ) ).toBe( 0 )
    expect( shardOfDispatchKey( 12345, 0 ) ).toBe( 0 )
    expect( shardOfDispatchKey( -7, 4 ) ).toBeLessThan( 4 )

    api.CloseModel( modelID )
  }, 240000 )
} )


/* Tiny windows so a small fixture still evicts: the point of these tests is
 * that a record the walk needs is genuinely NOT resident when the walk
 * starts, which is the condition that made windowed sources unshardable. */
const CHUNK_BYTES = 512
const MAX_RESIDENT_CHUNKS = 3

/* Fixtures chosen for what the dispatch walk actually reaches: one with an
 * IfcRepresentationMap two products share (the mapped-source hop), one with
 * an IfcRelAggregates assembly (the relating-object hop). */
const WINDOWED_FIXTURES = [
  'data/mapped_shared_representation.ifc',
  'data/aggregate_master_voids.ifc',
]


/** The pump internals these tests reach into, as the tests above do. */
interface DemandPassthrough {
  model: [ IfcStepModel ]
  ensureDemandWorklists_(): void
  ensureDemandWorklistsAsync_(): Promise< void >
  demandProducts_?: number[]
  demandAggregates_?: { localID: number }[]
  conwayGeometry_: { aggregateTargetLocalIDs(): Set< number > }
}


/**
 * Open a fixture deferred, then spill its source behind tiny windows.
 *
 * @param api An initialised API.
 * @param fixture Path to the IFC file.
 * @param spill Whether to windowed the source after opening.
 * @return {Promise<object>} The model handle and its passthrough.
 */
async function openDeferred(
    api: IfcAPI,
    fixture: string,
    spill: boolean ): Promise< { modelID: number, passthrough: DemandPassthrough } > {

  const bytes = new Uint8Array( fs.readFileSync( fixture ) )

  const modelID = await api.OpenModelStreamed(
      bytes, { ...SETTINGS, COORDINATE_TO_ORIGIN: false, DEFER_GEOMETRY: true } )

  if ( spill ) {

    expect( api.SpillModelSource(
        modelID,
        new InMemoryStepByteStore( bytes ),
        CHUNK_BYTES,
        MAX_RESIDENT_CHUNKS ) ).toBe( true )
  }

  const passthrough =
    api.getPassthrough( modelID ) as unknown as DemandPassthrough

  expect( passthrough.model[ 0 ].isSourceExternal ).toBe( spill )

  return { modelID, passthrough }
}


describe( 'dispatch keys on a windowed source', () => {

  test.each( WINDOWED_FIXTURES )(
      '%s keys identically windowed and resident', async ( fixture ) => {

        // The property the whole partition rests on, stated as a test: the
        // key is a function of the FILE, not of which chunks this worker
        // happens to hold. Before computeDispatchKeys existed, a windowed
        // walk silently fell back to the product's own local ID for every
        // record it could not read, so two workers disagreed and a product
        // was extracted twice or dropped.
        const api = new IfcAPI()

        await api.Init()

        const resident = await openDeferred( api, fixture, false )

        resident.passthrough.ensureDemandWorklists_()

        const products = resident.passthrough.demandProducts_ ?? []

        expect( products.length ).toBeGreaterThan( 0 )

        const residentKeys = await computeDispatchKeys( resident.passthrough.model[ 0 ], products )

        const windowed = await openDeferred( api, fixture, true )

        // The walk must really be short of bytes here, or the comparison
        // below would pass on a model that never needed paging at all —
        // exactly the blind spot that let the old refusal stand unexamined.
        let refusedInline = 0

        for ( const localID of products ) {

          try {
            geometryDispatchKey( windowed.passthrough.model[ 0 ], localID )
          } catch ( error ) {
            expect( error ).toBeInstanceOf( StepBufferNotResidentError )
            ++refusedInline
          }
        }

        expect( refusedInline ).toBeGreaterThan( 0 )

        const windowedKeys =
          await computeDispatchKeys( windowed.passthrough.model[ 0 ], products )

        expect( Array.from( windowedKeys ) ).toEqual( Array.from( residentKeys ) )

        api.CloseModel( resident.modelID )
        api.CloseModel( windowed.modelID )
      }, 240000 )

  test( 'aggregate targets survive a windowed source, so nothing is emitted twice',
      async () => {

        // The set of products the aggregates pass owns is read from the
        // IfcRelAggregates records themselves. On a windowed source those
        // pages are routinely gone by the first pump, the sync walk swallows
        // the non-resident read, and the incomplete set is cached for the
        // model's life — so a child it missed stays in the per-product
        // worklist AND in the aggregates pass, and is emitted twice: once
        // with the uncut content the deferral exists to suppress.
        //
        // Costs an unsharded windowed load the same duplicate, which is
        // Share's own path (conway#538 review).
        const api = new IfcAPI()

        await api.Init()

        const fixture = 'data/aggregate_master_voids.ifc'

        const resident = await openDeferred( api, fixture, false )

        resident.passthrough.ensureDemandWorklists_()

        const expectedTargets = resident.passthrough.conwayGeometry_
            .aggregateTargetLocalIDs().size
        const expectedProducts = ( resident.passthrough.demandProducts_ ?? [] ).length

        // The fixture has to HAVE an aggregate target, or the comparison
        // below is two zeros agreeing.
        expect( expectedTargets ).toBeGreaterThan( 0 )

        api.CloseModel( resident.modelID )

        const windowed = await openDeferred( api, fixture, true )

        await windowed.passthrough.ensureDemandWorklistsAsync_()

        expect( windowed.passthrough.conwayGeometry_
            .aggregateTargetLocalIDs().size ).toBe( expectedTargets )
        expect( ( windowed.passthrough.demandProducts_ ?? [] ).length )
            .toBe( expectedProducts )

        api.CloseModel( windowed.modelID )
      }, 240000 )

  test( 'a sharded windowed model refuses the synchronous worklist build',
      async () => {

        // The internal invariant behind everything above: the sync build
        // cannot page, so a sharded windowed model MUST reach the async one.
        // Nothing calls it wrongly today — the sync pump refuses a windowed
        // source before it gets here — but a future pump entry that forgot
        // the await would otherwise partition on whatever happened to be
        // resident, silently, which is the exact failure this milestone
        // exists to remove.
        const api = new IfcAPI()

        await api.Init()

        const { modelID, passthrough } =
          await openDeferred( api, WINDOWED_FIXTURES[ 0 ], true )

        api.SetGeometryShard( modelID, { index: 0, count: 2 } )

        expect( () => passthrough.ensureDemandWorklists_() )
            .toThrow( /async worklist build/ )

        api.CloseModel( modelID )
      }, 240000 )

  test.each( WINDOWED_FIXTURES )(
      '%s shards into an exact partition when windowed', async ( fixture ) => {

        // What a pool needs and a union-of-complete-copies check cannot see:
        // every product owned by exactly one shard. A residency-dependent key
        // shows up here as a duplicate (two shards select it) or a hole
        // (neither does), so the counts are asserted, not just the set.
        const api = new IfcAPI()

        await api.Init()

        const shardCount = 3

        const whole = await openDeferred( api, fixture, true )

        await whole.passthrough.ensureDemandWorklistsAsync_()

        const expectedProducts = ( whole.passthrough.demandProducts_ ?? [] ).slice()
        const expectedAggregates =
          ( whole.passthrough.demandAggregates_ ?? [] ).map( ( each ) => each.localID )

        expect( expectedProducts.length ).toBeGreaterThan( 0 )

        api.CloseModel( whole.modelID )

        const unionProducts: number[] = []
        const unionAggregates: number[] = []

        for ( let index = 0; index < shardCount; ++index ) {

          const shardModel = await openDeferred( api, fixture, true )

          expect( api.SetGeometryShard(
              shardModel.modelID, { index, count: shardCount } ) ).toBe( true )

          await shardModel.passthrough.ensureDemandWorklistsAsync_()

          unionProducts.push( ...( shardModel.passthrough.demandProducts_ ?? [] ) )
          unionAggregates.push(
              ...( shardModel.passthrough.demandAggregates_ ?? [] )
                  .map( ( each ) => each.localID ) )

          api.CloseModel( shardModel.modelID )
        }

        // Sorted rather than set-compared: a duplicate survives sorting and
        // dies in a Set, and duplicates are half of what a bad key produces.
        expect( unionProducts.slice().sort( ( a, b ) => a - b ) )
            .toEqual( expectedProducts.slice().sort( ( a, b ) => a - b ) )
        expect( unionAggregates.slice().sort( ( a, b ) => a - b ) )
            .toEqual( expectedAggregates.slice().sort( ( a, b ) => a - b ) )
      }, 240000 )
} )


describe( 'demand prep yield', () => {

  test( 'is absent until a build runs, then reports what that build cost',
      async () => {

        // The build is lazy — it happens inside the FIRST pump call — and
        // that laziness is exactly why an external probe cannot time it
        // without a product of geometry riding along. So the yield must be
        // undefined beforehand rather than zeroed: "not measured" and
        // "measured as nothing" are different answers, and the ledger's
        // discipline is to print the first as absent (conway#682).
        const api = new IfcAPI()

        await api.Init()

        const { modelID, passthrough } =
          await openDeferred( api, 'data/mapped_shared_representation.ifc', false )

        expect( api.GetDemandPrepYield( modelID ) ).toBeUndefined()

        passthrough.ensureDemandWorklists_()

        const prep = api.GetDemandPrepYield( modelID )

        expect( prep ).toBeDefined()

        // An unsharded build takes the `shard_ === void 0` return before a
        // single dispatch key is computed, so the key term is ABSENT. This
        // is the asymmetry the ledger's §11.4 turns on: the unsharded
        // reference does not perform this work, so it cannot be the
        // denominator for it.
        expect( prep!.keysMs ).toBeUndefined()
        expect( prep!.shardCount ).toBeUndefined()
        expect( prep!.windowed ).toBe( false )

        // Nothing was filtered, so the walk and the worklist agree.
        expect( prep!.candidateProducts )
            .toBe( ( passthrough.demandProducts_ ?? [] ).length )
        expect( prep!.keptProducts ).toBe( prep!.candidateProducts )
        expect( prep!.keptAggregates ).toBe( prep!.candidateAggregates )
        expect( prep!.candidateProducts ).toBeGreaterThan( 0 )

        // Wall time is a real interval, and the parts fit inside the whole.
        // Bounded rather than pinned: Date.now() is millisecond-resolution
        // and this fixture builds in less than one, so anything stricter
        // than an ordering would be asserting the clock.
        expect( prep!.candidatesMs ).toBeGreaterThanOrEqual( 0 )
        expect( prep!.totalMs ).toBeGreaterThanOrEqual( prep!.candidatesMs )

        api.CloseModel( modelID )
      }, 240000 )

  test( 'every shard walks the WHOLE model, which is what makes prep replicated',
      async () => {

        // The measurement conway#682 is filed on, asserted rather than
        // timed. A shard narrows what is BUILT, not what is walked: each
        // worker's `candidateProducts` is the whole model's count, while its
        // `keptProducts` is only its own share. So N workers between them
        // enumerate the model N times and build it once, and the gap
        // between the two columns is the replication — visible here without
        // depending on a clock.
        const api = new IfcAPI()

        await api.Init()

        const fixture = 'data/mapped_shared_representation.ifc'
        const shardCount = 2

        const whole = await openDeferred( api, fixture, false )

        whole.passthrough.ensureDemandWorklists_()

        const wholeProducts = ( whole.passthrough.demandProducts_ ?? [] ).length
        const wholeAggregates =
          ( whole.passthrough.demandAggregates_ ?? [] ).length

        expect( wholeProducts ).toBeGreaterThan( 1 )

        api.CloseModel( whole.modelID )

        let keptProducts = 0
        let keptAggregates = 0

        for ( let index = 0; index < shardCount; ++index ) {

          const shardModel = await openDeferred( api, fixture, false )

          expect( api.SetGeometryShard(
              shardModel.modelID, { index, count: shardCount } ) ).toBe( true )

          shardModel.passthrough.ensureDemandWorklists_()

          const prep = api.GetDemandPrepYield( shardModel.modelID )

          expect( prep ).toBeDefined()

          // Every shard walked the whole model...
          expect( prep!.candidateProducts ).toBe( wholeProducts )
          expect( prep!.candidateAggregates ).toBe( wholeAggregates )

          // ...and ran the dispatch-key pass the unsharded build skipped.
          expect( prep!.keysMs ).toBeDefined()
          expect( prep!.keysMs ).toBeGreaterThanOrEqual( 0 )

          expect( prep!.shardIndex ).toBe( index )
          expect( prep!.shardCount ).toBe( shardCount )

          // ...but kept only its own share of it.
          expect( prep!.keptProducts ).toBeLessThan( prep!.candidateProducts )
          expect( prep!.keptProducts )
              .toBe( ( shardModel.passthrough.demandProducts_ ?? [] ).length )

          keptProducts += prep!.keptProducts
          keptAggregates += prep!.keptAggregates

          api.CloseModel( shardModel.modelID )
        }

        // The partition closes, so the walk really was N times the build:
        // shardCount x wholeProducts products enumerated to produce
        // wholeProducts built.
        expect( keptProducts ).toBe( wholeProducts )
        expect( keptAggregates ).toBe( wholeAggregates )
      }, 240000 )

  test( 'a windowed build marks its wall time as containing paging', async () => {

    // The async builder awaits `ensureAggregateTargetLocalIDs` and
    // `computeDispatchKeys`, both of which page a windowed source. Its
    // `totalMs` is therefore not comparable with a resident worker's
    // without knowing that, so the flag travels with the number rather
    // than being inferred from the configuration by whoever reads it.
    const api = new IfcAPI()

    await api.Init()

    const { modelID, passthrough } =
      await openDeferred( api, 'data/aggregate_master_voids.ifc', true )

    expect( api.SetGeometryShard( modelID, { index: 0, count: 2 } ) ).toBe( true )

    await passthrough.ensureDemandWorklistsAsync_()

    const prep = api.GetDemandPrepYield( modelID )

    expect( prep ).toBeDefined()
    expect( prep!.windowed ).toBe( true )
    expect( prep!.keysMs ).toBeDefined()
    expect( prep!.shardCount ).toBe( 2 )
    expect( prep!.keptProducts )
        .toBe( ( passthrough.demandProducts_ ?? [] ).length )

    api.CloseModel( modelID )
  }, 240000 )
} )
