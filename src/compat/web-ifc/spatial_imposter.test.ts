/* eslint-disable no-magic-numbers */
import * as fs from 'fs'

import { describe, expect, test } from '@jest/globals'

import { openStreamedIfcModelFromStore } from '../../ifc/ifc_stream_open'
import { InMemoryStepByteStore } from '../../step/step_buffer_provider'
import EntityTypesIfc from '../../ifc/ifc4_gen/entity_types_ifc.gen'
import type IfcStepModel from '../../ifc/ifc_step_model'
import {
  deriveCoordinationF64,
  mat4MultiplyF64,
  NORMALIZE_MAT_F64,
} from './coordination_f64'
import type { PreviewMeshPayload } from './streamed_preview_channel'
import {
  aabbBoxMatrix,
  aabbMostlyEqual,
  emitSpatialStructureImposters,
  shouldEmitSpatialNode,
  spatialImposterDepthCap,
  SPATIAL_IMPOSTER_COLOR,
  unionAabb,
} from './spatial_imposter'


/** Options for {@link syntheticSpatialIfc}; all lengths in source units. */
interface SpatialFixture {
  /** Site placement, i.e. how far the model sits from world zero. */
  siteOrigin: [number, number, number]
  /** Building placement Z relative to the site (the storey datum). */
  buildingZ: number
  /** Storey elevations relative to the BUILDING datum, ascending. */
  storeyElevations: [number, number]
  /** XY offset of the second contained wall within each storey. */
  wallOffset: [number, number]
}


/**
 * A minimal but schema-valid IFC4 spatial structure —
 * Project/Site/Building/2 Storeys, two placed walls contained in each
 * storey — with every placement and elevation a caller-chosen number.
 * Carries no units and no geometry: the imposter walk reads placement
 * chains only, and takes its scaling factor as an argument.
 *
 * @param fixture Placement/elevation knobs.
 * @return {Uint8Array} The file bytes.
 */
