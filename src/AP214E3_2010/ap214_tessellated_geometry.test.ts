import fs from 'fs'
import { beforeAll, describe, expect, test } from '@jest/globals'
import { ConwayGeometry } from '../../dependencies/conway-geom'
import { ExtractResult } from '../core/shared_constants'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ParseResult } from '../step/parsing/step_parser'
import { AP214GeometryExtraction } from './ap214_geometry_extraction'
import { AP214SceneBuilder } from './ap214_scene_builder'
import AP214StepParser from './ap214_step_parser'
import { product_definition_shape } from './AP214E3_2010_gen/product_definition_shape.gen'
import {
  ap214TypeName,
  complex_triangulated_face,
  coordinates_list,
  EntityTypesAP214Tessellated,
  tessellated_shape_representation,
  tessellated_solid,
} from './ap214_tessellated_types'


/**
 * A minimal AP242 tessellated part (test-models#62), shaped like the part
 * geometry of `nist_ftc_08_asme1_ap242-e1-tg.stp` but small enough to assert
 * exactly:
 *
 *  - one TESSELLATED_SOLID of two COMPLEX_TRIANGULATED_FACEs, one encoded as
 *    a strip and one as a fan, one with per-vertex normals and one with a
 *    single face normal, one with `geometric_link` populated (slot 4) and one
 *    with it `$`;
 *  - a `pnindex` on both that is NOT the identity, so an implementation that
 *    skips the indirection reads the wrong points;
 *  - the two decoys the real file carries — the 'shape for associated data'
 *    SHAPE_REPRESENTATION holding the same solid, and a
 *    TESSELLATED_SHAPE_REPRESENTATION whose only item is a bare
 *    COORDINATES_LIST — both of which must render nothing.
 */
const FIXTURE = 'data/ap242-tessellated-solid.step'

// Coordinate slots the fixture's two faces address through their pnindex.
const STRIP_FACE_TRIANGLES = [ 6, 2, 4, 4, 2, 7 ]
const FAN_FACE_TRIANGLES = [ 3, 8, 5, 3, 5, 1 ]

/** Express id of the fixture's TESSELLATED_SOLID. */
const SOLID_EXPRESS_ID = 530

/** Express id of the part's TESSELLATED_SHAPE_REPRESENTATION. */
const PART_REPRESENTATION_EXPRESS_ID = 540

/** Express id of the 'pmi validation property' decoy TSR. */
const DECOY_REPRESENTATION_EXPRESS_ID = 701

/** Express id of the fixture's product_definition_shape. */
const PART_SHAPE_EXPRESS_ID = 213

/** Wasm init makes the extraction beforeAll slower than jest's default. */
const EXTRACTION_TIMEOUT_MS = 120000

let model: ReturnType<AP214StepParser['parseDataToModel']>[1]
let scene: AP214SceneBuilder

beforeAll( async () => {

  const parser = AP214StepParser.Instance
  const buffer = new ParsingBuffer( fs.readFileSync( FIXTURE ) )

  expect( parser.parseHeader( buffer )[1] ).toBe( ParseResult.COMPLETE )

  const [ , parsed ] = parser.parseDataToModel( buffer )

  expect( parsed ).not.toBe( void 0 )
  model = parsed

  const conwayGeometry = new ConwayGeometry()

  expect( await conwayGeometry.initialize() ).toBe( true )

  const [ result, sceneBuilder ] =
    new AP214GeometryExtraction( conwayGeometry, model! ).extractAP214GeometryData()

  expect( result ).toBe( ExtractResult.COMPLETE )
  scene = sceneBuilder
}, EXTRACTION_TIMEOUT_MS )


/**
 * The fixture's single tessellated solid.
 *
 * @return {tessellated_solid} The solid.
 */
function theSolid(): tessellated_solid {

  const solids = [ ...model!.types( tessellated_solid ) ]

  expect( solids.length ).toBe( 1 )

  return solids[ 0 ]
}


/**
 * Cross product of two 3-vectors.
 *
 * @param a First vector.
 * @param b Second vector.
 * @return {number[]} a x b.
 */
function cross( a: number[], b: number[] ): number[] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ]
}


