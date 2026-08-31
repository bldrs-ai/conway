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
import { manifold_solid_brep } from './AP214E3_2010_gen/manifold_solid_brep.gen'
import { product_definition_shape } from './AP214E3_2010_gen/product_definition_shape.gen'


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


/**
 * SolidWorks writes an assembly-placement relationship parent-first —
 * `REPRESENTATION_RELATIONSHIP(rep_1 = parent SR, rep_2 = child SR)` — the
 * opposite of as1's (child, parent) ordering above. The geometry walk orients
 * each CDSR edge by its NAUO (relating = parent product, related = child), so
 * both conventions must yield NAUO-prefixed occurrence paths and one placement
 * per NAUO. Before that check, this fixture's walk came out inverted: the part
 * representation became a walk root, every path collapsed to the multibody
 * SRR's own id (`[6611]`, joining with no tree node), and the screw's four
 * NAUOs emitted a single placement.
 *
 * Fixture: the NEMA 23 stepper from issue #351 — a multibody motor part
 * (10 named solids behind a plain SRR) + one screw part reused across four
 * NAUOs.
 */
describe( 'AP214 NEMA 23 occurrence geometry (parent-first CDSR ordering)', () => {

  const NEMA_FIXTURE = 'data/nema-23-76mm.step'
  const MOTOR_NAUO = 14107
  // eslint-disable-next-line no-magic-numbers
  const SCREW_NAUOS = [ 14108, 14109, 14110, 14111 ]
  const MOTOR_MULTIBODY_SRR = 6611
  const SCREW_MULTIBODY_SRR = 10234
  const MOTOR_BODY_COUNT = 10

  let nemaScene: AP214SceneBuilder
  let nemaModel: ReturnType<AP214StepParser['parseDataToModel']>[1]

  beforeAll( async () => {

    const parser = AP214StepParser.Instance
    const buffer = new ParsingBuffer( fs.readFileSync( NEMA_FIXTURE ) )

    expect( parser.parseHeader( buffer )[1] ).toBe( ParseResult.COMPLETE )

    const [ , parsed ] = parser.parseDataToModel( buffer )

    expect( parsed ).not.toBe( void 0 )
    nemaModel = parsed

    const [ result, sceneBuilder ] =
      new AP214GeometryExtraction( conwayGeometry, parsed! ).extractAP214GeometryData()

    expect( result ).toBe( ExtractResult.COMPLETE )
    nemaScene = sceneBuilder
  } )

  test( 'every geometry instance path is rooted at a NAUO', () => {

    const treeNauos = new Set( [ MOTOR_NAUO, ...SCREW_NAUOS ] )
    let instances = 0

    for ( const [ , path ] of nemaScene.geometryOccurrences() ) {
      expect( path.length ).toBeGreaterThan( 0 )
      expect( treeNauos.has( path[ 0 ] ) ).toBe( true )
      ++instances
    }

    expect( instances ).toBeGreaterThan( 0 )
  } )

  test( 'a part reused across NAUOs instances once per NAUO (the four screws)', () => {

    // The screw is a SINGLE-solid part, so nothing distinguishes its body from
    // the part: its path is just the NAUO's, one per occurrence.
    const screwPaths = [ ...nemaScene.geometryOccurrences() ]
        .map( ( [ , path ] ) => path )
        .filter( ( path ) => SCREW_NAUOS.includes( path[ 0 ] ) )

    expect( screwPaths.map( ( p ) => JSON.stringify( p ) ).sort() ).toEqual(
        SCREW_NAUOS.map( ( nauo ) => JSON.stringify( [ nauo ] ) ) )
  } )

  test( 'each multibody motor body is its own selection under the motor occurrence', () => {

    // Changed by conway#628 (test-models-private#98), deliberately. Every body
    // of the motor used to carry the SAME path — the NAUO plus the multibody
    // relationship's own express id (#6611) — so the ten bodies were one
    // selection, and that path matched no product-structure node either (the
    // relationship is not an occurrence and has no node). Now each body ends
    // its path with its own express id, which is exactly what the tree's
    // solid node for it carries.
    const motorPaths = [ ...nemaScene.geometryOccurrences() ]
        .map( ( [ , path ] ) => path )
        .filter( ( path ) => path[ 0 ] === MOTOR_NAUO )

    expect( motorPaths.length ).toBeGreaterThan( 1 )

    const bodyIDs = new Set<number>()

    for ( const path of motorPaths ) {
      expect( path.length ).toBe( 2 )
      expect( path[ 0 ] ).toBe( MOTOR_NAUO )
      expect( path[ 1 ] ).not.toBe( MOTOR_MULTIBODY_SRR )
      bodyIDs.add( path[ 1 ] )
    }

    // Per-face styled geometry (the NEMA export has 254 styled faces) is added
    // as children of its body's scene node and shares that body's path, so
    // count DISTINCT bodies rather than nodes.
    expect( bodyIDs.size ).toBe( MOTOR_BODY_COUNT )

    // ...and every one of them is a manifold_solid_brep in the file — the
    // segment is the body's own identity, not a synthesised index.
    for ( const bodyID of bodyIDs ) {
      expect( nemaModel!.getElementByExpressID( bodyID ) )
          .toBeInstanceOf( manifold_solid_brep )
    }
  } )

  // conway#597: the motor and screw solids sit behind a plain (non-CDSR)
  // SHAPE_REPRESENTATION_RELATIONSHIP with no SDR of its own — the
  // SolidWorks multibody pattern — so the express id a pick on them
  // surfaces (the `owner` half of geometryOccurrences(), independent of
  // the occurrence path checked above) used to be the SRR's own express
  // id (6611 / 10234) rather than the owning part's PDS.
  const MOTOR_PDS_EXPRESS_ID = 8846
  const SCREW_PDS_EXPRESS_ID = 8736

  test( 'a picked multibody motor solid reports the motor\'s own PDS, not the SRR (conway#597)', () => {

    const motorOwners = [ ...nemaScene.geometryOccurrences() ]
        .filter( ( [ , path ] ) => path[ 0 ] === MOTOR_NAUO )
        .map( ( [ owner ] ) => owner )

    expect( motorOwners.length ).toBeGreaterThan( 1 )

    for ( const owner of motorOwners ) {
      expect( owner ).toBeInstanceOf( product_definition_shape )
      expect( owner?.expressID ).toBe( MOTOR_PDS_EXPRESS_ID )
      expect( owner?.expressID ).not.toBe( MOTOR_MULTIBODY_SRR )
    }
  } )

  test( 'a picked multibody screw solid reports the screw\'s own PDS, not the SRR (conway#597)', () => {

    const screwOwners = [ ...nemaScene.geometryOccurrences() ]
        .filter( ( [ , path ] ) => SCREW_NAUOS.includes( path[ 0 ] ) )
        .map( ( [ owner ] ) => owner )

    expect( screwOwners.length ).toBe( SCREW_NAUOS.length )

    for ( const owner of screwOwners ) {
      expect( owner ).toBeInstanceOf( product_definition_shape )
      expect( owner?.expressID ).toBe( SCREW_PDS_EXPRESS_ID )
      expect( owner?.expressID ).not.toBe( SCREW_MULTIBODY_SRR )
    }
  } )

  test( 'no multibody relationship id survives in any occurrence path', () => {

    // The other half of conway#628: a plain shape_representation_relationship
    // binds a part to its own detail representation, so it is not an
    // occurrence of anything and the product-structure tree has no node for
    // it. Leaving its id in the path made every such path unresolvable.
    const relationshipIDs = [ MOTOR_MULTIBODY_SRR, SCREW_MULTIBODY_SRR ]

    for ( const [ , path ] of nemaScene.geometryOccurrences() ) {
      for ( const segment of path ) {
        expect( relationshipIDs ).not.toContain( segment )
      }
    }
  } )

  test( 'every geometry path is a tree node\'s path', async () => {

    // The reconciliation the whole scheme exists for, on the multibody shape:
    // paths as a SET rather than a multiset, because a per-face styled export
    // (254 styled faces here) adds a scene node per face UNDER its body's
    // node, sharing that body's path by design.
    const props =
      new AP214Properties( { StepModel: nemaModel! } as unknown as IfcApiProxyAP214 )
    const treePaths = leafOccurrencePaths( await props.getSpatialStructure() as any )
        .map( ( path ) => JSON.stringify( path ) )

    const geometryPaths = [ ...nemaScene.geometryOccurrences() ]
        .map( ( [ , path ] ) => JSON.stringify( path ) )

    expect( geometryPaths.length ).toBeGreaterThan( 0 )
    expect( [ ...new Set( geometryPaths ) ].sort() ).toEqual( treePaths.slice().sort() )
  } )
} )


