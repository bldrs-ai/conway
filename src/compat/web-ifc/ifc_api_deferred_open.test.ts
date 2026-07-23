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

  test( 'ReleaseModelGeometry frees served geometry, keeps meshes, refuses undrained pumps', async () => {

    // Fresh IfcAPI (CloseModel poisons later opens — see the content
    // parity test's note).
    const api3 = new IfcAPI()
    await api3.Init()

    // Undrained deferred pump: refuse (releasing would break the
    // remaining extraction).
    const deferredID = await api3.OpenModelStreamed(
        buffer, { ...SETTINGS, DEFER_GEOMETRY: true } )

    api3.ExtractGeometryBatch( deferredID, 1 )

    expect( api3.ReleaseModelGeometry( deferredID ) ).toBe( false )

    // Classic model: release frees GetGeometry serving, keeps captured
    // mesh data, double-release stays safe.
    const classicID = api3.OpenModel( buffer, SETTINGS )
    const geometryIDs: number[] = []
    let meshes = 0

    api3.StreamAllMeshes( classicID, ( mesh ) => {
      ++meshes
      for ( let where = 0; where < mesh.geometries.size(); ++where ) {
        geometryIDs.push( mesh.geometries.get( where ).geometryExpressID )
      }
    } )

    expect( meshes ).toBeGreaterThan( 0 )
    expect( api3.GetGeometry( classicID, geometryIDs[ 0 ] ).GetVertexDataSize() )
        .toBeGreaterThan( 0 )

    expect( api3.ReleaseModelGeometry( classicID ) ).toBe( true )

    // Served geometry degrades to the empty dummy; mesh data survives.
    expect( api3.GetGeometry( classicID, geometryIDs[ 0 ] ).GetVertexDataSize() )
        .toBe( 0 )

    let meshesAfter = 0
    api3.StreamAllMeshes( classicID, () => {
      ++meshesAfter
    } )
    expect( meshesAfter ).toBeGreaterThan( 0 )

    expect( api3.ReleaseModelGeometry( classicID ) ).toBe( true )
    expect( api3.ReleaseModelGeometry( 9999 ) ).toBe( false )
  }, 240000 )

  test( 'pump applies the rel-aggregates master-voids pass (cut parity)', async () => {

    // Classic's whole-model walk follows its product loop with a second
    // pass re-extracting every IfcRelAggregates related product with
    // the RELATING object's rel-voids, REPLACING the canonical mesh
    // under the same localID — aggregate parts whose parent carries
    // openings end up cut. A pump that only ran the per-product pass
    // served the UNCUT content classic never exposes (field reports:
    // wrong shapes + flicker on faceset-heavy vyzn models). The
    // synthetic fixture is an assembly voided by an opening,
    // aggregating a box part the opening must cut.
    //
    // Fresh IfcAPI (CloseModel poisons later opens — see the content
    // parity test's note).
    const api4 = new IfcAPI()
    await api4.Init()

    const fixture = new Uint8Array(
        fs.readFileSync( 'data/aggregate_master_voids.ifc' ) )

    const classicID = api4.OpenModel( fixture, SETTINGS )
    const classicInstances: number[] = []

    api4.StreamAllMeshes( classicID, ( mesh ) => {
      for ( let where = 0; where < mesh.geometries.size(); ++where ) {
        classicInstances.push( mesh.geometries.get( where ).geometryExpressID )
      }
    } )

    // The second pass re-extracts the part: two placed instances of the
    // (cut) part geometry — the fixture must exercise the seam at all.
    expect( classicInstances.length ).toBe( 2 )

    const deferredID = await api4.OpenModelStreamed(
        fixture, { ...SETTINGS, DEFER_GEOMETRY: true } )
    const pumpedInstances: number[] = []

    for ( ; ; ) {

      const { extracted, remaining } = api4.ExtractGeometryBatch(
          deferredID, 1, ( mesh ) => {
            for ( let where = 0; where < mesh.geometries.size(); ++where ) {
              pumpedInstances.push(
                  mesh.geometries.get( where ).geometryExpressID )
            }
          } )

      if ( remaining === 0 && extracted === 0 ) {
        break
      }
    }

    // Instance parity: the pump must emit the re-extracted instance too.
    expect( pumpedInstances.sort() ).toEqual( classicInstances.sort() )

    // Content parity: GetGeometry must serve the CUT part, byte-identical
    // to classic (the uncut box has strictly fewer vertices).
    for ( const geometryID of new Set( classicInstances ) ) {

      const classicGeometry = api4.GetGeometry( classicID, geometryID )
      const deferredGeometry = api4.GetGeometry( deferredID, geometryID )

      const classicSize = classicGeometry.GetVertexDataSize()

      expect( classicSize ).toBeGreaterThan( 0 )
      expect( deferredGeometry.GetVertexDataSize() ).toBe( classicSize )
      expect( deferredGeometry.GetIndexDataSize() )
          .toBe( classicGeometry.GetIndexDataSize() )

      const classicVertices =
        api4.GetVertexArray( classicGeometry.GetVertexData(), classicSize )
      const deferredVertices =
        api4.GetVertexArray( deferredGeometry.GetVertexData(), classicSize )

      expect( deferredVertices ).toEqual( classicVertices )
    }

    api4.CloseModel( classicID )
    api4.CloseModel( deferredID )
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