/**
 * Difference of two 3-vectors.
 *
 * @param a First vector.
 * @param b Second vector.
 * @return {number[]} a - b.
 */
function subtract( a: number[], b: number[] ): number[] {
  return [ a[0] - b[0], a[1] - b[1], a[2] - b[2] ]
}


/**
 * Dot product of two 3-vectors.
 *
 * @param a First vector.
 * @param b Second vector.
 * @return {number} a . b.
 */
function dot( a: number[], b: number[] ): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}


describe( 'AP242 tessellated shadow schema', () => {

  test( 'the shadow types are readable and carry ids past the generated enum', () => {

    // The whole mechanism rests on the hand-written classes reading records the
    // generated schema has no id for, so check both halves: the ids sit past
    // the generated enum, and the records they name actually deserialize.
    expect( tessellated_solid.expectedType )
        .toBe( EntityTypesAP214Tessellated.TESSELLATED_SOLID )
    expect( ap214TypeName( EntityTypesAP214Tessellated.TESSELLATED_SOLID ) )
        .toBe( 'TESSELLATED_SOLID' )
    expect( ap214TypeName( EntityTypesAP214Tessellated.COMPLEX_TRIANGULATED_FACE ) )
        .toBe( 'COMPLEX_TRIANGULATED_FACE' )

    const solid = theSolid()

    expect( solid.expressID ).toBe( SOLID_EXPRESS_ID )
    expect( solid.name ).toBe( 'Body' )
    expect( solid.items.length ).toBe( 2 )

    // The part TSR plus the 'pmi validation property' decoy.
    const representations = [ ...model!.types( tessellated_shape_representation ) ]

    expect( representations.map( ( found ) => found.expressID ).sort() )
        .toEqual( [ PART_REPRESENTATION_EXPRESS_ID, DECOY_REPRESENTATION_EXPRESS_ID ] )
  } )

  test( 'face attributes read from the right vtable slots', () => {

    const [ stripFace, fanFace ] = theSolid().items

    // `geometric_link` occupies slot 4, BETWEEN normals and pnindex. Reading
    // pnindex from slot 4 shifts every later attribute by one, so these three
    // assertions together are what pins the offset table: the strip face has a
    // PLANE reference there and the fan face has `$`.
    expect( stripFace.name ).toBe( 'strip face' )
    expect( stripFace.pnmax ).toBe( 4 )
    expect( stripFace.normals ).toEqual(
        [ [ 0, 0, 1 ], [ 0, 0, 1 ], [ 0, 0, 1 ], [ 0, 0, 1 ] ] )
    expect( stripFace.pnindex ).toEqual( [ 6, 2, 4, 7 ] )
    expect( stripFace.triangle_strips ).toEqual( [ [ 1, 2, 3, 4 ] ] )
    expect( stripFace.triangle_fans ).toEqual( [] )

    expect( fanFace.name ).toBe( 'fan face' )
    expect( fanFace.normals ).toEqual( [ [ 0, 0, 1 ] ] )
    expect( fanFace.pnindex ).toEqual( [ 3, 8, 5, 1 ] )
    expect( fanFace.triangle_strips ).toEqual( [] )
    expect( fanFace.triangle_fans ).toEqual( [ [ 1, 2, 3, 4 ] ] )

    // One coordinates list shared by both faces, as in the real file.
    const coordinates = stripFace.coordinates

    expect( coordinates ).toBeInstanceOf( coordinates_list )
    expect( fanFace.coordinates.localID ).toBe( coordinates.localID )
    expect( coordinates.npoints ).toBe( 8 )
    expect( coordinates.points.length ).toBe( 8 )
    expect( coordinates.points[ 5 ] ).toEqual( [ 0, 0, 0 ] )
  } )

  test( 'strips and fans reify through pnindex to the coordinate slots', () => {

    const [ stripFace, fanFace ] = theSolid().items

    // Both faces' pnindex is a permutation, not the identity: an
    // implementation that fed the strip values straight to the coordinates
    // list would produce (1,2,3,3,2,4) and (1,2,3,1,3,4) here instead.
    expect( AP214GeometryExtraction.triangulateComplexFace( stripFace ) )
        .toEqual( STRIP_FACE_TRIANGLES )
    expect( AP214GeometryExtraction.triangulateComplexFace( fanFace ) )
        .toEqual( FAN_FACE_TRIANGLES )
  } )

  test( 'strip winding alternates, so every triangle faces its declared normal', () => {

    // The load-bearing assertion. Strip triangle k is (a,b,c) for even k and
    // (b,a,c) for odd k; taking every triangle in strip order agrees with the
    // NIST -tg file's own declared normals on 960 of 1729 triangles, and
    // alternating agrees on 1729 of 1729. Here the strip face's SECOND
    // triangle is the one that inverts, so a non-alternating implementation
    // fails this with a negative dot product rather than a wrong count.
    const solid = theSolid()

    let checked = 0

    for ( const face of solid.items ) {

      const points = face.coordinates.points
      const normals = face.normals
      const triangles = AP214GeometryExtraction.triangulateComplexFace( face )

      expect( triangles.length ).toBeGreaterThan( 0 )

      for ( let where = 0; where < triangles.length; where += 3 ) {

        const first  = points[ triangles[ where ] - 1 ]
        const second = points[ triangles[ where + 1 ] - 1 ]
        const third  = points[ triangles[ where + 2 ] - 1 ]

        const computed =
          cross( subtract( second, first ), subtract( third, first ) )

        // A single-entry normals list is the whole face's normal; otherwise
        // there is one per pnindex position. Both fixture faces are planar, so
        // every declared normal is the face normal and each triangle is
        // checked against all of them — which also covers the single-normal
        // and per-vertex encodings with one loop.
        for ( const declared of normals ) {
          expect( dot( computed, declared ) ).toBeGreaterThan( 0 )
        }

        ++checked
      }
    }

    expect( checked ).toBe( 4 )
  } )
} )


