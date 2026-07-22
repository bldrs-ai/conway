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

  test.each( FIXTURES )(
      'deferred unit pump to completion matches classic exactly: %s', async ( fixture ) => {

        const data = new Uint8Array( fs.readFileSync( fixture ) )

        const classicID = api.OpenModel( data, SETTINGS )
        const classic = capture( classicID )

        expect( classic.size ).toBeGreaterThan( 0 )

        const deferredID = await api.OpenModelStreamed(
            data, { ...SETTINGS, DEFER_GEOMETRY: true } )

        expect( deferredID ).toBeGreaterThanOrEqual( 0 )

        // Pump in deliberately small unit batches, accumulating delta
        // emissions additively per entity.
        const pumped =
          new Map<number, { geometryExpressID: number, flatTransformation: number[] }[]>()
        let rounds = 0

        for ( ; ; ) {

          const { extracted, remaining } = api.ExtractGeometryBatch(
              deferredID, 2, ( mesh ) => {

                const list = pumped.get( mesh.expressID ) ?? []

                for ( let where = 0; where < mesh.geometries.size(); ++where ) {
                  const placed = mesh.geometries.get( where )
                  list.push( {
                    geometryExpressID: placed.geometryExpressID,
                    flatTransformation: [ ...placed.flatTransformation ],
                  } )
                }

                pumped.set( mesh.expressID, list )
              } )

          ++rounds

          if ( remaining === 0 && extracted === 0 ) {
            break
          }
        }

        expect( rounds ).toBeGreaterThan( 1 )
        expect( pumped.size ).toBe( classic.size )

        for ( const [ expressID, classicList ] of classic ) {

          const pumpedList = pumped.get( expressID )

          expect( pumpedList ).toBeDefined()
          expect( pumpedList!.length ).toBe( classicList.length )

          // Instance sets match (order may differ across unit batches):
          // every classic instance has an exactly-matching pumped one.
          const unmatched = pumpedList!.map( ( entry ) => entry )

          for ( const reference of classicList ) {
            const matchIndex = unmatched.findIndex( ( candidate ) =>
              candidate.geometryExpressID === reference.geometryExpressID &&
              candidate.flatTransformation.every( ( value, where ) =>
                Math.abs( value - reference.flatTransformation[ where ] ) < 1e-9 ) )

            expect( matchIndex ).toBeGreaterThanOrEqual( 0 )
            unmatched.splice( matchIndex, 1 )
          }
        }

        // No CloseModel: closing destroys the shared wasm processor and
        // degrades later opens (pre-existing multi-open quirk).
      }, 240000 )

  test( 'StreamAllMeshes on a deferred STEP model drains the pump and matches classic', async () => {

    const data = new Uint8Array( fs.readFileSync( FIXTURES[ 0 ] ) )

    const classicID = api.OpenModel( data, SETTINGS )
    const classic = capture( classicID )

    const deferredID = await api.OpenModelStreamed(
        data, { ...SETTINGS, DEFER_GEOMETRY: true } )

    // No pump calls at all — the whole-model consumer must still get
    // the complete mesh set (the proxy drains internally).
    const drained = capture( deferredID )

    expect( drained.size ).toBe( classic.size )

    for ( const [ expressID, classicList ] of classic ) {
      expect( drained.get( expressID )?.length ).toBe( classicList.length )
    }

  }, 240000 )
} )
