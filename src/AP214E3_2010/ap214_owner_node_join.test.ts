import fs from 'fs'
import { describe, expect, test, beforeAll } from '@jest/globals'
import { AP214GeometryExtraction } from './ap214_geometry_extraction'
import { ParseResult } from '../step/parsing/step_parser'
import AP214StepParser from './ap214_step_parser'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ConwayGeometry } from '../../dependencies/conway-geom'
import { ExtractResult } from '../core/shared_constants'
import { AP214Properties } from '../compat/web-ifc/ap214_properties'
import { IfcApiProxyAP214 } from '../compat/web-ifc/ifc_api_proxy_ap214'
import { product_definition_shape } from './AP214E3_2010_gen/product_definition_shape.gen'


/**
 * The tree ⇄ scene join on (occurrence path, owner).
 *
 * A geometry instance carries two identities: its occurrence path and its
 * owner, the `product_definition_shape` the scene reports
 * (`AP214SceneGeometry.relatedElementLocalId`). A tree node carries its path and,
 * in `productDefinitionShapeExpressIDs`, the PDSs that describe it. Neither half
 * of the pair is a key by itself: several roots of one file all have the empty
 * path, and one part reused at many occurrences reports one PDS from all of
 * them. The pair is what a consumer (Share's portable export, and a pick
 * resolving to its NavTree node) joins on — bldrs-ai/Share#1901.
 *
 * Every assertion here runs the real geometry walk, so the owners are the ones
 * the scene actually stamps, not ones derived the same way the tree derives
 * its list.
 */


/**
 * `ap214-two-root-parts.step`: part "Shells" is `product_definition` #7 with
 * PDS #8, part "Plates" is #107 with PDS #108.
 */
const SHELLS_PD = 7
const SHELLS_PDS = 8
const PLATES_PD = 107
const PLATES_PDS = 108

/** PDS-owned geometry instances the walk emits for each fixture below. */
const AS1_OC_ROWS = 18
const NEMA_ROWS = 268
const INVERTED_SRR_ROWS = 3

/** One geometry instance as the scene reports it. */
interface SceneRow {
  owner: number
  path: string
}

/** What a fixture's tree and scene look like, for the join. */
interface Loaded {
  root: any
  rows: SceneRow[]
}

/**
 * Parse a fixture, run the full geometry walk, and build the compat tree.
 * Rows whose owner is not a PDS (a free representation, a relationship the
 * walk could not resolve to a part) are left out: they belong to no product
 * node, by construction, and say nothing about this join.
 *
 * @param path Fixture path.
 * @return {Promise<Loaded>} The compat tree root and the PDS-owned rows.
 */
async function load( path: string ): Promise<Loaded> {

  const parser = AP214StepParser.Instance
  const buffer = new ParsingBuffer( fs.readFileSync( path ) )

  expect( parser.parseHeader( buffer )[1] ).toBe( ParseResult.COMPLETE )

  const [ , model ] = parser.parseDataToModel( buffer )

  expect( model ).not.toBe( void 0 )

  const [ result, scene ] =
    new AP214GeometryExtraction( conwayGeometry, model! ).extractAP214GeometryData()

  expect( result ).toBe( ExtractResult.COMPLETE )

  const rows: SceneRow[] = []

  for ( const [ owner, occurrencePath ] of scene.geometryOccurrences() ) {
    if ( owner instanceof product_definition_shape && owner.expressID !== void 0 ) {
      rows.push( { owner: owner.expressID, path: occurrencePath.join( '/' ) } )
    }
  }

  const properties = new AP214Properties( { StepModel: model! } as unknown as IfcApiProxyAP214 )
  const root = await properties.getSpatialStructure()

  return { root, rows }
}

/**
 * Every tree node the pair (path, owner) names.
 *
 * @param root Compat tree root.
 * @param row The scene row.
 * @return {any[]} The matching nodes; exactly one when the join is exact.
 */
function nodesFor( root: any, row: SceneRow ): any[] {

  const found: any[] = []
  const walk = ( node: any ): void => {
    if ( node.occurrencePath.join( '/' ) === row.path &&
        node.productDefinitionShapeExpressIDs.includes( row.owner ) ) {
      found.push( node )
    }
    node.children.forEach( walk )
  }

  walk( root )

  return found
}

let conwayGeometry: ConwayGeometry

beforeAll( async () => {
  conwayGeometry = new ConwayGeometry()
  expect( await conwayGeometry.initialize() ).toBe( true )
} )


