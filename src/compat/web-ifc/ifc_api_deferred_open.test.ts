/* eslint-disable no-magic-numbers */
// Deferred-geometry streamed open (demand/tiled rendering slice A):
// pumping ExtractGeometryBatch to completion must reproduce EXACTLY the
// meshes a classic OpenModel + StreamAllMeshes produces — same
// entities, same placed-geometry ids, colors, and transforms — across
// multiple small batches (which exercises the persisted coordination
// matrix; a single-shot capture can't catch a stale one).
import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import { FlatMesh, IfcAPI } from './ifc_api'

const SETTINGS = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true }

let api: IfcAPI
let buffer: Uint8Array

/**
 * Flatten a FlatMesh into comparable plain data.
 *
 * @param mesh The mesh.
 * @return {object} Plain comparable form.
 */
function flatten( mesh: FlatMesh, previous?: object ): object {

  const geometries: object[] =
    ( previous as { geometries?: object[] } | undefined )?.geometries ?? []

  for ( let where = 0; where < mesh.geometries.size(); ++where ) {

    const placed = mesh.geometries.get( where )

    geometries.push( {
      color: placed.color,
      geometryExpressID: placed.geometryExpressID,
      flatTransformation: [ ...placed.flatTransformation ],
    } )
  }

  return { expressID: mesh.expressID, geometries }
}

beforeAll( async () => {
  api = new IfcAPI()
  await api.Init()

  buffer = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )
}, 120000 )

describe( 'OpenModelStreamed + DEFER_GEOMETRY', () => {

  test( 'batch pump to completion matches classic StreamAllMeshes exactly', async () => {

    const classicID = api.OpenModel( buffer, SETTINGS )
    const classic = new Map<number, object>()

    api.StreamAllMeshes( classicID, ( mesh ) => {
      classic.set( mesh.expressID, flatten( mesh ) )
    } )

    expect( classic.size ).toBeGreaterThan( 0 )

    const deferredID = await api.OpenModelStreamed(
        buffer, { ...SETTINGS, DEFER_GEOMETRY: true } )

    expect( deferredID ).toBeGreaterThanOrEqual( 0 )

    // Pump in deliberately small batches; collect incremental meshes.
    // (Deltas: an entity may re-emit with only its NEW instances —
    // `flatten` accumulation in the map below must be additive.)
    const streamed = new Map<number, object>()
    let firstBatchCount = 0
    let rounds = 0

    for ( ; ; ) {

      const { extracted, remaining } = api.ExtractGeometryBatch(
          deferredID, 7, ( mesh ) => {
            streamed.set(
                mesh.expressID,
                flatten( mesh, streamed.get( mesh.expressID ) ) )
          } )

      if ( rounds === 0 ) {
        firstBatchCount = streamed.size
      }

      ++rounds

      if ( remaining === 0 && extracted === 0 ) {
        break
      }
    }

    // Incrementality: meshes arrived before the pump completed.
    expect( rounds ).toBeGreaterThan( 2 )
    expect( firstBatchCount ).toBeGreaterThanOrEqual( 0 )
    expect( streamed.size ).toBe( classic.size )

    // Exact parity per entity: ids, colors, transforms.
    for ( const [ expressID, mesh ] of classic ) {
      expect( streamed.get( expressID ) ).toEqual( mesh )
    }

    api.CloseModel( classicID )
    api.CloseModel( deferredID )
  }, 240000 )

  test( 'StreamAllMeshes on a deferred model drains the pump and matches classic', async () => {

    const classicID = api.OpenModel( buffer, SETTINGS )
    const classic = new Map<number, object>()

    api.StreamAllMeshes( classicID, ( mesh ) => {
      classic.set( mesh.expressID, flatten( mesh ) )
    } )

    const deferredID = await api.OpenModelStreamed(
        buffer, { ...SETTINGS, DEFER_GEOMETRY: true } )

    // No pump calls at all — the whole-model consumer must still get
    // the complete mesh set (the shim drains internally).
    const drained = new Map<number, object>()
    api.StreamAllMeshes( deferredID, ( mesh ) => {
      drained.set( mesh.expressID, flatten( mesh ) )
    } )

    expect( drained.size ).toBe( classic.size )
    for ( const [ expressID, mesh ] of classic ) {
      expect( drained.get( expressID ) ).toEqual( mesh )
    }

    api.CloseModel( classicID )
    api.CloseModel( deferredID )
  }, 240000 )

  test( 'deferred GetGeometry serves byte-identical vertex content to classic', async () => {

    // The build multiplies GetGeometry FLOAT vertices by captured
    // transforms, and the float mirror's frame must match the scene
    // transforms (frozen at mesh add — see IfcModelGeometry.add). A
    // per-geometry frame shift here renders as scattered pieces even
    // with perfect transform parity, which transform-only assertions
    // cannot catch.
    //
    // Fresh IfcAPI: CloseModel destroys the shared wasm processor, and
    // models opened after ANY close serve empty geometry payloads (a
    // long-standing multi-open shim quirk — browsers open one model per
    // page). The shared `api` has closed models by the time this runs.
    const api2 = new IfcAPI()
    await api2.Init()

    const classicID = api2.OpenModel( buffer, SETTINGS )
    const geometryIDs = new Set<number>()

    api2.StreamAllMeshes( classicID, ( mesh ) => {
      for ( let where = 0; where < mesh.geometries.size(); ++where ) {
        geometryIDs.add( mesh.geometries.get( where ).geometryExpressID )
      }
    } )

    const deferredID = await api2.OpenModelStreamed(
        buffer, { ...SETTINGS, DEFER_GEOMETRY: true } )

    api2.StreamAllMeshes( deferredID, () => { /* drain */ } )

    let compared = 0

    for ( const geometryID of geometryIDs ) {

      const classicGeometry = api2.GetGeometry( classicID, geometryID )
      const deferredGeometry = api2.GetGeometry( deferredID, geometryID )

      const classicSize = classicGeometry.GetVertexDataSize()

      if ( classicSize === 0 ) {
        continue
      }

      expect( deferredGeometry.GetVertexDataSize() ).toBe( classicSize )

      const classicVertices =
        api2.GetVertexArray( classicGeometry.GetVertexData(), classicSize )
      const deferredVertices =
        api2.GetVertexArray( deferredGeometry.GetVertexData(), classicSize )

      expect( deferredVertices ).toEqual( classicVertices )
      ++compared
    }

    expect( compared ).toBeGreaterThan( 0 )

    api2.CloseModel( classicID )
    api2.CloseModel( deferredID )
  }, 240000 )

  test( 'ExtractGeometryBatch is a safe no-op on non-deferred models', async () => {

    const modelID = await api.OpenModelStreamed( buffer, SETTINGS )

    expect( api.ExtractGeometryBatch( modelID, 8 ) )
        .toEqual( { extracted: 0, remaining: 0 } )
    expect( api.ExtractGeometryBatch( 9999, 8 ) )
        .toEqual( { extracted: 0, remaining: 0 } )

    api.CloseModel( modelID )
  }, 120000 )
} )