function syntheticSpatialIfc( fixture: SpatialFixture ): Uint8Array {

  const lines: string[] = []
  let next = 1

  const push = ( body: string ): number => {
    const id = next++
    lines.push( `#${id}=${body};` )
    return id
  }

  const num = ( value: number ): string => value.toFixed( 4 )
  const guid = ( seed: number ): string => `3vB2${String( seed ).padStart( 18, '0' )}`

  const placement = (
      relTo: number | undefined,
      x: number,
      y: number,
      z: number ): number => {

    const point = push( `IFCCARTESIANPOINT((${num( x )},${num( y )},${num( z )}))` )
    const axis = push( `IFCAXIS2PLACEMENT3D(#${point},$,$)` )

    return push(
        `IFCLOCALPLACEMENT(${relTo === void 0 ? '$' : `#${relTo}`},#${axis})` )
  }

  const sitePlacement = placement( void 0, ...fixture.siteOrigin )
  const buildingPlacement = placement( sitePlacement, 0, 0, fixture.buildingZ )

  const project = push( `IFCPROJECT('${guid( 1 )}',$,'P',$,$,$,$,$,$)` )
  const site =
    push( `IFCSITE('${guid( 2 )}',$,'S',$,$,#${sitePlacement},$,$,.ELEMENT.,$,$,$,$,$)` )
  const building =
    push( `IFCBUILDING('${guid( 3 )}',$,'B',$,$,#${buildingPlacement},$,$,.ELEMENT.,$,$,$)` )

  const storeys = fixture.storeyElevations.map( ( elevation, index ) => {

    // The storey's own placement carries the same offset from the
    // building datum that Elevation states — the ordinary authoring —
    // so the two only disagree once the BUILDING is off world zero.
    const storeyPlacement = placement( buildingPlacement, 0, 0, elevation )

    return push(
        `IFCBUILDINGSTOREY('${guid( 10 + index )}',$,'L${index}',$,$,` +
        `#${storeyPlacement},$,$,.ELEMENT.,${num( elevation )})` )
  } )

  push( `IFCRELAGGREGATES('${guid( 20 )}',$,$,$,#${project},(#${site}))` )
  push( `IFCRELAGGREGATES('${guid( 21 )}',$,$,$,#${site},(#${building}))` )
  push( `IFCRELAGGREGATES('${guid( 22 )}',$,$,$,#${building},` +
    `(${storeys.map( ( id ) => `#${id}` ).join( ',' )}))` )

  storeys.forEach( ( storey, index ) => {

    const storeyPlacement = storey - 1

    const wallA = push(
        `IFCWALL('${guid( 30 + index * 2 )}',$,$,$,$,` +
        `#${placement( storeyPlacement, 0, 0, 0 )},$,$,$)` )
    const wallB = push(
        `IFCWALL('${guid( 31 + index * 2 )}',$,$,$,$,` +
        `#${placement( storeyPlacement, ...fixture.wallOffset, 0 )},$,$,$)` )

    push( `IFCRELCONTAINEDINSPATIALSTRUCTURE('${guid( 40 + index )}',$,$,$,` +
      `(#${wallA},#${wallB}),#${storey})` )
  } )

  const text =
    'ISO-10303-21;\n' +
    'HEADER;\n' +
    'FILE_DESCRIPTION((\'\'),\'2;1\');\n' +
    'FILE_NAME(\'synthetic.ifc\',\'2026-01-01T00:00:00\',(\'\'),(\'\'),\'\',\'\',\'\');\n' +
    'FILE_SCHEMA((\'IFC4\'));\n' +
    'ENDSEC;\n' +
    'DATA;\n' +
    `${lines.join( '\n' )}\n` +
    'ENDSEC;\n' +
    'END-ISO-10303-21;\n'

  return new TextEncoder().encode( text )
}


/**
 * Emit imposters for a synthetic fixture.
 *
 * @param fixture Placement/elevation knobs.
 * @param linearScalingFactor Source units -> metres.
 * @param coordinationMatrix Latched preview frame, or undefined to
 * exercise the walk's own fallback derivation.
 * @return {Promise<[PreviewMeshPayload[], IfcStepModel]>} Payloads and model.
 */
async function emitForFixture(
    fixture: SpatialFixture,
    linearScalingFactor: number,
    coordinationMatrix?: number[] ):
    Promise< [PreviewMeshPayload[], IfcStepModel] > {

  const open = await openStreamedIfcModelFromStore(
      new InMemoryStepByteStore( syntheticSpatialIfc( fixture ) ),
      { pool: 4 * 1024 } )

  expect( open.model ).toBeDefined()

  const payloads: PreviewMeshPayload[] = []

  await emitSpatialStructureImposters(
      open.model!,
      ( mesh ) => payloads.push( mesh ),
      coordinationMatrix,
      linearScalingFactor )

  expect( payloads.length ).toBeGreaterThan( 0 )

  return [payloads, open.model!]
}


/**
 * @param payloads Emitted imposters.
 * @param model The model they came from.
 * @return {PreviewMeshPayload[]} Only the IfcBuildingStorey plates,
 * ordered bottom-up.
 */
function storeyPlates(
    payloads: PreviewMeshPayload[],
    model: IfcStepModel ): PreviewMeshPayload[] {

  return payloads
      .filter( ( payload ) =>
        model.typeIDOf( model.resolveExpressID( payload.expressID )! ) ===
          EntityTypesIfc.IFCBUILDINGSTOREY )
      .sort( ( a, b ) => a.aabb!.min[ 2 ] - b.aabb!.min[ 2 ] )
}


/**
 * @param actual A 16-element matrix.
 * @param expected A 16-element matrix.
 * @param digits Decimal places (jest's toBeCloseTo semantics).
 */
function expectMatrixClose(
    actual: number[], expected: number[], digits: number = 6 ): void {

  expect( actual ).toHaveLength( 16 )

  for ( let where = 0; where < 16; ++where ) {
    expect( actual[ where ] ).toBeCloseTo( expected[ where ], digits )
  }
}


describe( 'spatial_imposter policy', () => {

  test( 'depth cap is half the tree, rounded up', () => {

    expect( spatialImposterDepthCap( 0 ) ).toBe( 0 )
    expect( spatialImposterDepthCap( 1 ) ).toBe( 1 )
    expect( spatialImposterDepthCap( 4 ) ).toBe( 2 )
    expect( spatialImposterDepthCap( 5 ) ).toBe( 3 )
  } )

  test( 'never emits spaces; always emits storeys; half-depth otherwise', () => {

    expect( shouldEmitSpatialNode( 4, 4, EntityTypesIfc.IFCSPACE ) ).toBe( false )
    expect( shouldEmitSpatialNode( 3, 4, EntityTypesIfc.IFCBUILDINGSTOREY ) ).toBe( true )
    expect( shouldEmitSpatialNode( 2, 4, EntityTypesIfc.IFCBUILDING ) ).toBe( true )
    expect( shouldEmitSpatialNode( 3, 4, EntityTypesIfc.IFCBUILDING ) ).toBe( false )
    expect( shouldEmitSpatialNode( 0, 4, EntityTypesIfc.IFCPROJECT ) ).toBe( true )
  } )

  test( 'unionAabb and aabbMostlyEqual', () => {

    const a = { min: [0, 0, 0] as [number, number, number], max: [10, 10, 4] as [number, number, number] }
    const b = { min: [8, 8, 0] as [number, number, number], max: [12, 12, 4] as [number, number, number] }
    const u = unionAabb( a, b )!

    expect( u.min ).toEqual( [0, 0, 0] )
    expect( u.max ).toEqual( [12, 12, 4] )
    expect( aabbMostlyEqual( a, a ) ).toBe( true )
    expect( aabbMostlyEqual( a, b ) ).toBe( false )
  } )

  test( 'imposter colour is black at 0.3 opacity', () => {

    expect( SPATIAL_IMPOSTER_COLOR ).toEqual( { x: 0, y: 0, z: 0, w: 0.3 } )
  } )

  test( 'aabbBoxMatrix stays in raw IFC space — no axis flip', () => {

    const matrix = aabbBoxMatrix( { min: [0, 0, 0], max: [2, 4, 6] } )

    // translate(centre) * scale(size), column-major, Z-up preserved.
    expect( matrix ).toEqual( [
      2, 0, 0, 0,
      0, 4, 0, 0,
      0, 0, 6, 0,
      1, 2, 3, 1,
    ] )
  } )
} )


describe( 'emitSpatialStructureImposters', () => {

  test( 'index.ifc emits storey-scale wireframe boxes, not spaces', async () => {

    const bytes = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )
    const open = await openStreamedIfcModelFromStore(
        new InMemoryStepByteStore( bytes ), { pool: 4 * 1024 } )
    const payloads: PreviewMeshPayload[] = []

    const emitted = await emitSpatialStructureImposters(
        open.model!, ( mesh ) => payloads.push( mesh ) )

    expect( emitted ).toBeGreaterThan( 0 )
    expect( payloads ).toHaveLength( emitted )

    for ( const payload of payloads ) {

      // Wireframe by request — `solid` stays in the payload contract but
      // nothing sets it any more.
      expect( payload.solid ).toBeUndefined()
      expect( 'solid' in payload ).toBe( false )
      expect( payload.aabb ).toBeDefined()
      expect( payload.geometryExpressID ).toBe( -1 )
      expect( payload.color ).toEqual( SPATIAL_IMPOSTER_COLOR )
      expect( payload.flatTransformation ).toHaveLength( 16 )
    }

    const types = new Set(
        payloads.map( ( p ) => open.model!.typeIDOf(
            open.model!.resolveExpressID( p.expressID )! ) ) )

    expect( types.has( EntityTypesIfc.IFCSPACE ) ).toBe( false )
  } )
} )


// conway#515: the plates used to be emitted in raw source units with a
// locally baked Z-up -> Y-up flip and no coordination at all, so on a
// millimetre model they came out 1000x oversized and on a georeferenced
// one they sat a site-offset away from the meshes they were previewing.
describe( 'emitSpatialStructureImposters coordination frame', () => {

  /** Millimetres, 50km east / 30km north — well past the recentre budget. */
  const MILLIMETRE_GEOREFERENCED: SpatialFixture = {
    siteOrigin: [5e7, 3e7, 0],
    buildingZ: 0,
    storeyElevations: [0, 3000],
    wallOffset: [8000, 6000],
  }

  const MM_TO_M = 0.001

  test( 'millimetre georeferenced plates compose under the latched frame', async () => {

    // What the preview channel latches from a first geometry sitting on
    // the site origin: identity placement, that point as the anchor.
    const coordination = deriveCoordinationF64(
        void 0, { x: 5e7, y: 3e7, z: 0 }, NORMALIZE_MAT_F64, MM_TO_M )

    const [payloads] =
      await emitForFixture( MILLIMETRE_GEOREFERENCED, MM_TO_M, coordination )

    for ( const payload of payloads ) {

      expectMatrixClose(
          payload.flatTransformation,
          mat4MultiplyF64( coordination, aabbBoxMatrix( payload.aabb! ) ) )

      // In metres and near the origin, not 5e7 source units out.
      expect( Math.abs( payload.flatTransformation[ 12 ] ) ).toBeLessThan( 100 )
      expect( Math.abs( payload.flatTransformation[ 13 ] ) ).toBeLessThan( 100 )
      expect( Math.abs( payload.flatTransformation[ 14 ] ) ).toBeLessThan( 100 )

      // Scale columns are metres too — the mm-oversize bug put these at
      // 8000 x 6000 rather than 8 x 6.
      for ( let column = 0; column < 3; ++column ) {
        expect( Math.hypot(
            payload.flatTransformation[ column * 4 ],
            payload.flatTransformation[ column * 4 + 1 ],
            payload.flatTransformation[ column * 4 + 2 ] ) ).toBeLessThan( 100 )
      }

      // The reported box stays in raw IFC space for the consumer.
      expect( payload.aabb!.min[ 0 ] ).toBeGreaterThan( 1e7 )
    }
  } )

  test( 'no latched frame: the fallback derivation recentres the same way', async () => {

    const [payloads] = await emitForFixture( MILLIMETRE_GEOREFERENCED, MM_TO_M )

    // Anchored on the spatial root's centre rather than a first
    // geometry, but the same quantized policy: the 1km grid (1e6 source
    // units here) puts the model back within a cell of the origin.
    for ( const payload of payloads ) {
      expect( Math.hypot(
          payload.flatTransformation[ 12 ],
          payload.flatTransformation[ 13 ],
          payload.flatTransformation[ 14 ] ) ).toBeLessThan( 1e3 )
    }
  } )

  test( 'near-origin metres model is not recentred (model-zero policy)', async () => {

    const [payloads] = await emitForFixture( {
      siteOrigin: [10, 20, 0],
      buildingZ: 0,
      storeyElevations: [0, 3.5],
      wallOffset: [8, 6],
    }, 1 )

    for ( const payload of payloads ) {

      // Inside LARGE_COORDINATE_BUDGET_M the policy recentres nothing,
      // so the whole frame collapses to the Z-up -> Y-up normalize —
      // which is exactly where the durable walk would put these.
      expectMatrixClose(
          payload.flatTransformation,
          mat4MultiplyF64(
              NORMALIZE_MAT_F64 as number[], aabbBoxMatrix( payload.aabb! ) ) )

      const centreX = ( payload.aabb!.min[ 0 ] + payload.aabb!.max[ 0 ] ) * 0.5

      expect( payload.flatTransformation[ 12 ] ).toBeCloseTo( centreX, 9 )
    }
  } )

  test( 'storey plates band on placement Z, not the building-relative elevation',
      async () => {

        // Building datum 100m above world zero: Elevation says 0 and
        // 3.5, but the plates belong at 100 and 103.5.
        const [payloads, model] = await emitForFixture( {
          siteOrigin: [0, 0, 0],
          buildingZ: 100,
          storeyElevations: [0, 3.5],
          wallOffset: [8, 6],
        }, 1 )

        const plates = storeyPlates( payloads, model )

        expect( plates ).toHaveLength( 2 )

        // Lower storey: floor at the placement, ceiling at the next
        // storey's elevation delta above it.
        expect( plates[ 0 ].aabb!.min[ 2 ] ).toBeCloseTo( 100, 6 )
        expect( plates[ 0 ].aabb!.max[ 2 ] ).toBeCloseTo( 103.5, 6 )

        // Upper storey: no next elevation, so MIN_EDGE thick.
        expect( plates[ 1 ].aabb!.min[ 2 ] ).toBeCloseTo( 103.5, 6 )
        expect( plates[ 1 ].aabb!.max[ 2 ] ).toBeCloseTo( 104.5, 6 )
      } )

  test( 'nothing emits `solid`', async () => {

    const [payloads] = await emitForFixture( MILLIMETRE_GEOREFERENCED, MM_TO_M )

    for ( const payload of payloads ) {
      expect( 'solid' in payload ).toBe( false )
    }
  } )
} )
