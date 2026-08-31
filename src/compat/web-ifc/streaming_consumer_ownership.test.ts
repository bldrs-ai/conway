/* eslint-disable no-magic-numbers */
// The STREAMING_CONSUMER ownership contract (conway#638), on both formats.
//
// A deferred open builds each PlacedGeometry once and files that same object
// into THREE pointer spines: the model's cumulative per-entity `meshMap`, its
// `vectorFlatMesh`, and — through the mesh callback — whatever the embedder
// keeps. On a D3D-scale load that graph is 475 MB of JS heap, and a consumer
// that assembles every batch as it lands never reads the two conway holds.
//
// STREAMING_CONSUMER says so out loud: conway hands each delta FlatMesh to
// the callback and keeps no reference. What has to hold for that to be safe,
// and what each test below pins:
//
//   1. the flag changes WHAT IS RETAINED, never WHAT IS DELIVERED — the
//      callback sees the same entities, the same placements and the same
//      transforms as an unflagged run of the same model;
//   2. without the flag nothing changes at all, so the flag cannot leak into
//      the path every existing consumer is on;
//   3. a late whole-model ask still works while the natives are alive — it
//      is served by re-walking the scene, not by replaying a cache that no
//      longer exists — and is idempotent, which the retaining path is not
//      (a second StreamAllMeshes there re-pushes into the cache and doubles
//      every count: Share's IfcItemsMap.js:274-283);
//   4. once the natives ARE gone, the same ask throws and names the
//      contract, rather than quietly returning a model with no geometry.
import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import Logger, { LogLevel } from '../../logging/logger'
import { InMemoryStepByteStore } from '../../step/step_buffer_provider'
import { FlatMesh, IfcAPI } from './ifc_api'
import { IfcApiProxyAP214 } from './ifc_api_proxy_ap214'
import { IfcApiProxyIfc } from './ifc_api_proxy_ifc'


const SETTINGS = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true }

const DEFERRED = { ...SETTINGS, DEFER_GEOMETRY: true }

const DEFERRED_OWNED = { ...DEFERRED, STREAMING_CONSUMER: true }

/* Deliberately the fixture with shared/mapped representations: an entity's
 * instance set grows across batches there, which is exactly the case where
 * "keep no reference" could lose a placement if the delta and the cache were
 * not independent of each other. */
const IFC_FIXTURE = 'data/mapped_shared_representation.ifc'

/* Real served geometry rather than structure-only (as1-assembly has zero
 * meshes even classically), so the counts below can be non-zero. */
const STEP_FIXTURE = 'data/nema-23-76mm.step'

/** Products (IFC) / scaled units (AP214) per pump call. */
const BATCH = 4

/* MB is the API's unit and bytes are the engine's, so a budget small enough
 * to bind on a fixture this size has to be expressed as a fraction. */
const BYTES_PER_MIB = 1024 * 1024

let ifcFixture: Uint8Array
let stepFixture: Uint8Array


/**
 * One delivered placement, flattened to something comparable by value.
 *
 * Every field a consumer renders from is here, not just the identifying
 * ones: colour comes off the material and `occurrencePath` off the AP214
 * scene walk, so both are things a re-walk could plausibly get wrong while
 * still agreeing on which geometry goes where.
 */
interface Placement {
  expressID: number
  geometryExpressID: number
  flatTransformation: number[]
  color: number[]
  occurrencePath?: readonly number[]
}


/**
 * Flatten a delivered FlatMesh into comparable placement records.
 *
 * @param mesh The mesh handed to a callback.
 * @return {Placement[]} One record per placed instance on it.
 */
function placements( mesh: FlatMesh ): Placement[] {

  const out: Placement[] = []

  for ( let where = 0; where < mesh.geometries.size(); ++where ) {

    const placed = mesh.geometries.get( where )

    out.push( {
      expressID: mesh.expressID,
      geometryExpressID: placed.geometryExpressID,
      flatTransformation: [ ...placed.flatTransformation ],
      color: [ placed.color.x, placed.color.y, placed.color.z, placed.color.w ],
      occurrencePath: placed.occurrencePath === void 0 ?
        void 0 : [ ...placed.occurrencePath ],
    } )
  }

  return out
}


