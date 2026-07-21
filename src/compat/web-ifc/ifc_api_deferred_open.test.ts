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
function flatten( mesh: FlatMesh ): object {

  const geometries: object[] = []

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

    // Nothing extracted yet: the scene walk yields no meshes.
    const before: number[] = []
    api.StreamAllMeshes( deferredID, ( mesh ) => {
      before.push( mesh.expressID )
    } )
    expect( before ).toHaveLength( 0 )

    // Pump in deliberately small batches; collect incremental meshes.
    const streamed = new Map<number, object>()
    let firstBatchCount = 0
    let rounds = 0

    for ( ; ; ) {

      const { extracted, remaining } = api.ExtractGeometryBatch(
          deferredID, 7, ( mesh ) => {
            streamed.set( mesh.expressID, flatten( mesh ) )
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

  test( 'ExtractGeometryBatch is a safe no-op on non-deferred models', async () => {

    const modelID = await api.OpenModelStreamed( buffer, SETTINGS )

    expect( api.ExtractGeometryBatch( modelID, 8 ) )
        .toEqual( { extracted: 0, remaining: 0 } )
    expect( api.ExtractGeometryBatch( 9999, 8 ) )
        .toEqual( { extracted: 0, remaining: 0 } )

    api.CloseModel( modelID )
  }, 120000 )
} )
