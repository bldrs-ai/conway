/* eslint-disable no-magic-numbers */
// Uint32Sink backs the polygonal-faceset extraction fast path, and
// extractIntegerArrayInto must stay exactly equivalent to the generated
// array getters it replaces there — including for a real model's faces.
import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import { IfcAPI } from '../../compat/web-ifc/ifc_api'
import EntityTypesIfc from '../../ifc/ifc4_gen/entity_types_ifc.gen'
import {
  IfcIndexedPolygonalFace,
  IfcIndexedPolygonalFaceWithVoids,
  IfcPolygonalFaceSet,
} from '../../ifc/ifc4_gen/index'
import { Uint32Sink, extractUnsignedIntegerListAt } from './uint32_sink'

describe( 'Uint32Sink', () => {

  test( 'appends, grows past its initial capacity, and views exactly its length', () => {

    const sink = new Uint32Sink( 2 )

    expect( sink.length ).toBe( 0 )
    expect( Array.from( sink.view ) ).toEqual( [] )

    for ( let where = 0; where < 10; ++where ) {
      sink.push( where * 3 )
    }

    expect( sink.length ).toBe( 10 )
    expect( Array.from( sink.view ) ).toEqual( [ 0, 3, 6, 9, 12, 15, 18, 21, 24, 27 ] )
  } )

  test( 'extractUnsignedIntegerListAt parses a plain CoordIndex list', () => {

    const sink = new Uint32Sink( 4 )
    const bytes = new TextEncoder().encode( '(1,2,3,4)' )

    expect( extractUnsignedIntegerListAt( bytes, 0, bytes.length, sink ) ).toBe( 4 )
    expect( Array.from( sink.view ) ).toEqual( [ 1, 2, 3, 4 ] )
  } )

  test( 'extractUnsignedIntegerListAt refuses a real and leaves the sink clean', () => {

    const sink = new Uint32Sink( 4 )
    const bytes = new TextEncoder().encode( '(1,2.5,3)' )

    sink.push( 9 )

    expect( extractUnsignedIntegerListAt( bytes, 0, bytes.length, sink ) )
        .toBeUndefined()
    expect( Array.from( sink.view ) ).toEqual( [ 9 ] )
  } )

  test( 'reset drops elements but keeps capacity for reuse', () => {

    const sink = new Uint32Sink( 4 )

    sink.push( 11 )
    sink.push( 22 )
    sink.reset()

    expect( sink.length ).toBe( 0 )
    expect( Array.from( sink.view ) ).toEqual( [] )

    sink.push( 33 )

    expect( Array.from( sink.view ) ).toEqual( [ 33 ] )
  } )
} )

describe( 'extractIntegerArrayInto', () => {

  let api: IfcAPI
  let modelID: number

  /**
   * The faces the extraction fast path actually covers: voided faces
   * keep the getter path in production, so exclude them here too.
   *
   * @return {IfcIndexedPolygonalFace[]} Non-voided faces of the fixture.
   */
  function plainFaces(): IfcIndexedPolygonalFace[] {

    // The passthrough holds the proxy tuple; the StepModel is its head.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const model = ( api as any ).models.get( modelID ).model[ 0 ]

    return ( Array.from( model.types( IfcIndexedPolygonalFace ) ) as
      IfcIndexedPolygonalFace[] )
        .filter( ( face ) => !( face instanceof IfcIndexedPolygonalFaceWithVoids ) )
  }

  beforeAll( async () => {
    api = new IfcAPI()
    await api.Init()

    modelID = api.OpenModel(
        new Uint8Array( fs.readFileSync( 'data/index.ifc' ) ),
        { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true } )
  }, 120000 )

  test( 'matches the generated CoordIndex getter on every face of a real model', () => {

    const faces = plainFaces()

    expect( faces.length ).toBeGreaterThan( 0 )

    const sink = new Uint32Sink( 4 )

    for ( const face of faces ) {

      // The getter caches, so read it first and compare the in-place
      // parse against it — the fast path must be a drop-in.
      const expected = face.CoordIndex

      sink.reset()

      const count = face.extractIntegerArrayInto( 0, 0, 3, sink )

      expect( count ).toBe( expected.length )
      expect( Array.from( sink.view ) ).toEqual( expected )
    }
  }, 120000 )

  test( 'appends consecutively across records into one sink', () => {

    const faces = plainFaces()
    const sink = new Uint32Sink( 4 )
    const expected: number[] = []

    for ( const face of faces ) {
      face.extractIntegerArrayInto( 0, 0, 3, sink )
      expected.push( ...face.CoordIndex )
    }

    expect( Array.from( sink.view ) ).toEqual( expected )
  }, 120000 )
} )