/**
 * Drain a deferred model, collecting every placement the pump delivered.
 *
 * Stops on `remaining === 0 && extracted === 0`, which is the documented
 * consumer stopping condition rather than a test convenience: the final
 * zero-work call is what runs the geometry budget's head eviction (see the
 * trailing-batch note on pumpGeometryBatch_). This suite must not weaken it.
 *
 * @param api The API instance owning the model.
 * @param modelID The deferred model to drain.
 * @return {Placement[]} Every placement delivered, in delivery order.
 */
function drain( api: IfcAPI, modelID: number ): Placement[] {

  const delivered: Placement[] = []

  for ( ; ; ) {

    const { extracted, remaining } = api.ExtractGeometryBatch(
        modelID, BATCH, ( mesh ) => {
          delivered.push( ...placements( mesh ) )
        } )

    if ( remaining === 0 && extracted === 0 ) {
      break
    }
  }

  return delivered
}


/**
 * Async twin of {@link drain}, for a model opened over an external store.
 *
 * @param api The API instance owning the model.
 * @param modelID The deferred model to drain.
 * @return {Promise<Placement[]>} Every placement delivered, in order.
 */
async function drainAsync(
    api: IfcAPI, modelID: number ): Promise< Placement[] > {

  const delivered: Placement[] = []

  for ( ; ; ) {

    const { extracted, remaining } = await api.ExtractGeometryBatchAsync(
        modelID, BATCH, ( mesh ) => {
          delivered.push( ...placements( mesh ) )
        } )

    if ( remaining === 0 && extracted === 0 ) {
      break
    }
  }

  return delivered
}


/**
 * The two conway-held spines' current sizes, as an observable stand-in for
 * "does conway still hold the graph".
 *
 * @param api The API instance owning the model.
 * @param modelID The open model.
 * @return {object} `meshMap` entry count and `vectorFlatMesh` length.
 */
function retained( api: IfcAPI, modelID: number ):
  { meshMap: number, vectorFlatMesh: number } {

  const passthrough = api.getPassthrough( modelID )

  if ( !( passthrough instanceof IfcApiProxyIfc ) &&
       !( passthrough instanceof IfcApiProxyAP214 ) ) {
    throw new Error( 'expected a conway proxy for the open model' )
  }

  return {
    meshMap: passthrough.model[ 2 ].size,
    vectorFlatMesh: passthrough.model[ 4 ].size(),
  }
}


/**
 * Collect a whole-model StreamAllMeshes into placement records.
 *
 * @param api The API instance owning the model.
 * @param modelID The open model.
 * @return {Placement[]} Every placement served.
 */
function streamAll( api: IfcAPI, modelID: number ): Placement[] {

  const served: Placement[] = []

  api.StreamAllMeshes( modelID, ( mesh ) => {
    served.push( ...placements( mesh ) )
  } )

  return served
}


/**
 * Run a whole-model ask with the log sink captured.
 *
 * The partial-loss path's ONLY output to a consumer is a warning line — the
 * placements it lost are simply not in what it returns — so the line has to
 * be asserted on directly, not inferred from a count. Logger echoes to the
 * sink immediately, which matters here because StreamAllMeshes clears the
 * buffer on its way out.
 *
 * @param api The API instance owning the model.
 * @param modelID The open model.
 * @return {object} What was served, and every line the call logged.
 */
function streamAllCapturingLogs( api: IfcAPI, modelID: number ):
  { served: Placement[], logged: string[] } {

  const logged: string[] = []

  Logger.clearLogs()
  Logger.setLogLevel( LogLevel.WARNING )
  Logger.setSink( ( _level, message ) => {
    logged.push( message )
  } )

  try {
    return { served: streamAll( api, modelID ), logged }
  } finally {
    Logger.setSink()
    Logger.setLogLevel( LogLevel.INFO )
    Logger.clearLogs()
  }
}


