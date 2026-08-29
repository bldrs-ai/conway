/* eslint-disable no-magic-numbers */
// The copy window a budgeted demand pump has to leave open, and what
// happens outside it.
//
// Share drives conway with DEFER_GEOMETRY + GEOMETRY_BUDGET_MB and copies
// geometry out BETWEEN pump calls, not inside the mesh callback: the
// callback only collects delta FlatMeshes, and once
// ExtractGeometryBatch(Async) has returned, onMeshBatch reads each
// delivered geometry back through GetGeometry + GetVertexArray/GetIndexArray
// (the "copy at delivery" invariant of Share#1640). Eviction used to run at
// the TAIL of the pump call, so a batch whose geometry exceeded the budget
// was evicted by its own call and the copy that followed found the native
// already freed — embind aborting with "Cannot pass deleted object as a
// pointer of type IfcGeometry" on a 1.9 GB Revit export at
// GEOMETRY_BUDGET_MB=64 (Sentry SHARE-1NK).
//
// Two properties, and the second is what keeps the first from being bought
// by simply never evicting:
//
//   1. everything pump call N delivered resolves through GetGeometry, with
//      the same byte counts an unbudgeted load reports, at any point before
//      pump call N+1 begins;
//   2. an asset that is genuinely gone — a later pump call evicted it —
//      reads as the empty dummy, never as a throw.
import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import { InMemoryStepByteStore } from '../../step/step_buffer_provider'
import { IfcAPI } from './ifc_api'


const SETTINGS = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true }

const DEFERRED = { ...SETTINGS, DEFER_GEOMETRY: true }

/* The fixture the existing budget tests use: small, and deliberately the
 * one where eviction is most likely to lose something, because products
 * later in the file map geometry an aggressive budget has already thrown
 * away. */
const FIXTURE = 'data/mapped_shared_representation.ifc'

const BYTES_PER_MIB = 1024 * 1024

/* A budget in BYTES, not MB. This model's whole live set is a few KB, so a
 * 1 MB budget would never bind and every assertion below would pass while
 * proving nothing. The existing suite pins that an unbudgeted drain of this
 * fixture holds more than 2048 bytes, so this binds. */
const BUDGET_BYTES = 2048

/** Products per pump call — small enough that the drain takes many calls. */
const BATCH = 4

let fixture: Uint8Array

/** Geometry express ID to the vertex/index byte counts an unbudgeted load
 * serves for it. */
let reference: Map<number, [number, number]>


/**
 * Drain a deferred model, collecting the geometry express IDs each pump call
 * delivered, one entry per call.
 *
 * @param api The API instance owning the model.
 * @param modelID The deferred model to drain.
 * @param pump Runs one pump call, given the mesh callback.
 * @param betweenCalls Runs after each pump call returns and before the next
 * begins — the copy window under test.
 * @return {Promise<number[]>} Every geometry express ID delivered, in order.
 */
async function drain(
    api: IfcAPI,
    modelID: number,
    pump: ( collect: ( geometryExpressID: number ) => void ) =>
      Promise< { extracted: number, remaining: number } >,
    betweenCalls?: ( delivered: number[] ) => void ): Promise< number[] > {

  const all: number[] = []

  for ( ; ; ) {

    const delivered: number[] = []

    const { extracted, remaining } = await pump( ( geometryExpressID ) => {
      delivered.push( geometryExpressID )
      all.push( geometryExpressID )
    } )

    betweenCalls?.( delivered )

    // Stopping on `remaining === 0 && extracted === 0` rather than
    // `remaining === 0` alone costs one extra zero-work call, but that call
    // is the contract, not a test convenience: it mirrors Share's own
    // production stop condition, and it is the only thing that runs the
    // head eviction that trims the final real batch's overshoot (see the
    // trailing-batch paragraph on pumpGeometryBatch_ in
    // ifc_api_proxy_ifc.ts). Stopping at `remaining === 0` alone would leave
    // that overshoot resident and this suite would never see it evicted.
    if ( remaining === 0 && extracted === 0 ) {
      break
    }
  }

  return all
}


beforeAll( async () => {

  fixture = new Uint8Array( fs.readFileSync( FIXTURE ) )

  // The reference sizes come from an UNBUDGETED deferred load, so they are
  // this pipeline's own output rather than a hand-written expectation: the
  // budgeted run has to agree with them byte for byte, not merely serve
  // something non-empty.
  const api = new IfcAPI()

  await api.Init()

  const modelID = await api.OpenModelStreamed( fixture, DEFERRED )

  const delivered = await drain(
      api,
      modelID,
      async ( collect ) => api.ExtractGeometryBatch( modelID, BATCH, ( mesh ) => {
        for ( let where = 0; where < mesh.geometries.size(); ++where ) {
          collect( mesh.geometries.get( where ).geometryExpressID )
        }
      } ) )

  reference = new Map< number, [ number, number ] >()

  for ( const geometryExpressID of delivered ) {

    const geometry = api.GetGeometry( modelID, geometryExpressID )

    reference.set(
        geometryExpressID,
        [ geometry.GetVertexDataSize(), geometry.GetIndexDataSize() ] )
  }

  expect( reference.size ).toBeGreaterThan( 0 )

  // Nothing empty in the reference, or "same as reference" would be
  // satisfiable by the dummy geometry an evicted asset returns.
  for ( const [ vertexBytes, indexBytes ] of reference.values() ) {
    expect( vertexBytes ).toBeGreaterThan( 0 )
    expect( indexBytes ).toBeGreaterThan( 0 )
  }

  api.CloseModel( modelID )
}, 240000 )