// The reference-level path the faceset extraction uses to avoid
// constructing an entity per face. It must agree with the generated
// getters exactly, and must report failure (rather than guess) whenever
// its preconditions don't hold, because the caller's fallback depends on
// that signal.
describe( 'reference-level faceset fast path', () => {

  const FACES_OFFSET = 2
  const FACES_BASE_OFFSET = 1
  const FACES_DEPTH = 4
  const COORD_INDEX_OFFSET = 0

  let api: IfcAPI
  let modelID: number

  /**
   * @return {object} The StepModel behind the passthrough tuple.
   */
  function stepModel(): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ( api as any ).models.get( modelID ).model[ 0 ]
  }

  /**
   * @return {IfcPolygonalFaceSet[]} The fixture's facesets.
   */
  function faceSets(): IfcPolygonalFaceSet[] {
    return Array.from( stepModel().types( IfcPolygonalFaceSet ) ) as IfcPolygonalFaceSet[]
  }

  beforeAll( async () => {
    api = new IfcAPI()
    await api.Init()

    modelID = api.OpenModel(
        new Uint8Array( fs.readFileSync( 'data/index.ifc' ) ),
        { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true } )
  }, 120000 )

  test( 'forEachReferenceInField yields exactly the express IDs the Faces getter resolves', () => {

    const sets = faceSets()

    expect( sets.length ).toBeGreaterThan( 0 )

    for ( const faceSet of sets ) {

      const walked: ( number | undefined )[] = []

      const completed = faceSet.forEachReferenceInField(
          FACES_OFFSET, FACES_BASE_OFFSET, FACES_DEPTH,
          ( expressID ) => {
            walked.push( expressID )
            return true
          } )

      expect( completed ).toBe( true )
      expect( walked ).toEqual( faceSet.Faces.map( ( face ) => face.expressID ) )
    }
  }, 120000 )

  test( 'forEachReferenceInField stops when the callback returns false', () => {

    const faceSet = faceSets()[ 0 ]
    const walked: ( number | undefined )[] = []

    const completed = faceSet.forEachReferenceInField(
        FACES_OFFSET, FACES_BASE_OFFSET, FACES_DEPTH,
        ( expressID ) => {
          walked.push( expressID )
          return false
        } )

    expect( completed ).toBe( false )
    expect( walked.length ).toBe( 1 )
  }, 120000 )

  test( 'extractIntegerArrayByExpressIDInto matches the generated CoordIndex getter', () => {

    const model = stepModel()
    const sink = new Uint32Sink( 4 )

    for ( const faceSet of faceSets() ) {
      for ( const face of faceSet.Faces ) {

        if ( face instanceof IfcIndexedPolygonalFaceWithVoids ) {
          continue
        }

        sink.reset()

        const count = model.extractIntegerArrayByExpressIDInto(
            face.expressID,
            COORD_INDEX_OFFSET,
            EntityTypesIfc.IFCINDEXEDPOLYGONALFACE,
            sink )

        expect( count ).toBe( face.CoordIndex.length )
        expect( Array.from( sink.view ) ).toEqual( face.CoordIndex )
      }
    }
  }, 120000 )

  test( 'column path matches CoordIndex without materialising the face first', () => {

    const model = stepModel()
    const sink = new Uint32Sink( 4 )

    for ( const faceSet of faceSets() ) {

      const expressIDs: number[] = []

      faceSet.forEachReferenceInField(
          FACES_OFFSET, FACES_BASE_OFFSET, FACES_DEPTH,
          ( expressID ) => {

            if ( expressID !== void 0 ) {
              expressIDs.push( expressID )
            }

            return true
          } )

      const fromColumns: number[][] = []

      for ( const expressID of expressIDs ) {

        sink.reset()

        const count = model.extractIntegerArrayByExpressIDInto(
            expressID,
            COORD_INDEX_OFFSET,
            EntityTypesIfc.IFCINDEXEDPOLYGONALFACE,
            sink )

        if ( count === void 0 ) {
          continue
        }

        fromColumns.push( Array.from( sink.view ) )
      }

      const fromGetter = faceSet.Faces
          .filter( ( face ) => !( face instanceof IfcIndexedPolygonalFaceWithVoids ) )
          .map( ( face ) => face.CoordIndex )

      expect( fromColumns ).toEqual( fromGetter )
    }
  }, 120000 )

  test( 'reports failure for an unknown express ID and for a type mismatch', () => {

    const model = stepModel()
    const sink = new Uint32Sink( 4 )
    const face = faceSets()[ 0 ].Faces[ 0 ]

    // Unknown record: the caller must fall back, not read something else.
    expect( model.extractIntegerArrayByExpressIDInto(
        0xFFFFFFF, COORD_INDEX_OFFSET, EntityTypesIfc.IFCINDEXEDPOLYGONALFACE, sink ) )
        .toBeUndefined()

    // Right record, wrong expected type: field offsets would not be
    // comparable, so this must refuse rather than misread the record.
    expect( model.extractIntegerArrayByExpressIDInto(
        face.expressID, COORD_INDEX_OFFSET, EntityTypesIfc.IFCPOLYGONALFACESET, sink ) )
        .toBeUndefined()
  }, 120000 )
} )
