import fs from 'fs'
import { describe, expect, test, beforeAll } from '@jest/globals'
import { AP214GeometryExtraction } from './ap214_geometry_extraction'
import { AP214SceneBuilder } from './ap214_scene_builder'
import { ParseResult } from '../step/parsing/step_parser'
import AP214StepParser from './ap214_step_parser'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ConwayGeometry } from '../../dependencies/conway-geom'
import { ExtractResult } from '../core/shared_constants'


/**
 * conway#579: a demand unit used to be a whole product, so one item-heavy
 * representation (Arty_Z7's silkscreen: 654 solids in one
 * ADVANCED_BREP_SHAPE_REPRESENTATION, two levels under the only root) ran
 * as a single 22 s uninterruptible task. prepareDemandExtraction now
 * flattens depth first and cuts a representation's `items` into index
 * ranges, which is only sound if the cut walk visits the same items in the
 * same order with the same transform state — the claim these tests pin.
 *
 * `demandItemsPerUnit` is the granularity knob: `Infinity` reproduces the
 * pre-change flattening (one unit per immediate child of a root, plus one
 * for the root's own items), and small values cut both deeper and finer.
 * Every setting has to emit byte-identical placed geometry.
 */

/** Assembly with a 13-NAUO occurrence tree and real BREP leaves. */
const ASSEMBLY_FIXTURE = 'data/as1-oc-214.stp'

/**
 * Single-root assembly whose #14069 ADVANCED_BREP_SHAPE_REPRESENTATION
 * carries ten solids in one `items` array — the multi-item representation
 * the issue is about, at a size the default granularity actually cuts.
 */
const MULTI_ITEM_FIXTURE = 'data/nema-23-76mm.step'

/**
 * Derived from `create-a-tube.step`: one
 * ADVANCED_BREP_SHAPE_REPRESENTATION holding a NON-IDENTITY
 * AXIS2_PLACEMENT_3D followed by three copies of the tube solid. That
 * leading placement is the state the item loop carries — it pushes onto
 * the scene transform stack and places every item after it — so a range
 * that starts past it lands its solids at the wrong place unless the
 * range replays it. It is also the shape of the worst real case:
 * DSA2.step's single root is one placement followed by 28,674 solids.
 */
const LEADING_PLACEMENT_FIXTURE = 'data/ap214-sliced-item-ranges.step'

/* Wasm init, and the per-test budgets: these extractions run real BREPs. */
const WASM_INIT_TIMEOUT_MS = 60_000
const EXTRACT_TIMEOUT_MS = 120_000
const MULTI_EXTRACT_TIMEOUT_MS = 300_000

// Column-major 4x4: the translation column sits at 12, 13, 14.
const TRANSLATION_START = 12
const TRANSLATION_END = 15

let conwayGeometry: ConwayGeometry

beforeAll( async () => {

  conwayGeometry = new ConwayGeometry()

  expect( await conwayGeometry.initialize() ).toBe( true )
}, WASM_INIT_TIMEOUT_MS )


/** One placed geometry instance, reduced to something comparable. */
type PlacedDigest = {
  expressID: number | undefined
  occurrencePath: string
  transform: string
  vertices: string
  indices: string
}


/**
 * Extract the fixture at one granularity and reduce the resulting scene to
 * a comparable digest of every placed geometry instance, in walk order.
 *
 * The model is re-parsed per call because extraction memoizes geometry into
 * it — two granularities have to start from equally cold models or the
 * second one measures the first one's cache.
 *
 * @param fixture Path to the STEP file.
 * @param itemsPerUnit Value for `demandItemsPerUnit`.
 * @return {[PlacedDigest[], number]} The digest and the unit count.
 */
function extractAt( fixture: string, itemsPerUnit: number ): [PlacedDigest[], number] {

  const parser = AP214StepParser.Instance
  const buffer = new ParsingBuffer( fs.readFileSync( fixture ) )

  expect( parser.parseHeader( buffer )[1] ).toBe( ParseResult.COMPLETE )

  const [ , model ] = parser.parseDataToModel( buffer )

  expect( model ).not.toBe( void 0 )

  const extraction = new AP214GeometryExtraction( conwayGeometry, model! )

  extraction.demandItemsPerUnit = itemsPerUnit

  extraction.prepareDemandExtraction()

  const unitCount = extraction.demandUnitCount

  const [ result, scene ] = extraction.extractAP214GeometryData()

  expect( result ).toBe( ExtractResult.COMPLETE )

  return [ placedDigest( scene ), unitCount ]
}


