/* eslint-disable no-magic-numbers */
// Uint32Sink backs the polygonal-faceset extraction fast path, and
// extractIntegerArrayInto must stay exactly equivalent to the generated
// array getters it replaces there — including for a real model's faces.
import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import { IfcAPI } from '../../compat/web-ifc/ifc_api'
import {
  IfcIndexedPolygonalFace,
  IfcIndexedPolygonalFaceWithVoids,
} from '../../ifc/ifc4_gen/index'
import { Uint32Sink } from './uint32_sink'

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
