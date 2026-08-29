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

let ifcFixture: Uint8Array
let stepFixture: Uint8Array


/** One delivered placement, flattened to something comparable by value. */
interface Placement {
  expressID: number
  geometryExpressID: number
  flatTransformation: number[]
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
    `${placement.flatTransformation.join( ',' )}` ).sort()
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