describe( 'AP214 tree ⇄ scene join on (occurrence path, owner PDS)', () => {

  test( 'two disconnected top-level parts: each root owns its own row, the wrapper none', async () => {

    const { root, rows } = await load( 'data/ap214-two-root-parts.step' )

    // The case the pair exists for: the synthetic wrapper and both roots all
    // carry the empty path, and so does every row.
    expect( root.type ).toBe( 'product_structure' )
    expect( root.occurrencePath ).toEqual( [] )
    expect( root.children.map( ( node: any ) => node.occurrencePath ) ).toEqual( [ [], [] ] )
    expect( rows.map( ( row ) => row.path ) ).toEqual( [ '', '' ] )

    const shells = root.children.find( ( node: any ) => node.Name.value === 'Shells' )
    const plates = root.children.find( ( node: any ) => node.Name.value === 'Plates' )

    expect( shells.expressID ).toBe( SHELLS_PD )
    expect( shells.productDefinitionShapeExpressIDs ).toEqual( [ SHELLS_PDS ] )
    expect( plates.expressID ).toBe( PLATES_PD )
    expect( plates.productDefinitionShapeExpressIDs ).toEqual( [ PLATES_PDS ] )
    expect( root.productDefinitionShapeExpressIDs ).toEqual( [] )

    const owners = rows.map( ( row ) => nodesFor( root, row ).map( ( node: any ) => node.expressID ) )

    // One row each, never both on one root and never on the wrapper.
    expect( owners ).toEqual( expect.arrayContaining( [ [ SHELLS_PD ], [ PLATES_PD ] ] ) )
    expect( owners.length ).toBe( 2 )
  } )

  test( 'a FEATURED_SHAPE owner joins like its PRODUCT_DEFINITION_SHAPE supertype', async () => {

    // The same file with Plates' #108 written as FEATURED_SHAPE, the one
    // AP214 subtype of product_definition_shape. The geometry walk takes any
    // SDR definition as the owner, so the scene reports #108 either way; the
    // tree's index has to enumerate the subtype too, because an AP214 class's
    // `query` names only its own entity id and `model.types()` reads exactly
    // that (conway#723 review).
    const { root, rows } = await load( 'data/ap214-two-root-parts-featured-shape.step' )

    expect( rows.map( ( row ) => row.owner ).sort( ( a, b ) => a - b ) )
        .toEqual( [ SHELLS_PDS, PLATES_PDS ] )

    const plates = root.children.find( ( node: any ) => node.Name.value === 'Plates' )

    expect( plates.productDefinitionShapeExpressIDs ).toEqual( [ PLATES_PDS ] )

    for ( const row of rows ) {
      expect( { row, matches: nodesFor( root, row ).length } ).toEqual( { row, matches: 1 } )
    }
  } )

  test( 'three roots reached by different arms each get their own row', async () => {

    // A second multi-root file, written for another purpose (conway#564), so
    // the join is not tuned to one hand-built fixture.
    const { root, rows } = await load( 'data/ap214-reachability-arms.step' )

    expect( root.children.length ).toBe( 3 )
    expect( rows.length ).toBe( 3 )

    const matched = rows.map( ( row ) => {
      const nodes = nodesFor( root, row )
      expect( nodes.length ).toBe( 1 )
      return nodes[0].expressID
    } )

    expect( new Set( matched ).size ).toBe( 3 )
  } )

  test.each( [
    // CDSR-placed parts: owners are the occurrences' PDSs, a nut reused six
    // times reports the same PDS from each of its six paths.
    [ 'data/as1-oc-214.stp', AS1_OC_ROWS ],
    // SolidWorks multibody under an occurrence: the bodies report the part's
    // own PDS (conway#597) with a body segment on the path; the screws report
    // their part's PDS from four occurrences.
    [ 'data/nema-23-76mm.step', NEMA_ROWS ],
    [ 'data/ap214-inverted-srr-multibody.step', INVERTED_SRR_ROWS ],
  ] )( '%s: every PDS-owned row resolves to exactly one node', async ( path, expectedRows ) => {

    const { root, rows } = await load( path )

    // A count, not just "every row we found": a walk that stamped no owners
    // would pass the loop below vacuously.
    expect( rows.length ).toBe( expectedRows )

    for ( const row of rows ) {
      expect( { row, matches: nodesFor( root, row ).length } ).toEqual( { row, matches: 1 } )
    }
  } )
} )
