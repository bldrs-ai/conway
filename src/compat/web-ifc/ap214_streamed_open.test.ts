/* eslint-disable no-magic-numbers */
// STEP demand parity phase 1: the streamed columnar open for AP214 must
// reproduce the classic open exactly — same entities, same placed
// instances and transforms, and byte-identical GetGeometry vertex
// content (the served float frame must match the scene transforms; see
// AP214ModelGeometry.add's mirror-freeze note).
import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import { IDENTITY_MAT4, NORMALIZE_MAT_F64 } from './coordination_f64'
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

  test( 'ON_PREVIEW_MESH emits classic-parity payloads for STEP (phase 3)', async () => {

    // The gear parses in one cooperative slice, so the timer-driven
    // channel never fires during a real open here — drive the channel
    // directly over a finished sink (prefix == whole file), like the
    // IFC channel test: a full drain must reproduce the classic
    // instance set with the AP214 capture math (bare composition).
    const fs2 = await import( 'fs' )
    const { ConwayGeometry } = await import( '../../../dependencies/conway-geom' )
    const { buildIndexStreaming } =
      await import( '../../step/parsing/streaming_index_builder' )
    const { ColumnarIndexSink } = await import( '../../step/parsing/columnar_index' )
    const { BufferByteSource } = await import( '../../step/parsing/byte_source' )
    const AP214StepParser =
      ( await import( '../../AP214E3_2010/ap214_step_parser' ) ).default
    const { ap214PreviewAdapter, StreamedPreviewChannel } =
      await import( './streamed_preview_channel' )

    const data = new Uint8Array( fs2.readFileSync( FIXTURES[ 1 ] ) )

    const classicID = api.OpenModel( data, SETTINGS )
    const classic = capture( classicID )

    let classicTotal = 0

    for ( const list of classic.values() ) {
      classicTotal += list.length
    }

    expect( classicTotal ).toBeGreaterThan( 0 )

    const conwayGeometry = new ConwayGeometry()
    expect( await conwayGeometry.initialize() ).toBe( true )

    const sink = new ColumnarIndexSink<number>()
    const { result } = buildIndexStreaming(
        new BufferByteSource( data ), AP214StepParser.Instance,
        1024 * 1024, void 0, sink )

    expect( result ).toBe( 0 )

    const payloads: { expressID: number, geometryExpressID: number,
      flatTransformation: number[], vertexData?: Float32Array }[] = []

    const channel = new StreamedPreviewChannel(
        data, conwayGeometry, sink, ap214PreviewAdapter(), true,
        ( mesh ) => payloads.push( mesh ), void 0, void 0, 1 )

    channel.drainForTest()

    expect( payloads.length ).toBe( classicTotal )

    for ( const payload of payloads ) {

      const candidates = classic.get( payload.expressID )

      expect( candidates ).toBeDefined()

      const matchIndex = candidates!.findIndex( ( candidate ) =>
        candidate.geometryExpressID === payload.geometryExpressID &&
        candidate.flatTransformation.every( ( value, where ) =>
          Math.abs( value - payload.flatTransformation[ where ] ) < 1e-6 ) )

      expect( matchIndex ).toBeGreaterThanOrEqual( 0 )
    }

    const carriers = payloads.filter( ( payload ) => payload.vertexData !== void 0 )

    expect( carriers.length ).toBeGreaterThan( 0 )
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

  test( 'classic and deferred report the same applied coordination frame',
      async () => {

        // The AP214 arm of the Share#1634 accessor. Both walks derive
        // through deriveCoordinationF64 and both must RECORD what they
        // derived: the classic walk kept it in a local for a while, so
        // GetAppliedCoordinationMatrix answered identity for a model it
        // had in fact composed a frame into, while the deferred pump on
        // the same file answered the truth. A consumer mapping a
        // rendered point back to authored coordinates got a different
        // answer depending on which open it took.
        const data = new Uint8Array( fs.readFileSync( FIXTURES[ 0 ] ) )

        const classicID = api.OpenModel( data, SETTINGS )

        capture( classicID )

        const classic = api.GetAppliedCoordinationMatrix( classicID )

        const deferredID = await api.OpenModelStreamed(
            data, { ...SETTINGS, DEFER_GEOMETRY: true } )

        capture( deferredID )

        expect( api.GetAppliedCoordinationMatrix( deferredID ) ).toEqual( classic )

        // Non-vacuous: this fixture sits near the origin, so the frame
        // carries no recentre — but it still carries the Z-up -> Y-up
        // basis change and the file's unit scale, which is exactly what
        // an identity report would lose. Without this the equality above
        // would hold just as well for two paths that both reported
        // nothing.
        expect( classic[ 12 ] ).toBe( 0 )
        expect( classic[ 13 ] ).toBe( 0 )
        expect( classic[ 14 ] ).toBe( 0 )

        const scale = Math.hypot( classic[ 0 ], classic[ 1 ], classic[ 2 ] )

        expect( scale ).toBeGreaterThan( 0 )

        for ( let element = 0; element < 16; ++element ) {

          // Bottom row unscaled; the columns above it are NormalizeMat
          // times the linear scaling factor.
          const expected = ( element % 4 ) === 3 ?
            NORMALIZE_MAT_F64[ element ] : NORMALIZE_MAT_F64[ element ] * scale

          expect( classic[ element ] ).toBeCloseTo( expected, 9 )
        }

        // ...and that is not identity, so an accessor that lost the
        // classic frame would be caught by the equality above.
        expect( classic ).not.toEqual( [ ...IDENTITY_MAT4 ] )
      }, 240000 )

  test( 'a second classic walk composes under the frame the first derived',
      async () => {

        // conway#703 on the AP214 arm. More than one classic walk of one
        // live model is legal, and the second used to seed its
        // coordination local from the model tuple's identity while the
        // `_isCoordinated` guard — correctly — stopped it re-deriving, so
        // it re-emitted every placement without the frame. On a
        // near-origin STEP part that is not a 2.6e6 m jump, it is the
        // Z-up -> Y-up basis change going missing: the second walk's
        // copies of the model come back in a different axis convention
        // from the first's, and from what GetAppliedCoordinationMatrix
        // says they are in.
        const data = new Uint8Array( fs.readFileSync( FIXTURES[ 0 ] ) )

        const modelID = api.OpenModel( data, SETTINGS )

        const first = capture( modelID )

        expect( first.size ).toBeGreaterThan( 0 )

        const applied = api.GetAppliedCoordinationMatrix( modelID )

        // The per-entity placement vectors are cumulative across walks, so
        // after the second walk each entity carries both emissions and the
        // tail of the list is the second walk's.
        const second = capture( modelID )

        expect( second.size ).toBe( first.size )

        let compared = 0

        for ( const [ expressID, firstList ] of first ) {

          const bothWalks = second.get( expressID )!

          expect( bothWalks.length ).toBe( firstList.length * 2 )

          for ( let where = 0; where < firstList.length; ++where ) {

            const rewalked = bothWalks[ firstList.length + where ]

            expect( rewalked.geometryExpressID )
                .toBe( firstList[ where ].geometryExpressID )

            // Bit-equality: the same composition over the same inputs, so
            // any difference at all means the two walks disagreed about
            // the frame.
            expect( rewalked.flatTransformation )
                .toEqual( firstList[ where ].flatTransformation )

            ++compared
          }
        }

        expect( compared ).toBeGreaterThan( 0 )

        // The accessor still describes what the SECOND walk emitted, which
        // is the half that fails on the applied-frame contract rather than
        // on parity.
        expect( api.GetAppliedCoordinationMatrix( modelID ) ).toEqual( applied )
        expect( applied ).not.toEqual( [ ...IDENTITY_MAT4 ] )
      }, 240000 )
} )
