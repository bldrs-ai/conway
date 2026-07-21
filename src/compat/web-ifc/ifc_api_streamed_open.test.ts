/* eslint-disable no-magic-numbers */
// Integration tests for OpenModelStreamed (streamed columnar open).
//
// Parity requirement: a model opened through the streaming columnar
// indexer must be indistinguishable downstream from a classic
// OpenModel — same meshes (ids, placements, colors), same property
// reads, same spatial structure — and SpillModelSource must work
// afterwards exactly as it does on a classic open. The fallback
// contract (never worse than OpenModelAsync) is pinned via a factory
// spy: a successful streamed open must not have silently taken the
// classic path.
import * as fs from 'fs'

import { beforeAll, describe, expect, jest, test } from '@jest/globals'

import { InMemoryStepByteStore } from '../../step/step_buffer_provider'
import { FlatMesh, IfcAPI } from './ifc_api'
import { IfcApiModelPassthroughFactory } from './ifc_api_model_passthrough_factory'

const SETTINGS = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true }

let api: IfcAPI
let buffer: Uint8Array

/**
 * Capture StreamAllMeshes output as plain comparable objects.
 *
 * @param modelID The model to stream.
 * @return {object[]} One entry per mesh with its placed geometries.
 */
function captureMeshes( modelID: number ): object[] {

  const captured: object[] = []

  api.StreamAllMeshes( modelID, ( mesh: FlatMesh ) => {

    const geometries: object[] = []

    for ( let where = 0; where < mesh.geometries.size(); ++where ) {

      const placed = mesh.geometries.get( where )

      geometries.push( {
        color: placed.color,
        geometryExpressID: placed.geometryExpressID,
        flatTransformation: [ ...placed.flatTransformation ],
      } )
    }

    captured.push( { expressID: mesh.expressID, geometries } )
  } )

  return captured
}

beforeAll( async () => {
  api = new IfcAPI()
  await api.Init()

  buffer = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )
}, 120000 )

describe( 'OpenModelStreamed', () => {

  test( 'meshes and properties match a classic OpenModel exactly', async () => {

    const fallback = jest.spyOn( IfcApiModelPassthroughFactory, 'fromAsync' )

    const streamedID = await api.OpenModelStreamed( buffer, SETTINGS )

    // A successful streamed open must be the streamed path, not a
    // silent fallback (which would make the parity below vacuous).
    expect( streamedID ).toBeGreaterThanOrEqual( 0 )
    expect( fallback ).not.toHaveBeenCalled()
    fallback.mockRestore()

    const classicID = api.OpenModel( buffer, SETTINGS )

    expect( classicID ).toBeGreaterThanOrEqual( 0 )

    // Mesh parity: ids, placements, colors.
    expect( captureMeshes( streamedID ) ).toEqual( captureMeshes( classicID ) )

    // Property parity across every record.
    const classicPassthrough = api.getPassthrough( classicID )!
    const lineIDs = classicPassthrough.getAllLines()

    expect( lineIDs.size() ).toBeGreaterThan( 10 )
    expect( api.getPassthrough( streamedID )!.getAllLines().size() )
        .toBe( lineIDs.size() )

    for ( let where = 0; where < lineIDs.size(); ++where ) {

      const expressID = lineIDs.get( where )

      expect( await api.properties.getItemProperties( streamedID, expressID ) )
          .toEqual( await api.properties.getItemProperties( classicID, expressID ) )
    }

    // Spatial structure parity (names mode — Share's consumption).
    expect( await api.properties.getSpatialStructure( streamedID, 'names' ) )
        .toEqual( await api.properties.getSpatialStructure( classicID, 'names' ) )

    api.CloseModel( streamedID )
    api.CloseModel( classicID )
  }, 240000 )

  test( 'SpillModelSource works after a streamed open', async () => {

    const modelID = await api.OpenModelStreamed( buffer, SETTINGS )
    const passthrough = api.getPassthrough( modelID )!

    // Snapshot a spread of records through the resident path.
    const lineIDs = passthrough.getAllLines()
    const sampled = new Map<number, unknown>()

    for ( let where = 0; where < lineIDs.size(); where += 7 ) {

      const expressID = lineIDs.get( where )

      sampled.set( expressID, await api.properties.getItemProperties( modelID, expressID ) )
    }

    // Tiny windows force straddles + LRU eviction on the fixture.
    const spilled = api.SpillModelSource(
        modelID, new InMemoryStepByteStore( buffer ), 512, 3 )

    expect( spilled ).toBe( true )

    for ( const [ expressID, expected ] of sampled ) {

      expect( await api.properties.getItemProperties( modelID, expressID ) )
          .toEqual( expected )
    }

    api.CloseModel( modelID )
  }, 240000 )

  test( 'unparseable input returns -1 (streamed and fallback both refuse)', async () => {

    const garbage = new Uint8Array( [ 0, 1, 2, 3, 42, 255, 254, 253 ] )

    expect( await api.OpenModelStreamed( garbage, SETTINGS ) ).toBe( -1 )
  }, 120000 )
} )
