/* eslint-disable no-magic-numbers */
// STEP demand parity phase 1: the streamed columnar open for AP214 must
// reproduce the classic open exactly — same entities, same placed
// instances and transforms, and byte-identical GetGeometry vertex
// content (the served float frame must match the scene transforms; see
// AP214ModelGeometry.add's mirror-freeze note).
import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import { FlatMesh, IfcAPI } from './ifc_api'

const SETTINGS = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true }

// Fixtures with real served geometry (as1-assembly is structure-only —
// zero meshes even classically; ap214-multibody-part's geometry ids
// serve no vertex data through GetGeometry on the classic path either).
const FIXTURES = [
  'data/nema-23-76mm.step',
  'data/a-gear-with-3-inch-diameter-and-20-curved-teeth.step',
]

let api: IfcAPI

/**
 * Capture per-entity placed instances from a model.
 *
 * @param modelID The open model.
 * @return {Map} expressID -> {geometryExpressID, flatTransformation}[].
 */
function capture( modelID: number ):
  Map<number, { geometryExpressID: number, flatTransformation: number[] }[]> {

  const instances =
    new Map<number, { geometryExpressID: number, flatTransformation: number[] }[]>()

  api.StreamAllMeshes( modelID, ( mesh: FlatMesh ) => {

    const list = instances.get( mesh.expressID ) ?? []

    for ( let where = 0; where < mesh.geometries.size(); ++where ) {

      const placed = mesh.geometries.get( where )

      list.push( {
        geometryExpressID: placed.geometryExpressID,
        flatTransformation: [ ...placed.flatTransformation ],
      } )
    }

    instances.set( mesh.expressID, list )
  } )

  return instances
}

beforeAll( async () => {
  api = new IfcAPI()
  await api.Init()
}, 120000 )

describe( 'OpenModelStreamed on AP214 STEP input', () => {

  test.each( FIXTURES )( 'streamed open matches classic exactly: %s', async ( fixture ) => {

    const data = new Uint8Array( fs.readFileSync( fixture ) )

    const classicID = api.OpenModel( data, SETTINGS )
    const classic = capture( classicID )

    expect( classic.size ).toBeGreaterThan( 0 )

    const streamedID = await api.OpenModelStreamed( data, SETTINGS )

    expect( streamedID ).toBeGreaterThanOrEqual( 0 )

    const streamed = capture( streamedID )

    expect( streamed.size ).toBe( classic.size )

    for ( const [ expressID, classicList ] of classic ) {

      const streamedList = streamed.get( expressID )

      expect( streamedList ).toBeDefined()
      expect( streamedList!.length ).toBe( classicList.length )

      for ( let where = 0; where < classicList.length; ++where ) {
        expect( streamedList![ where ].geometryExpressID )
            .toBe( classicList[ where ].geometryExpressID )
        expect( streamedList![ where ].flatTransformation )
            .toEqual( classicList[ where ].flatTransformation )
      }
    }

    // Vertex content: the streamed open's GetGeometry must serve
    // byte-identical floats to classic for every placed geometry.
    const geometryIDs = new Set<number>()

    for ( const list of classic.values() ) {
      for ( const placed of list ) {
        geometryIDs.add( placed.geometryExpressID )
      }
    }

    let compared = 0

    for ( const geometryID of geometryIDs ) {

      const classicGeometry = api.GetGeometry( classicID, geometryID )
      const streamedGeometry = api.GetGeometry( streamedID, geometryID )

      const classicSize = classicGeometry.GetVertexDataSize()

      if ( classicSize === 0 ) {
        continue
      }

      expect( streamedGeometry.GetVertexDataSize() ).toBe( classicSize )

      expect( api.GetVertexArray( streamedGeometry.GetVertexData(), classicSize ) )
          .toEqual( api.GetVertexArray( classicGeometry.GetVertexData(), classicSize ) )

      ++compared
    }

    expect( compared ).toBeGreaterThan( 0 )

    // No CloseModel here: closing destroys the shared wasm processor
    // and poisons later opens (pre-existing multi-open quirk).
  }, 240000 )

  test( 'DEFER_GEOMETRY on STEP input is accepted; the pump is a no-op', async () => {

    const data = new Uint8Array( fs.readFileSync( FIXTURES[ 0 ] ) )

    const deferredID = await api.OpenModelStreamed(
        data, { ...SETTINGS, DEFER_GEOMETRY: true } )

    expect( deferredID ).toBeGreaterThanOrEqual( 0 )

    // STEP extraction is not deferred yet (phase 2): the pump no-ops
    // and whole-model consumers use StreamAllMeshes, exactly the
    // contract Share's demand branch falls back on.
    expect( api.ExtractGeometryBatch( deferredID, 8 ) )
        .toEqual( { extracted: 0, remaining: 0 } )

    const captured = capture( deferredID )

    expect( captured.size ).toBeGreaterThan( 0 )
  }, 240000 )
} )
