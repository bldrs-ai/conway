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

/**
 * The same part given a separate root representation, linked to it by a
 * `SHAPE_REPRESENTATION_RELATIONSHIP` complex — NOT a NAUO/CDSR assembly,
 * which is what "assembly" usually means in AP214. The relationship arm is
 * not what matters here: the root's thunk comes from the shape-definition
 * loop either way, so this covers the root-resolution line just as a NAUO
 * would, with far less fixture.
 *
 * Its unit scale is therefore applied through the ASSEMBLY-ROOT path instead
 * of the inline single-representation path {@link FIXTURE} takes. Geometry, units and
 * dimensions are `create-a-tube.step` verbatim; only the representation
 * structure differs, which is what makes the two expectations identical.
 *
 * The distinction is not academic. `create-a-tube.step` is dispatched by
 * the shape-definition loop, which computes its scale inline and never
 * reaches the `pendingRoots` loop that resolves assembly roots — so before
 * this fixture existed, no test in the repo exercised the root-resolution
 * line at all, and a change there was invisible to the suite (conway#606
 * review, codex round 1).
 */
const ASSEMBLY_FIXTURE = 'data/ap214-assembly-root-unit-scale.step'

let scene: AP214SceneBuilder
let assemblyScene: AP214SceneBuilder
let conwayGeometry: ConwayGeometry


/**
 * Parse and extract a fixture into a scene.
 *
 * @param fixturePath The STEP file to load.
 * @return {AP214SceneBuilder} The extracted scene.
 */
function buildScene( fixturePath: string ): AP214SceneBuilder {

  const parser = AP214StepParser.Instance
  const buffer = new ParsingBuffer( fs.readFileSync( fixturePath ) )

  expect( parser.parseHeader( buffer )[ 1 ] ).toBe( ParseResult.COMPLETE )

  const [ , parsed ] = parser.parseDataToModel( buffer )

  expect( parsed ).not.toBe( void 0 )

  const [ result, sceneBuilder ] =
    new AP214GeometryExtraction( conwayGeometry, parsed! ).extractAP214GeometryData()

  expect( result ).toBe( ExtractResult.COMPLETE )

  return sceneBuilder
}

beforeAll( async () => {

  conwayGeometry = new ConwayGeometry()

  expect( await conwayGeometry.initialize() ).toBe( true )

  scene = buildScene( FIXTURE )
  assemblyScene = buildScene( ASSEMBLY_FIXTURE )
} )


/**
 * Axis-aligned bounds of the whole scene, with each mesh's absolute
 * transform applied — i.e. the model as the renderer sees it, which is
 * where the root unit scale actually lands (vertices stay in file
 * coordinates).
 *
 * @param forScene The scene to measure.
 * @return The size along x, y and z.
 */
function worldSize( forScene: AP214SceneBuilder ): number[] {

  const mins = [ Infinity, Infinity, Infinity ]
  const maxs = [ -Infinity, -Infinity, -Infinity ]

  const wasm = ( conwayGeometry as unknown as { wasmModule: { HEAPF32: Float32Array } } ).wasmModule

  for ( const [ transform, , mesh ] of forScene.walk() ) {

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

      const point = transform !== void 0 ? [
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

    const size = worldSize( scene )

    EXPECTED_FILE_SIZE_MM.forEach( ( millimetres, axis ) => {

      const expectedMetres = millimetres * MM_IN_M

      expect( size[ axis ] ).toBeGreaterThan( expectedMetres * ( 1 - TOLERANCE ) )
      expect( size[ axis ] ).toBeLessThan( expectedMetres * ( 1 + TOLERANCE ) )
    } )
  } )

  test( 'an assembly ROOT keeps its unit scale (conway#606 review)', () => {

    // The assembly-root path, which no other test reaches. #606's guard
    // makes a typed lookup refuse a record that is not of the requested
    // type, and the root resolution used to re-derive its representation
    // through exactly such a lookup — for the SUBTYPE `shape_representation`
    // — behind a `!`, with the throw absorbed by a catch written for
    // malformed unit contexts. A root that lost its scale that way is not
    // subtly wrong: it is emitted in FILE units.
    //
    // That is what this measures, and the failure it discriminates is
    // enormous rather than marginal. Forcing the root's scale to
    // `undefined` on this fixture takes the world size from
    // [0.05, 0.0499, 0.1] to [50, 49.88, 100] — the 1000x error, verified
    // by doing it rather than assumed.
    const size = worldSize( assemblyScene )

    EXPECTED_FILE_SIZE_MM.forEach( ( millimetres, axis ) => {

      const expectedMetres = millimetres * MM_IN_M

      expect( size[ axis ] ).toBeGreaterThan( expectedMetres * ( 1 - TOLERANCE ) )
      expect( size[ axis ] ).toBeLessThan( expectedMetres * ( 1 + TOLERANCE ) )
    } )

    // Same part, same numbers, different representation structure: if these
    // two ever disagree, the difference is the root path and nothing else.
    expect( size ).toEqual( worldSize( scene ) )
  } )

  test( 'the scale is metres-per-file-unit, not its reciprocal (issue #458)', () => {

    // The bug this pins was a sign-of-exponent error, not a missing
    // conversion: the root transform scaled by 1/unitInM, so a millimetre
    // model came out 1000x too LARGE rather than 1000x too small. Reading
    // the scale straight off the absolute transform's basis keeps that
    // direction pinned independently of how big the fixture happens to be.
    //
    // Measured per mesh from the basis rather than from a bounds ratio,
    // because instance placements move parts around: a whole-scene bounds
    // ratio starts failing on correct code the moment the fixture gains a
    // second occurrence. Placements are rigid, so the column norm carries
    // the unit scale alone.
    //
    // This expects ONE scale across the scene, which holds because the
    // fixture is single-unit. A mixed-unit assembly is a different case —
    // there `doTransforms` reconciles each child into its parent's unit,
    // so a metre-declared sub-part legitimately ends up at basis norm 1.0
    // — and swapping FIXTURE for one would need the expectation taken per
    // representation's own declared unit rather than as a constant.
    let meshCount = 0

    for ( const [ transform ] of scene.walk() ) {

      expect( transform ).toBeDefined()

      const basisColumnLength =
        Math.hypot( transform![ 0 ], transform![ 1 ], transform![ 2 ] )

      expect( basisColumnLength ).toBeCloseTo( MM_IN_M, 6 )
      ++meshCount
    }

    // A scene that walked nothing would pass the loop vacuously.
    expect( meshCount ).toBeGreaterThan( 0 )
  } )
} )