/**
 * Reduce a scene to one row per placed geometry instance: what it is, where
 * the walk put it, and the contents of its vertex and index buffers.
 *
 * @param scene The extracted scene.
 * @return {PlacedDigest[]} One row per instance, in walk order.
 */
function placedDigest( scene: AP214SceneBuilder ): PlacedDigest[] {

  const wasm = ( conwayGeometry as unknown as {
    wasmModule: { HEAPF32: Float32Array, HEAPU32: Uint32Array }
  } ).wasmModule

  const rows: PlacedDigest[] = []

  for ( const [ transform, , mesh, , entity, occurrencePath ]
    of scene.walkWithOccurrence() ) {

    const geometry = ( mesh as unknown as {
      geometry?: {
        GetVertexData(): number, GetVertexDataSize(): number,
        GetIndexData(): number, GetIndexDataSize(): number
      }
    } ).geometry

    if ( geometry === void 0 || typeof geometry.GetVertexDataSize !== 'function' ) {
      continue
    }

    // Read into copies immediately — HEAPF32/HEAPU32 views detach on wasm
    // memory growth and a held view silently reads zeroes.
    const floatCount = geometry.GetVertexDataSize()
    const vertexData = wasm.HEAPF32.slice(
        geometry.GetVertexData() / 4,
        ( geometry.GetVertexData() / 4 ) + floatCount )

    const indexCount = geometry.GetIndexDataSize()
    const indexData = wasm.HEAPU32.slice(
        geometry.GetIndexData() / 4,
        ( geometry.GetIndexData() / 4 ) + indexCount )

    rows.push( {
      expressID: entity?.expressID,
      occurrencePath: occurrencePath.join( '/' ),
      transform: ( transform ?? [] ).join( ',' ),
      vertices: `${floatCount}:${vertexData.join( ',' )}`,
      indices: `${indexCount}:${indexData.join( ',' )}`,
    } )
  }

  return rows
}


describe( 'AP214 demand unit granularity (conway#579)', () => {

  test( 'an assembly extracts identically sliced and unsliced', () => {

    const [ unsliced, unslicedUnits ] = extractAt( ASSEMBLY_FIXTURE, Infinity )
    const [ sliced, slicedUnits ] = extractAt( ASSEMBLY_FIXTURE, 1 )

    // Without this the equality below would hold trivially.
    expect( slicedUnits ).toBeGreaterThan( unslicedUnits )
    expect( unsliced.length ).toBeGreaterThan( 0 )

    expect( sliced ).toStrictEqual( unsliced )
  }, EXTRACT_TIMEOUT_MS )

  test( 'a ten-solid representation extracts identically at every granularity', () => {

    const [ unsliced, unslicedUnits ] = extractAt( MULTI_ITEM_FIXTURE, Infinity )
    const [ atDefault, defaultUnits ] = extractAt( MULTI_ITEM_FIXTURE, 4 )
    const [ perItem, perItemUnits ] = extractAt( MULTI_ITEM_FIXTURE, 1 )

    expect( defaultUnits ).toBeGreaterThan( unslicedUnits )
    expect( perItemUnits ).toBeGreaterThan( defaultUnits )
    expect( unsliced.length ).toBeGreaterThan( 0 )

    expect( atDefault ).toStrictEqual( unsliced )
    expect( perItem ).toStrictEqual( unsliced )
  }, MULTI_EXTRACT_TIMEOUT_MS )

  test( 'ranges after a leading placement are still placed by it', () => {

    const [ unsliced, unslicedUnits ] = extractAt( LEADING_PLACEMENT_FIXTURE, Infinity )
    const [ sliced, slicedUnits ] = extractAt( LEADING_PLACEMENT_FIXTURE, 1 )

    expect( slicedUnits ).toBeGreaterThan( unslicedUnits )

    // Three solids, and the placement they inherit is not the identity —
    // both of which have to hold or the equality below proves nothing.
    expect( unsliced.length ).toBe( 3 )
    expect( unsliced[ 0 ].transform ).not.toBe( '' )
    expect( unsliced[ 0 ].transform.split( ',' ).slice( TRANSLATION_START, TRANSLATION_END ) )
        .not.toStrictEqual( [ '0', '0', '0' ] )

    expect( sliced ).toStrictEqual( unsliced )
  }, EXTRACT_TIMEOUT_MS )
} )
