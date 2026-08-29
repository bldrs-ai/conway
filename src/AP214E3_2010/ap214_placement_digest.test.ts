import fs from 'fs'
import { describe, expect, test, beforeAll } from '@jest/globals'
import { AP214GeometryExtraction } from './ap214_geometry_extraction'
import { AP214SceneBuilder } from './ap214_scene_builder'
import { ParseResult } from '../step/parsing/step_parser'
import AP214StepParser from './ap214_step_parser'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ConwayGeometry } from '../../dependencies/conway-geom'
import { ExtractResult } from '../core/shared_constants'
import { CanonicalMeshType } from '../core/canonical_mesh'
import {
  canonicalPlacementValue,
  placementDigests,
  placementRecord,
} from './ap214_placement_digest'


/**
 * conway#583: the AP214 regression digest was `ID,Hash,Type,Operand 1,
 * Operand2,Void` — per geometry DEFINITION, with no placement in it — so it
 * could not see geometry that tessellated identically and then landed
 * somewhere else. `Placement` is the column that closes that, and these
 * tests pin the two properties it has to have:
 *
 * - **Sensitivity.** It moves when geometry moves, and when the assembly
 *   occurrence that placed it changes.
 * - **Determinism.** It does NOT move with walk order, demand granularity
 *   or repetition. AP214 demand extraction cuts a model into units whose
 *   count and boundaries change with `demandItemsPerUnit`; a column that
 *   moved when the scheduler moved would be worse than no column.
 */

/** Assembly with a 13-NAUO occurrence tree and real BREP leaves. */
const ASSEMBLY_FIXTURE = 'data/as1-oc-214.stp'

/** Ten solids in one representation's `items` — cut by the default granularity. */
const MULTI_ITEM_FIXTURE = 'data/nema-23-76mm.step'

/** Three solids under a NON-IDENTITY leading placement (conway#582). */
const LEADING_PLACEMENT_FIXTURE = 'data/ap214-sliced-item-ranges.step'

/** A MAPPED_ITEM that pushes its transform and then throws, then five solids. */
const MAPPED_ITEM_FAILURE_FIXTURE = 'data/ap214-mapped-item-failure.step'

/* Wasm init, and the per-test budgets: these extractions run real BREPs. */
const WASM_INIT_TIMEOUT_MS = 60_000
const EXTRACT_TIMEOUT_MS = 120_000
const MULTI_EXTRACT_TIMEOUT_MS = 300_000

/** Column-major 4x4 identity. */
const IDENTITY: readonly number[] =
  [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]

/** The displacement the mapped-item fixture's leaked transform applies. */
const LEAK_TRANSLATION_MM = 500

/** Identity translated by {@link LEAK_TRANSLATION_MM} in x. */
const TRANSLATED: readonly number[] =
  [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, LEAK_TRANSLATION_MM, 0, 0, 1]

let conwayGeometry: ConwayGeometry

beforeAll( async () => {

  conwayGeometry = new ConwayGeometry()

  expect( await conwayGeometry.initialize() ).toBe( true )
}, WASM_INIT_TIMEOUT_MS )


/** One row of {@link AP214SceneBuilder.walkWithOccurrence}, reduced. */
type StubRow = [
  readonly number[] | undefined,
  undefined,
  { type: CanonicalMeshType, localID: number },
  undefined,
  undefined,
  readonly number[],
]


/**
 * A scene stand-in that yields exactly the placed instances given.
 *
 * `placementDigests` reads nothing but `walkWithOccurrence()`, so the
 * order-invariance and sensitivity properties can be pinned without a wasm
 * extraction — and, more usefully, with placements chosen to differ in one
 * respect at a time, which no real fixture offers.
 *
 * @param rows The placed instances to yield, in the order given.
 * @return {AP214SceneBuilder} The stand-in.
 */
function stubScene( rows: readonly StubRow[] ): AP214SceneBuilder {

  return {
    * walkWithOccurrence() {
      yield* rows
    },
  } as unknown as AP214SceneBuilder
}