/**
 * Order-independent comparison key for a set of placements. The pump
 * delivers per batch and a whole-model walk delivers per entity, so the two
 * agree on content, not on sequence.
 *
 * @param all The placements to key.
 * @return {string[]} Sorted, one string per placement.
 */
function asSortedKeys( all: Placement[] ): string[] {

  return all.map( ( placement ) =>
    `${placement.expressID}/${placement.geometryExpressID}/` +
    `${placement.flatTransformation.join( ',' )}/` +
    `${placement.color.join( ',' )}/` +
    `${placement.occurrencePath?.join( '.' ) ?? '-'}` ).sort()
}


beforeAll( () => {
  ifcFixture = new Uint8Array( fs.readFileSync( IFC_FIXTURE ) )
  stepFixture = new Uint8Array( fs.readFileSync( STEP_FIXTURE ) )
} )


describe.each( [
  [ 'IFC', () => ifcFixture ],
  [ 'AP214/STEP', () => stepFixture ],
] )( 'STREAMING_CONSUMER on %s', ( _format, fixture ) => {

  test( 'the pump delivers the same stream and retains none of it',
      async () => {

        const api = new IfcAPI()

        await api.Init()

        // The reference is this pipeline's own unflagged output, not a
        // hand-written expectation: the flagged run has to agree with it
        // placement for placement and transform for transform.
        const retainingID = await api.OpenModelStreamed( fixture(), DEFERRED )
        const reference = drain( api, retainingID )

        expect( reference.length ).toBeGreaterThan( 0 )

        // ...and the unflagged path really is the retaining one, or "the
        // flagged run retains nothing" would be pinning a difference that
        // does not exist.
        const retainingSpines = retained( api, retainingID )

        expect( retainingSpines.meshMap ).toBeGreaterThan( 0 )
        expect( retainingSpines.vectorFlatMesh ).toBeGreaterThan( 0 )

        const ownedID = await api.OpenModelStreamed( fixture(), DEFERRED_OWNED )
        const owned = drain( api, ownedID )

        expect( asSortedKeys( owned ) ).toEqual( asSortedKeys( reference ) )

        // The contract itself: conway kept nothing.
        expect( retained( api, ownedID ) )
            .toEqual( { meshMap: 0, vectorFlatMesh: 0 } )
      }, 240000 )

  test( 'a late whole-model ask is served by re-walking, and repeats exactly',
      async () => {

        const api = new IfcAPI()

        await api.Init()

        const retainingID = await api.OpenModelStreamed( fixture(), DEFERRED )

        drain( api, retainingID )

        const reference = streamAll( api, retainingID )

        expect( reference.length ).toBeGreaterThan( 0 )

        const ownedID = await api.OpenModelStreamed( fixture(), DEFERRED_OWNED )

        drain( api, ownedID )

        // Nothing cached to replay — this is a fresh walk of the live scene,
        // and it must reproduce the retaining model's whole-model answer.
        const first = streamAll( api, ownedID )

        expect( asSortedKeys( first ) ).toEqual( asSortedKeys( reference ) )

        // Idempotent, which the retaining path is not: there the second call
        // re-pushes every instance into the still-populated cache and
        // doubles the counts (Share's IfcItemsMap.js:274-283). Here each
        // call clears and re-walks.
        const second = streamAll( api, ownedID )

        expect( asSortedKeys( second ) ).toEqual( asSortedKeys( first ) )

        // LoadAllGeometry rides the same re-walk and must not double either.
        expect( api.LoadAllGeometry( ownedID ).size() )
            .toBe( api.LoadAllGeometry( ownedID ).size() )
      }, 240000 )

  test( 'a whole-model ask after the natives are released throws by contract',
      async () => {

        const api = new IfcAPI()

        await api.Init()

        const ownedID = await api.OpenModelStreamed( fixture(), DEFERRED_OWNED )

        drain( api, ownedID )

        expect( api.ReleaseModelGeometry( ownedID ) ).toBe( true )

        // Never a silent empty model: the cache that used to answer this is
        // gone by contract and the natives a re-walk needs are gone by
        // request, so the only honest answer is a loud one.
        expect( () => streamAll( api, ownedID ) )
            .toThrow( /STREAMING_CONSUMER/ )

        expect( () => api.LoadAllGeometry( ownedID ) )
            .toThrow( /STREAMING_CONSUMER/ )
      }, 240000 )

  test( 'without the flag, release still replays the retained cache',
      async () => {

        // The leak guard for the test above: the throw must belong to the
        // contract, not to "released deferred models throw now".
        const api = new IfcAPI()

        await api.Init()

        const retainingID = await api.OpenModelStreamed( fixture(), DEFERRED )

        const delivered = drain( api, retainingID )

        expect( delivered.length ).toBeGreaterThan( 0 )
        expect( api.ReleaseModelGeometry( retainingID ) ).toBe( true )

        const served = streamAll( api, retainingID )

        expect( served.length ).toBeGreaterThan( 0 )
      }, 240000 )
} )