/**
 * The BLSN_007 shape, reduced (test-models-private#98): ONE product, no NAUO
 * and no context_dependent_shape_representation anywhere, every body named
 * individually inside one child representation — and the relationships binding
 * that child written in BOTH argument orders, three of them inverted.
 *
 * Read literally, an inverted edge makes the product's own SDR-bound
 * representation the CHILD of a free wireframe representation, so each one
 * becomes a separate walk root and the entire model is re-walked and re-placed
 * once per root. On the real 281 MB export that is 2,268 bodies emitted as
 * 698,544 scene nodes sharing 616 paths; here it is 3 bodies as 9 nodes
 * sharing 3. Either way every body of the hull answers to the same path, which
 * is the defect the issue reports as "all parts a single selection".
 */
describe( 'AP214 inverted-SRR multibody occurrence geometry (BLSN_007 shape)', () => {

  const INVERTED_FIXTURE = 'data/ap214-inverted-srr-multibody.step'
  const BODY_COUNT = 3
  // eslint-disable-next-line no-magic-numbers
  const BODY_EXPRESS_IDS = [ 401, 402, 403 ]
  const BODY_NAMES = [ 'brep_0', 'brep_1', 'Hauptkoerper' ]

  let invertedScene: AP214SceneBuilder
  let invertedModel: ReturnType<AP214StepParser['parseDataToModel']>[1]

  beforeAll( async () => {

    const parser = AP214StepParser.Instance
    const buffer = new ParsingBuffer( fs.readFileSync( INVERTED_FIXTURE ) )

    expect( parser.parseHeader( buffer )[1] ).toBe( ParseResult.COMPLETE )

    const [ , parsed ] = parser.parseDataToModel( buffer )

    expect( parsed ).not.toBe( void 0 )
    invertedModel = parsed

    const [ result, sceneBuilder ] =
      new AP214GeometryExtraction( conwayGeometry, parsed! ).extractAP214GeometryData()

    expect( result ).toBe( ExtractResult.COMPLETE )
    invertedScene = sceneBuilder
  } )

  test( 'each body is placed exactly once, not once per inverted relationship', () => {

    const occurrences = [ ...invertedScene.geometryOccurrences() ]

    // Three inverted edges used to make three walk roots, so every body was
    // placed three times: 9 nodes for 3 bodies. Counting nodes is the check —
    // path uniqueness alone would pass a walk that placed one body 3x and
    // dropped the other two.
    expect( occurrences.length ).toBe( BODY_COUNT )
  } )

  test( 'each body carries its own unique occurrence path', () => {

    const paths = [ ...invertedScene.geometryOccurrences() ]
        .map( ( [ , path ] ) => path )

    // One segment, the body's own express id: there is no NAUO in this file to
    // prefix it with, and the relationship ids that used to appear here
    // (`[701,500]`) name nothing selectable.
    expect( paths.map( ( path ) => JSON.stringify( path ) ).sort() ).toEqual(
        BODY_EXPRESS_IDS.map( ( id ) => JSON.stringify( [ id ] ) ).sort() )
  } )

  test( 'the tree names one node per body, and the paths match the scene', async () => {

    const props =
      new AP214Properties( { StepModel: invertedModel! } as unknown as IfcApiProxyAP214 )
    const root = await props.getSpatialStructure() as any

    expect( root.Name.value ).toBe( 'Document' )
    expect( root.children.length ).toBe( BODY_COUNT )
    expect( root.children.map( ( node: any ) => node.Name.value ) ).toEqual( BODY_NAMES )

    for ( const node of root.children ) {
      expect( node.type ).toBe( 'solid' )
      expect( node.ephemeral ).toBe( true )
    }

    const geometryPaths = [ ...invertedScene.geometryOccurrences() ]
        .map( ( [ , path ] ) => JSON.stringify( path ) )
    const treePaths = leafOccurrencePaths( root ).map( ( path ) => JSON.stringify( path ) )

    expect( geometryPaths.slice().sort() ).toEqual( treePaths.slice().sort() )
  } )

  test( 'a picked body reports the owning product\'s PDS (conway#597 unchanged)', () => {

    const PDS_EXPRESS_ID = 301

    for ( const [ owner ] of invertedScene.geometryOccurrences() ) {
      expect( owner ).toBeInstanceOf( product_definition_shape )
      expect( owner?.expressID ).toBe( PDS_EXPRESS_ID )
    }
  } )
} )