/**
 * One placed instance of mesh 1, as a stub walk row.
 *
 * @param transform Absolute transform, or undefined for a root-parented node.
 * @param occurrencePath NAUO express ids, root->this placement.
 * @return {StubRow} The row.
 */
function placed(
    transform: readonly number[] | undefined,
    occurrencePath: readonly number[] = [] ): StubRow {

  return [
    transform,
    void 0,
    { type: CanonicalMeshType.BUFFER_GEOMETRY, localID: 1 },
    void 0,
    void 0,
    occurrencePath,
  ]
}


/**
 * Extract a fixture at one granularity and take the placement digest of
 * every mesh definition in it.
 *
 * The model is re-parsed per call because extraction memoizes geometry into
 * it — two granularities have to start from equally cold models.
 *
 * @param fixture Path to the STEP file.
 * @param itemsPerUnit Value for `demandItemsPerUnit`.
 * @return {[Map<number, string>, number]} The digests and the unit count.
 */
function digestAt(
    fixture: string, itemsPerUnit: number ): [Map<number, string>, number] {

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

  return [ placementDigests( scene ), unitCount ]
}


describe( 'AP214 placement digest value (conway#583)', () => {

  test( 'a moved instance changes the digest', () => {

    expect( placementDigests( stubScene( [ placed( TRANSLATED ) ] ) ).get( 1 ) )
        .not.toBe( placementDigests( stubScene( [ placed( IDENTITY ) ] ) ).get( 1 ) )
  } )

  test( 'a different occurrence path changes the digest', () => {

    expect(
        placementDigests( stubScene( [ placed( IDENTITY, [ 7, 9 ] ) ] ) ).get( 1 ) )
        .not.toBe(
            placementDigests( stubScene( [ placed( IDENTITY, [ 9, 7 ] ) ] ) ).get( 1 ) )
  } )

  test( 'a dropped duplicate instance changes the digest', () => {

    const twice = placementDigests(
        stubScene( [ placed( IDENTITY ), placed( IDENTITY ) ] ) ).get( 1 )

    expect( twice ).not.toBe(
        placementDigests( stubScene( [ placed( IDENTITY ) ] ) ).get( 1 ) )
  } )

  test( 'walk order does not change the digest', () => {

    const forwards = placementDigests( stubScene( [
      placed( IDENTITY, [ 1 ] ),
      placed( TRANSLATED, [ 2 ] ),
      placed( TRANSLATED, [ 3 ] ),
    ] ) ).get( 1 )

    const backwards = placementDigests( stubScene( [
      placed( TRANSLATED, [ 3 ] ),
      placed( TRANSLATED, [ 2 ] ),
      placed( IDENTITY, [ 1 ] ),
    ] ) ).get( 1 )

    // Not vacuous: the three instances are genuinely distinct records, so a
    // digest built in walk order would differ between these two.
    expect( forwards ).toBe( backwards )
    expect( forwards ).not.toBe(
        placementDigests( stubScene( [ placed( IDENTITY, [ 1 ] ) ] ) ).get( 1 ) )
  } )

  test( 'a root-parented instance reads as identity, not as absent', () => {

    expect( placementDigests( stubScene( [ placed( void 0 ) ] ) ).get( 1 ) )
        .toBe( placementDigests( stubScene( [ placed( IDENTITY ) ] ) ).get( 1 ) )
  } )

  test( 'a never-placed definition has no entry', () => {

    expect( placementDigests( stubScene( [] ) ).size ).toBe( 0 )
  } )

  test( 'negative zero and zero are the same placement', () => {

    expect( canonicalPlacementValue( -0 ) ).toBe( canonicalPlacementValue( 0 ) )
    expect( placementRecord( [ -0 ], [] ) ).toBe( placementRecord( [ 0 ], [] ) )
  } )

  test( 'a non-finite matrix element survives into the record', () => {

    expect( placementRecord( [ NaN ], [] ) ).toContain( 'NaN' )
    expect( placementRecord( [ NaN ], [] ) ).not.toBe( placementRecord( [ 0 ], [] ) )
  } )
} )