describe( 'STREAMING_CONSUMER under a geometry budget (IFC only — AP214 has ' +
  'no geometry residency)', () => {

  // Share's production configuration is DEFER_GEOMETRY + GEOMETRY_BUDGET_MB
  // together, and it is the combination that breaks the contract's promise
  // in the least visible way: eviction DELETES the mesh from the store
  // (IfcModelGeometry.delete), so the re-walk that serves a late whole-model
  // ask resolves nothing for that scene node, parks it, and the placement is
  // absent from the rebuilt map rather than sitting in it with a dead
  // handle. The retaining path's livePlacements filter therefore reads zero
  // losses however much was lost — which is exactly how the first version of
  // this work shipped a throw that could never fire.

  test( 'total eviction throws rather than serving an empty model',
      async () => {

        const api = new IfcAPI()

        await api.Init()

        const ownedID = await api.OpenModelStreamed( ifcFixture, DEFERRED_OWNED )

        // One byte: nothing survives a pump call, so by the end of the drain
        // the model's whole geometry store has been evicted.
        expect( api.SetGeometryBudget( ownedID, 1 / BYTES_PER_MIB )
            ?.budgetBytes ).toBe( 1 )

        const delivered = drain( api, ownedID )

        // The pump still DELIVERED — the copy window is intact, this is a
        // model that streamed correctly and then lost its natives — so the
        // throw below is about the late ask, not about a broken load.
        expect( delivered.length ).toBeGreaterThan( 0 )

        expect( () => streamAll( api, ownedID ) )
            .toThrow( /STREAMING_CONSUMER/ )

        // ...and it names what it could not resolve, rather than the "0
        // instance(s) across 0 entit(ies)" the filter-based count reported.
        expect( () => streamAll( api, ownedID ) )
            .toThrow( /[1-9][0-9]* placed instance\(s\) unresolved/ )
      }, 240000 )

  test( 'partial eviction serves what survived and does not throw',
      async () => {

        const api = new IfcAPI()

        await api.Init()

        // The unbudgeted reference: what a late whole-model ask returns when
        // nothing was evicted. Without it "served fewer" is unanchored.
        const wholeID = await api.OpenModelStreamed( ifcFixture, DEFERRED_OWNED )

        drain( api, wholeID )

        const whole = streamAll( api, wholeID )

        expect( whole.length ).toBeGreaterThan( 0 )

        const ownedID = await api.OpenModelStreamed( ifcFixture, DEFERRED_OWNED )

        // 2 KiB binds on this fixture (the existing budget suite pins that an
        // unbudgeted drain holds more) without evicting everything.
        expect( api.SetGeometryBudget( ownedID, 2048 / BYTES_PER_MIB )
            ?.budgetBytes ).toBe( 2048 )

        drain( api, ownedID )

        const { served: partial, logged } = streamAllCapturingLogs( api, ownedID )

        // Partial loss is a warning, not a throw: something is still there
        // to hand back, and refusing to hand it back would be worse than the
        // silence this contract is fixing.
        expect( partial.length ).toBeGreaterThan( 0 )
        expect( partial.length ).toBeLessThan( whole.length )

        // The warning is the ONLY thing that tells a consumer it received a
        // partial model — the lost placements are simply absent from what
        // came back — so assert the line exists and that the number in it is
        // the real loss, not merely that it is non-zero. This is the exact
        // assertion the round-1 code would have failed: it reported "0
        // instance(s) across 0 entit(ies)" while losing 13 of 16, and
        // `whole.length - 0 === 16` is not the 3 that was served.
        const warned = logged.find( ( line ) =>
          line.includes( 'StreamAllMeshes re-walked a STREAMING_CONSUMER' ) )

        expect( warned ).toBeDefined()

        const reported =
          /(\d+) placed instance\(s\) could not be resolved/.exec( warned! )

        expect( reported ).not.toBeNull()

        const unresolved = Number( reported![ 1 ] )

        expect( unresolved ).toBeGreaterThan( 0 )
        expect( partial.length ).toBe( whole.length - unresolved )
      }, 240000 )
} )


