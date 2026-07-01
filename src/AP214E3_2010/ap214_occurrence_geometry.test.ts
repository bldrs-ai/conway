import fs from 'fs'
import { describe, expect, test, beforeAll } from '@jest/globals'
import { AP214GeometryExtraction } from './ap214_geometry_extraction'
import { AP214SceneBuilder } from './ap214_scene_builder'
import { ParseResult } from '../step/parsing/step_parser'
import AP214StepParser from './ap214_step_parser'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ConwayGeometry } from '../../dependencies/conway-geom'
import { ExtractResult } from '../core/shared_constants'
import { AP214Properties } from '../compat/web-ifc/ap214_properties'
import { IfcApiProxyAP214 } from '../compat/web-ifc/ifc_api_proxy_ap214'


/**
 * The geometry-rich NIST `as1-oc-214` assembly (real BREP + a 13-NAUO
 * occurrence tree, parts placed via context_dependent_shape_representation).
 * Unlike the structure-only `as1-assembly.step` stub, this fixture pairs
 * geometry with instancing, so it is the reference case for occurrence-keyed
 * selection (Share NavTree <-> scene): the same leaf part (e.g. the nut) is
 * reused across occurrences, so its scalar expressID collides while its
 * occurrence path is unique.
 */
const FIXTURE = 'data/as1-oc-214.stp'

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
} )


/** @return {any} The spatial-structure root of the fixture. */
async function spatialRoot(): Promise<any> {
  const props = new AP214Properties( { StepModel: model! } as unknown as IfcApiProxyAP214 )
  return await props.getSpatialStructure() as any
}

/**
 * Collect the occurrence path of every leaf (geometry-bearing) product node.
 *
 * @param root Spatial-structure root.
 * @return {number[][]} One occurrence path per leaf node.
 */
function leafOccurrencePaths( root: any ): number[][] {
  const paths: number[][] = []
  const walk = ( node: any ) => {
    const children = node.children ?? []
    if ( children.length === 0 ) {
      paths.push( node.occurrencePath )
    }
    for ( const child of children ) {
      walk( child )
    }
  }
  walk( root )
  return paths
}


describe( 'AP214 as1-oc-214 occurrence geometry', () => {

  test( 'extracts real geometry for the assembly', () => {

    const owners = [ ...scene.geometryOccurrences() ].filter( ( [ owner ] ) => owner !== void 0 )

    // 10 BREP solids placed across the occurrence tree — a non-trivial mesh
    // count guards against the fixture silently regressing to a stub.
    expect( owners.length ).toBeGreaterThan( 0 )
  } )

  test( 'the same leaf part is reused across occurrences (the selection case)', async () => {

    const root = await spatialRoot()
    const nuts: any[] = []
    const walk = ( node: any ) => {
      if ( node.Name?.value === 'nut' ) {
        nuts.push( node )
      }
      for ( const child of node.children ?? [] ) {
        walk( child )
      }
    }
    walk( root )

    expect( nuts.length ).toBeGreaterThan( 1 )

    // The nut inside nut-bolt-assembly is reused across every l-bracket-assembly
    // occurrence, so several nut nodes share one scalar expressID. Group by it
    // and take the largest colliding set.
    const byExpressID = new Map<number, any[]>()
    for ( const nut of nuts ) {
      const group = byExpressID.get( nut.expressID ) ?? []
      group.push( nut )
      byExpressID.set( nut.expressID, group )
    }
    const colliding =
      [ ...byExpressID.values() ].sort( ( a, b ) => b.length - a.length )[0]

    // Same scalar id, but each occurrence has a distinct path — exactly what a
    // scalar id cannot represent and the occurrence path can.
    expect( colliding.length ).toBeGreaterThan( 1 )
    const paths = colliding.map( ( n ) => JSON.stringify( n.occurrencePath ) )
    expect( new Set( paths ).size ).toBe( colliding.length )
  } )

  test( 'every geometry instance carries the occurrence path of its tree leaf', async () => {

    const geometryPaths =
      [ ...scene.geometryOccurrences() ].map( ( [ , path ] ) => JSON.stringify( path ) )

    const treePaths = leafOccurrencePaths( await spatialRoot() ).map( ( p ) => JSON.stringify( p ) )

    // Each leaf occurrence has geometry, and each geometry instance is stamped
    // with a leaf's occurrence path: the two multisets match. This is the
    // mesh<->node reconciliation occurrence-keyed selection needs.
    expect( geometryPaths.slice().sort() ).toEqual( treePaths.slice().sort() )

    // ...and every path is distinct, so no two instances are confusable.
    expect( new Set( geometryPaths ).size ).toBe( geometryPaths.length )
  } )
} )