describe( 'AP214 placement digest determinism (conway#583)', () => {

  test( 'an assembly digests identically sliced and unsliced', () => {

    const [ unsliced, unslicedUnits ] = digestAt( ASSEMBLY_FIXTURE, Infinity )
    const [ sliced, slicedUnits ] = digestAt( ASSEMBLY_FIXTURE, 1 )

    // Without this the equality below would hold trivially.
    expect( slicedUnits ).toBeGreaterThan( unslicedUnits )
    expect( unsliced.size ).toBeGreaterThan( 0 )

    expect( sliced ).toStrictEqual( unsliced )
  }, EXTRACT_TIMEOUT_MS )

  test( 'a ten-solid representation digests identically at every granularity', () => {

    const [ unsliced, unslicedUnits ] = digestAt( MULTI_ITEM_FIXTURE, Infinity )
    const [ atDefault, defaultUnits ] = digestAt( MULTI_ITEM_FIXTURE, 4 )
    const [ perItem, perItemUnits ] = digestAt( MULTI_ITEM_FIXTURE, 1 )

    expect( defaultUnits ).toBeGreaterThan( unslicedUnits )
    expect( perItemUnits ).toBeGreaterThan( defaultUnits )
    expect( unsliced.size ).toBeGreaterThan( 0 )

    expect( atDefault ).toStrictEqual( unsliced )
    expect( perItem ).toStrictEqual( unsliced )
  }, MULTI_EXTRACT_TIMEOUT_MS )

  test( 'a leading placement is in the digest, and survives slicing', () => {

    const [ unsliced, unslicedUnits ] = digestAt( LEADING_PLACEMENT_FIXTURE, Infinity )
    const [ sliced, slicedUnits ] = digestAt( LEADING_PLACEMENT_FIXTURE, 1 )

    expect( slicedUnits ).toBeGreaterThan( unslicedUnits )

    // Three distinct solids, each placed once, all under the same leading
    // AXIS2_PLACEMENT_3D — so three entries carrying one common placement.
    expect( unsliced.size ).toBe( 3 )

    // And that placement is NOT the identity, or dropping the leading
    // transform would change nothing here and the equality below would be
    // insensitive to exactly the bug it is meant to catch.
    const identityOnce =
      placementDigests( stubScene( [ placed( IDENTITY ) ] ) ).get( 1 )

    for ( const digest of unsliced.values() ) {
      expect( digest ).not.toBe( identityOnce )
    }

    expect( sliced ).toStrictEqual( unsliced )
  }, EXTRACT_TIMEOUT_MS )

  test( 'a mapped item that throws after pushing leaves the digest alone', () => {

    const [ unsliced, unslicedUnits ] = digestAt( MAPPED_ITEM_FAILURE_FIXTURE, Infinity )
    const [ atDefault, defaultUnits ] = digestAt( MAPPED_ITEM_FAILURE_FIXTURE, 4 )
    const [ perItem, perItemUnits ] = digestAt( MAPPED_ITEM_FAILURE_FIXTURE, 1 )

    expect( defaultUnits ).toBeGreaterThan( unslicedUnits )
    expect( perItemUnits ).toBeGreaterThan( defaultUnits )
    expect( unsliced.size ).toBeGreaterThan( 0 )

    // This is the case the whole column exists for: the five solids behind
    // the failing mapped item have byte-identical OBJ hashes at every
    // granularity, so the six pre-existing columns are identical here
    // whether or not the transform leaks. Only this map can tell.
    expect( atDefault ).toStrictEqual( unsliced )
    expect( perItem ).toStrictEqual( unsliced )
  }, EXTRACT_TIMEOUT_MS )

  test( 'two runs of the same model at the same granularity agree', () => {

    const [ first ] = digestAt( MAPPED_ITEM_FAILURE_FIXTURE, 4 )
    const [ second ] = digestAt( MAPPED_ITEM_FAILURE_FIXTURE, 4 )

    expect( second ).toStrictEqual( first )
  }, EXTRACT_TIMEOUT_MS )
} )