describe( 'STREAMING_CONSUMER on the pump and entry points Share drives ' +
  '(IFC only)', () => {

  test( 'the async pump over an external store retains nothing either',
      async () => {

        // ExtractGeometryBatchAsync over a windowed source is the pump Share
        // actually drives, and it is a separate code path from the sync one
        // with its own capture call. A contract honoured on only one of them
        // is a contract that silently does not apply.
        const api = new IfcAPI()

        await api.Init()

        const retainingID = await api.OpenModelStream(
            new InMemoryStepByteStore( ifcFixture ), DEFERRED )

        const reference = await drainAsync( api, retainingID )

        expect( reference.length ).toBeGreaterThan( 0 )
        expect( retained( api, retainingID ).meshMap ).toBeGreaterThan( 0 )

        const ownedID = await api.OpenModelStream(
            new InMemoryStepByteStore( ifcFixture ), DEFERRED_OWNED )

        expect( api.getPassthrough( ownedID )!.sourceIsExternal ).toBe( true )

        const owned = await drainAsync( api, ownedID )

        expect( asSortedKeys( owned ) ).toEqual( asSortedKeys( reference ) )
        expect( retained( api, ownedID ) )
            .toEqual( { meshMap: 0, vectorFlatMesh: 0 } )
      }, 240000 )

  test( 'GetFlatMesh on a flagged model is served by the re-walk',
      async () => {

        // GetFlatMesh is named in the setting's docstring as one of the
        // entry points the re-walk serves, and it reaches it by a different
        // route from StreamAllMeshes: its `meshMap.size <= 0` test means
        // "not loaded yet" everywhere else and means "steady state" here.
        //
        // IFC only: AP214's getFlatMesh looks up an expressID against a map
        // its own capture keys by localID, so it returns the dummy on that
        // proxy with and without this flag. Pre-existing and out of scope.
        const api = new IfcAPI()

        await api.Init()

        const retainingID = await api.OpenModelStreamed( ifcFixture, DEFERRED )

        const delivered = drain( api, retainingID )
        const subject = delivered[ 0 ].expressID

        const reference = placements( api.GetFlatMesh( retainingID, subject ) )

        expect( reference.length ).toBeGreaterThan( 0 )

        const ownedID = await api.OpenModelStreamed( ifcFixture, DEFERRED_OWNED )

        drain( api, ownedID )

        expect( retained( api, ownedID ).meshMap ).toBe( 0 )

        expect( asSortedKeys( placements(
            api.GetFlatMesh( ownedID, subject ) ) ) )
            .toEqual( asSortedKeys( reference ) )
      }, 240000 )
} )