describe( 'a budgeted pump leaves the copy window open (Sentry SHARE-1NK)', () => {

  test( 'the sync pump: everything call N delivered survives until call N+1',
      async () => {

        const api = new IfcAPI()

        await api.Init()

        const modelID = await api.OpenModelStreamed( fixture, DEFERRED )

        expect( api.SetGeometryBudget( modelID, BUDGET_BYTES / BYTES_PER_MIB )
            ?.budgetBytes ).toBe( BUDGET_BYTES )

        let checked = 0

        const delivered = await drain(
            api,
            modelID,
            async ( collect ) =>
              api.ExtractGeometryBatch( modelID, BATCH, ( mesh ) => {
                for ( let where = 0; where < mesh.geometries.size(); ++where ) {
                  collect( mesh.geometries.get( where ).geometryExpressID )
                }
              } ),
            ( batch ) => {

              // The copy window: the pump call has returned and the next one
              // has not started. This is where Share's onMeshBatch reads the
              // batch it was just handed, and where tail eviction handed it a
              // freed embind handle instead.
              for ( const geometryExpressID of batch ) {

                const geometry = api.GetGeometry( modelID, geometryExpressID )

                expect( [
                  geometry.GetVertexDataSize(),
                  geometry.GetIndexDataSize(),
                ] ).toEqual( reference.get( geometryExpressID ) )

                ++checked
              }
            } )

        expect( checked ).toBe( delivered.length )
        expect( checked ).toBeGreaterThan( 0 )

        // ...and the budget was doing something while that held. Without
        // this the test passes on a budget that never evicted, which is the
        // shape of vacuous check this area keeps producing: at least one
        // asset delivered earlier is gone by the end of the drain.
        const evicted = delivered.filter( ( geometryExpressID ) =>
          api.GetGeometry( modelID, geometryExpressID ).GetVertexDataSize() === 0 )

        expect( evicted.length ).toBeGreaterThan( 0 )

        api.CloseModel( modelID )
      }, 240000 )

  test( 'the async pump over an external store: same window',
      async () => {

        // The pump Share actually drives — ExtractGeometryBatchAsync over a
        // windowed source — which is a separate code path from the sync one
        // and carried its own tail-eviction call.
        const api = new IfcAPI()

        await api.Init()

        const modelID = await api.OpenModelStream(
            new InMemoryStepByteStore( fixture ), DEFERRED )

        expect( modelID ).toBeGreaterThanOrEqual( 0 )
        expect( api.getPassthrough( modelID )!.sourceIsExternal ).toBe( true )

        expect( api.SetGeometryBudget( modelID, BUDGET_BYTES / BYTES_PER_MIB )
            ?.budgetBytes ).toBe( BUDGET_BYTES )

        let checked = 0

        const delivered = await drain(
            api,
            modelID,
            async ( collect ) =>
              await api.ExtractGeometryBatchAsync( modelID, BATCH, ( mesh ) => {
                for ( let where = 0; where < mesh.geometries.size(); ++where ) {
                  collect( mesh.geometries.get( where ).geometryExpressID )
                }
              } ),
            ( batch ) => {

              for ( const geometryExpressID of batch ) {

                const geometry = api.GetGeometry( modelID, geometryExpressID )

                expect( [
                  geometry.GetVertexDataSize(),
                  geometry.GetIndexDataSize(),
                ] ).toEqual( reference.get( geometryExpressID ) )

                ++checked
              }
            } )

        expect( checked ).toBe( delivered.length )
        expect( checked ).toBeGreaterThan( 0 )

        const evicted = delivered.filter( ( geometryExpressID ) =>
          api.GetGeometry( modelID, geometryExpressID ).GetVertexDataSize() === 0 )

        expect( evicted.length ).toBeGreaterThan( 0 )

        api.CloseModel( modelID )
      }, 240000 )

  test( 'an evicted asset reads as the empty dummy, never as a throw',
      async () => {

        // The other half of the contract: outside the copy window an evicted
        // asset is GONE, and "gone" is documented as the dummy geometry
        // GetGeometry already returns for an unknown id — not an exception.
        // The compat layer's express-ID map is not purged when the residency
        // frees a native, so a late caller reaches a deleted embind handle;
        // this is the assertion that fails, by throwing, without the
        // isNativeDeleted guard in getGeometry.
        const api = new IfcAPI()

        await api.Init()

        const modelID = await api.OpenModelStreamed( fixture, DEFERRED )

        api.SetGeometryBudget( modelID, BUDGET_BYTES / BYTES_PER_MIB )

        const delivered = await drain(
            api,
            modelID,
            async ( collect ) =>
              api.ExtractGeometryBatch( modelID, BATCH, ( mesh ) => {
                for ( let where = 0; where < mesh.geometries.size(); ++where ) {
                  collect( mesh.geometries.get( where ).geometryExpressID )
                }
              } ) )

        expect( delivered.length ).toBeGreaterThan( 0 )

        let gone = 0

        for ( const geometryExpressID of new Set( delivered ) ) {

          // No try/catch: a throw here IS the bug, and swallowing it would
          // make this assertion unable to fail.
          const geometry = api.GetGeometry( modelID, geometryExpressID )

          const vertexBytes = geometry.GetVertexDataSize()

          if ( vertexBytes === 0 ) {
            expect( geometry.GetIndexDataSize() ).toBe( 0 )
            ++gone
          } else {
            expect( [ vertexBytes, geometry.GetIndexDataSize() ] )
                .toEqual( reference.get( geometryExpressID ) )
          }
        }

        // The budget bound: something really was evicted, so the loop above
        // exercised the deleted-handle path rather than walking a fully
        // resident model.
        expect( gone ).toBeGreaterThan( 0 )

        api.CloseModel( modelID )
      }, 240000 )
} )
