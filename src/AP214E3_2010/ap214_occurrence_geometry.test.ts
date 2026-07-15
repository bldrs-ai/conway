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
let conwayGeometry: ConwayGeometry

beforeAll( async () => {

  const parser = AP214StepParser.Instance
  const buffer = new ParsingBuffer( fs.readFileSync( FIXTURE ) )

  expect( parser.parseHeader( buffer )[1] ).toBe( ParseResult.COMPLETE )

  const [ , parsed ] = parser.parseDataToModel( buffer )

  expect( parsed ).not.toBe( void 0 )
  model = parsed

  conwayGeometry = new ConwayGeometry()

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

  test( 'the rod\'s lateral b-spline surface tessellates (issue #350)', () => {

    // The rod (occurrence rod-assembly_1 #1137 -> rod_1 #1131) is the one AS1
    // part whose entire lateral surface is rational b-spline geometry (two
    // weighted Bezier half-cylinders); its planar end caps tessellate
    // regardless. When rational surface tessellation regresses, the rod
    // degenerates to two thin discs — present in the scene walk and the
    // NavTree, but invisible in the render (issue #350). Comparing the mesh's
    // measured area against the analytic closed-cylinder area (from its own
    // bounding box, so it is unit-agnostic) catches exactly that: caps-only
    // is ~2.4% of the expected area, a real cylinder is ~100%.
    const rodAssemblyNauo = 1137
    const rodNauo = 1131

    let rodGeometry: any

    for ( const [ , , mesh, , , occ ] of scene.walkWithOccurrence() ) {
      if ( occ.length === 2 && occ[ 0 ] === rodAssemblyNauo && occ[ 1 ] === rodNauo ) {
        rodGeometry = ( mesh as any ).geometry
        break
      }
    }

    expect( rodGeometry ).toBeDefined()

    const wasm = ( conwayGeometry as any ).wasmModule

    // Reified layout: 6 floats per vertex (position xyz + normal xyz),
    // uint32 indices, 3 per triangle.
    const vertexFloatCount = rodGeometry.GetVertexDataSize()
    const indexCount = rodGeometry.GetIndexDataSize()
    /* eslint-disable no-magic-numbers */
    const vertexData = wasm.HEAPF32.subarray(
        rodGeometry.GetVertexData() / 4,
        rodGeometry.GetVertexData() / 4 + vertexFloatCount )
    const indexData = wasm.HEAPU32.subarray(
        rodGeometry.GetIndexData() / 4,
        rodGeometry.GetIndexData() / 4 + indexCount )

    const mins = [ Infinity, Infinity, Infinity ]
    const maxs = [ -Infinity, -Infinity, -Infinity ]

    for ( let where = 0; where < vertexFloatCount; where += 6 ) {
      for ( let axis = 0; axis < 3; ++axis ) {
        mins[ axis ] = Math.min( mins[ axis ], vertexData[ where + axis ] )
        maxs[ axis ] = Math.max( maxs[ axis ], vertexData[ where + axis ] )
      }
    }

    const extents = [ 0, 1, 2 ].map( ( axis ) => maxs[ axis ] - mins[ axis ] ).sort( ( a, b ) => a - b )
    // Cylinder aligned to one axis: two equal cross extents (diameter) and
    // the length along the third.
    const radius = extents[ 0 ] / 2
    const length = extents[ 2 ]
    const expectedArea = 2 * Math.PI * radius * ( length + radius )

    let area = 0

    for ( let where = 0; where < indexCount; where += 3 ) {
      const a = indexData[ where ] * 6
      const b = indexData[ where + 1 ] * 6
      const c = indexData[ where + 2 ] * 6
      const ux = vertexData[ b ] - vertexData[ a ]
      const uy = vertexData[ b + 1 ] - vertexData[ a + 1 ]
      const uz = vertexData[ b + 2 ] - vertexData[ a + 2 ]
      const vx = vertexData[ c ] - vertexData[ a ]
      const vy = vertexData[ c + 1 ] - vertexData[ a + 1 ]
      const vz = vertexData[ c + 2 ] - vertexData[ a + 2 ]
      const cx = uy * vz - uz * vy
      const cy = uz * vx - ux * vz
      const cz = ux * vy - uy * vx

      area += 0.5 * Math.sqrt( ( cx * cx ) + ( cy * cy ) + ( cz * cz ) )
    }

    // Caps-only (the regression) measures ~0.024x; a correctly tessellated
    // cylinder converges on 1x from below. 0.5 leaves generous headroom for
    // coarser tessellation settings without ever passing a rod with no side.
    expect( area ).toBeGreaterThan( expectedArea * 0.5 )

    // ...and a sane upper bound: dropped rational weights bulged the profile
    // ~37% over the analytic area, so also require we are close from either
    // side.
    expect( area ).toBeLessThan( expectedArea * 1.1 )
    /* eslint-enable no-magic-numbers */
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