describe( 'AP242 tessellated solid geometry', () => {

  test( 'the solid becomes exactly one mesh with the expected counts', () => {

    const solid = theSolid()
    const mesh = model!.geometry.getByLocalID( solid.localID )

    expect( mesh ).not.toBe( void 0 )

    // Eight coordinates, four triangles — one wasm ingestion for the whole
    // solid, not one per face.
    expect( mesh!.geometry.getVertexCount() ).toBe( 8 )
    expect( mesh!.geometry.getTriangleCount() ).toBe( 4 )

    expect( [ ...model!.geometry ].length ).toBe( 1 )
  } )

  test( 'the decoy representations render nothing', () => {

    // Decoy 1: #602 SHAPE_REPRESENTATION holds the SAME solid via a
    // 'shape for associated data' PROPERTY_DEFINITION. The mesh is memoized by
    // localID, so a missing gate shows up not as a second mesh but as a second
    // PLACEMENT of the one mesh — which is what this counts.
    const placements = [ ...scene.geometryOccurrences() ]

    expect( placements.length ).toBe( 1 )

    // Decoy 2: #701 TESSELLATED_SHAPE_REPRESENTATION holds a bare
    // COORDINATES_LIST ('saved view world coordinates'). Gating on the TSR
    // alone would put a stray 10mm tetrahedron in the scene.
    for ( const list of model!.types( coordinates_list ) ) {
      expect( model!.geometry.getByLocalID( list.localID ) ).toBe( void 0 )
    }

    // ...and nothing renders for the faces themselves either; the solid owns
    // the one mesh.
    for ( const face of model!.types( complex_triangulated_face ) ) {
      expect( model!.geometry.getByLocalID( face.localID ) ).toBe( void 0 )
    }
  } )

  test( 'the placed mesh is attributed to the part, not to the tessellated rep', () => {

    // The AP242 binding puts the TSR on the rep_1 side of a plain
    // SHAPE_REPRESENTATION_RELATIONSHIP, so it is the edge's TARGET and stays
    // a free root — without resolving its owner the pick would surface
    // TESSELLATED_SHAPE_REPRESENTATION #540 rather than the part.
    const [ [ owner ] ] = [ ...scene.geometryOccurrences() ]

    expect( owner ).toBeInstanceOf( product_definition_shape )
    expect( owner!.expressID ).toBe( PART_SHAPE_EXPRESS_ID )
  } )
} )
