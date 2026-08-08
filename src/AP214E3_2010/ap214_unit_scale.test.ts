import fs from 'fs'
import { describe, expect, test, beforeAll } from '@jest/globals'
import { AP214GeometryExtraction } from './ap214_geometry_extraction'
import { AP214SceneBuilder } from './ap214_scene_builder'
import { ParseResult } from '../step/parsing/step_parser'
import AP214StepParser from './ap214_step_parser'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ConwayGeometry } from '../../dependencies/conway-geom'
import { ExtractResult } from '../core/shared_constants'

/* eslint-disable no-magic-numbers -- fixture dimensions, reified vertex
   layout (6 floats) and 4x4 matrix element indices are all clearer as
   literals here than as named constants. */

/**
 * A millimetre-declared STEP part (`SI_UNIT(.MILLI.,.METRE.)`): a tube
 * 50 x 50 x 100 mm. Any mm fixture would do — what matters is that the
 * declared unit is not the world unit, so the root unit-scale transform
 * has to do real work and its direction is observable.
 */
const FIXTURE = 'data/create-a-tube.step'

/** Metres per millimetre — the factor a `.MILLI.` file must scale by. */
const MM_IN_M = 0.001

/** The fixture's size in its own (millimetre) file coordinates. */
const EXPECTED_FILE_SIZE_MM = [ 50, 50, 100 ]

/** Fractional slack, covering tessellation chord error on the tube's curves. */
const TOLERANCE = 0.02

let scene: AP214SceneBuilder
let conwayGeometry: ConwayGeometry

beforeAll( async () => {

  const parser = AP214StepParser.Instance
  const buffer = new ParsingBuffer( fs.readFileSync( FIXTURE ) )

  expect( parser.parseHeader( buffer )[ 1 ] ).toBe( ParseResult.COMPLETE )

  const [ , parsed ] = parser.parseDataToModel( buffer )

  expect( parsed ).not.toBe( void 0 )

  conwayGeometry = new ConwayGeometry()

  expect( await conwayGeometry.initialize() ).toBe( true )

  const [ result, sceneBuilder ] =
    new AP214GeometryExtraction( conwayGeometry, parsed! ).extractAP214GeometryData()

  expect( result ).toBe( ExtractResult.COMPLETE )
  scene = sceneBuilder
} )


/**
 * Axis-aligned bounds of the whole scene, with each mesh's absolute
 * transform applied — i.e. the model as the renderer sees it, which is
 * where the root unit scale actually lands (vertices stay in file
 * coordinates).
 *
 * @param applyTransform When false, bounds are taken from the raw
 * vertices instead, giving the model's size in its own file units.
 * @return The size along x, y and z.
 */
function sceneSize( applyTransform: boolean ): number[] {

  const mins = [ Infinity, Infinity, Infinity ]
  const maxs = [ -Infinity, -Infinity, -Infinity ]

  const wasm = ( conwayGeometry as unknown as { wasmModule: { HEAPF32: Float32Array } } ).wasmModule

  for ( const [ transform, , mesh ] of scene.walk() ) {

    const geometry = ( mesh as unknown as { geometry: {
      GetVertexData(): number, GetVertexDataSize(): number } } ).geometry

    const vertexFloatCount = geometry.GetVertexDataSize()

    // Reified layout: 6 floats per vertex, position xyz then normal xyz.
    const vertexData = wasm.HEAPF32.subarray(
        geometry.GetVertexData() / 4,
        ( geometry.GetVertexData() / 4 ) + vertexFloatCount )

    for ( let where = 0; where < vertexFloatCount; where += 6 ) {

      const x = vertexData[ where ]
      const y = vertexData[ where + 1 ]
      const z = vertexData[ where + 2 ]

      const point = ( applyTransform && transform !== void 0 ) ? [
        ( transform[ 0 ] * x ) + ( transform[ 4 ] * y ) + ( transform[ 8 ] * z ) + transform[ 12 ],
        ( transform[ 1 ] * x ) + ( transform[ 5 ] * y ) + ( transform[ 9 ] * z ) + transform[ 13 ],
        ( transform[ 2 ] * x ) + ( transform[ 6 ] * y ) + ( transform[ 10 ] * z ) + transform[ 14 ],
      ] : [ x, y, z ]

      for ( let axis = 0; axis < 3; ++axis ) {

        mins[ axis ] = Math.min( mins[ axis ], point[ axis ] )
        maxs[ axis ] = Math.max( maxs[ axis ], point[ axis ] )
      }
    }
  }

  return maxs.map( ( max, axis ) => max - mins[ axis ] )
}


describe( 'AP214 root unit scale', () => {

  test( 'a millimetre model lands in world space in metres (issue #458)', () => {

    const size = sceneSize( true )

    EXPECTED_FILE_SIZE_MM.forEach( ( millimetres, axis ) => {

      const expectedMetres = millimetres * MM_IN_M

      expect( size[ axis ] ).toBeGreaterThan( expectedMetres * ( 1 - TOLERANCE ) )
      expect( size[ axis ] ).toBeLessThan( expectedMetres * ( 1 + TOLERANCE ) )
    } )
  } )

  test( 'the scale is metres-per-file-unit, not its reciprocal (issue #458)', () => {

    // The bug this pins was a sign-of-exponent error, not a missing
    // conversion: the root transform scaled by 1/unitInM, so a millimetre
    // model came out 1000x too LARGE rather than 1000x too small. Asserting
    // the ratio between world and file coordinates catches that direction
    // even if the fixture is swapped for a differently sized part, which an
    // absolute size assertion alone would not.
    const fileSize = sceneSize( false )
    const worldSize = sceneSize( true )

    worldSize.forEach( ( world, axis ) => {

      expect( world / fileSize[ axis ] ).toBeCloseTo( MM_IN_M )
    } )
  } )
} )
