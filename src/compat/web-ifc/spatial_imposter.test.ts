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
  /**
   * How each storey's own IfcLocalPlacement states its height. The
   * default `'elevation'` offsets it from the building BY the elevation
   * — ordinary authoring, where placement and Elevation agree. `'datum'`
   * parks every storey on the building datum and leaves Elevation as the
   * only record of the height, which some exporters do.
   */
  storeyPlacementZ?: 'elevation' | 'datum'
  /**
   * Rotation baked into the SITE placement's IfcAxis2Placement3D, in
   * degrees. `'z'` is the true-north rotation Revit routinely writes
   * (plan rotation); `'x'` tips the model out of plumb, which no
   * exporter really writes but which separates a correct composition
   * from one that mixes up the Axis and RefDirection columns — a Z-only
   * fixture leaves the third column at the identity and cannot see that.
   */
  siteRotation?: { axis: 'x' | 'z', degrees: number }
  /**
   * Raw `[Axis, RefDirection]` on the site placement, overriding
   * `siteRotation`; either slot may be omitted to write `$`. Lets a
   * fixture state an Axis with no RefDirection, which is how a
   * lie-down placement is commonly authored.
   */
  siteAxes?: PlacementAxes
  /**
   * Write the site's RelativePlacement as an IfcAxis2Placement**2D**.
   * `IfcLocalPlacement.RelativePlacement` admits both forms and the two
   * disagree on every field past Location, so a walk that reads the 3D
   * direction fields unconditionally throws on this file.
   */
  sitePlacement2D?: boolean
}


/** `[Axis (local +Z), RefDirection (local +X)]`, either one omittable. */
type PlacementAxes =
  [[number, number, number] | undefined, [number, number, number] | undefined]


/**
 * The axes an IfcAxis2Placement3D needs to state a rotation, as
 * `[Axis (local +Z), RefDirection (local +X)]`.
 *
 * @param rotation The fixture's rotation knob.
 * @return {PlacementAxes | undefined} The two direction ratios, or
 * undefined for no rotation.
 */
function rotationAxes(
    rotation: SpatialFixture['siteRotation'] ): PlacementAxes | undefined {

  if ( rotation === void 0 ) {
    return
  }

  const radians = rotation.degrees * Math.PI / 180
  const cos = Math.cos( radians )
  const sin = Math.sin( radians )

  // Columns of the rotation matrix: Axis is its third (local +Z),
  // RefDirection its first (local +X).
  return rotation.axis === 'z' ?
    [[0, 0, 1], [cos, sin, 0]] :
    [[0, -sin, cos], [1, 0, 0]]
}


/**
 * Transform a point by the fixture's site rotation — what the composed
 * placement chain must reproduce.
 *
 * @param rotation The fixture's rotation knob.
 * @param point A point in the site's local frame.
 * @return {[number, number, number]} The rotated point.
 */
function rotatePoint(
    rotation: SpatialFixture['siteRotation'],
    point: [number, number, number] ): [number, number, number] {

  if ( rotation === void 0 ) {
    return point
  }

  const radians = rotation.degrees * Math.PI / 180
  const cos = Math.cos( radians )
  const sin = Math.sin( radians )
  const [x, y, z] = point

  return rotation.axis === 'z' ?
    [x * cos - y * sin, x * sin + y * cos, z] :
    [x, y * cos - z * sin, y * sin + z * cos]
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

  // Direction ratios get more decimals than `num`'s four: they are
  // trigonometric, and rounding cos(30 deg) at four places moves a
  // sampled origin by ~1e-4 source units — enough to break assertions
  // that compare a composed plate against the same rotation applied in
  // double precision.
  const direction = ( ratios: [number, number, number] ): number =>
    push( `IFCDIRECTION((${ratios.map( ( r ) => r.toFixed( 12 ) ).join( ',' )}))` )

  const ref = ( ratios: [number, number, number] | undefined ): string =>
    ratios !== void 0 ? `#${direction( ratios )}` : '$'

  const placement = (
      relTo: number | undefined,
      x: number,
      y: number,
      z: number,
      axes?: PlacementAxes,
      twoDimensional: boolean = false ): number => {

    // A 2D placement's Location is a 2D point, and its only direction
    // field is RefDirection — there is no Axis to state.
    const point = twoDimensional ?
      push( `IFCCARTESIANPOINT((${num( x )},${num( y )}))` ) :
      push( `IFCCARTESIANPOINT((${num( x )},${num( y )},${num( z )}))` )

    const axis = twoDimensional ?
      push( `IFCAXIS2PLACEMENT2D(#${point},$)` ) :
      push( `IFCAXIS2PLACEMENT3D(#${point},` +
        `${ref( axes?.[ 0 ] )},${ref( axes?.[ 1 ] )})` )

    return push(
        `IFCLOCALPLACEMENT(${relTo === void 0 ? '$' : `#${relTo}`},#${axis})` )
  }

  const sitePlacement = placement(
      void 0,
      ...fixture.siteOrigin,
      fixture.siteAxes ?? rotationAxes( fixture.siteRotation ),
      fixture.sitePlacement2D === true )
  const buildingPlacement = placement( sitePlacement, 0, 0, fixture.buildingZ )

  const project = push( `IFCPROJECT('${guid( 1 )}',$,'P',$,$,$,$,$,$)` )
  const site =
    push( `IFCSITE('${guid( 2 )}',$,'S',$,$,#${sitePlacement},$,$,.ELEMENT.,$,$,$,$,$)` )
  const building =
    push( `IFCBUILDING('${guid( 3 )}',$,'B',$,$,#${buildingPlacement},$,$,.ELEMENT.,$,$,$)` )

  const storeys = fixture.storeyElevations.map( ( elevation, index ) => {

    // Under the default the storey's own placement carries the same
    // offset from the building datum that Elevation states — the
    // ordinary authoring — so the two only disagree once the BUILDING is
    // off world zero. Under 'datum' the placement says nothing and
    // Elevation is the only record of the height.
    const storeyPlacement = placement(
        buildingPlacement,
        0,
        0,
        fixture.storeyPlacementZ === 'datum' ? 0 : elevation )

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

    // Whatever the storey placement does not say about the height, the
    // contained walls have to say themselves — otherwise every storey's
    // contents would pile up at the building datum, which is not a file
    // any exporter produces.
    const wallZ = fixture.storeyPlacementZ === 'datum' ?
      fixture.storeyElevations[ index ] : 0

    const wallA = push(
        `IFCWALL('${guid( 30 + index * 2 )}',$,$,$,$,` +
        `#${placement( storeyPlacement, 0, 0, wallZ )},$,$,$)` )
    const wallB = push(
        `IFCWALL('${guid( 31 + index * 2 )}',$,$,$,$,` +
        `#${placement( storeyPlacement, ...fixture.wallOffset, wallZ )},$,$,$)` )

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

  test( 'storey plates band on the building datum, not on bare elevation',
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

  test( 'storey plates keep their spacing when only Elevation states it',
      async () => {

        // Every storey placement parked on the building datum, so the
        // placement chain reports the same Z for both and Elevation is
        // the only thing that separates them. Reading placement Z
        // INSTEAD of elevation stacks both plates on 100; reading it as
        // the datum elevation is measured from keeps them apart.
        const [payloads, model] = await emitForFixture( {
          siteOrigin: [0, 0, 0],
          buildingZ: 100,
          storeyElevations: [0, 3.5],
          wallOffset: [8, 6],
          storeyPlacementZ: 'datum',
        }, 1 )

        const plates = storeyPlates( payloads, model )

        expect( plates ).toHaveLength( 2 )
        expect( plates[ 0 ].aabb!.min[ 2 ] ).toBeCloseTo( 100, 6 )
        expect( plates[ 1 ].aabb!.min[ 2 ] ).toBeCloseTo( 103.5, 6 )
      } )

  // conway#517: the placement chain used to SUM Location translations
  // and ignore rotation outright, so on a Revit export rotated to true
  // north every sampled origin landed unrotated in raw model space while
  // the durable meshes did not — the plate cloud read as a rotated ghost
  // of the building. Both fixtures below fail against that composition.
  describe( 'rotation-aware placement composition', () => {

    /** Site rotated 30 deg about Z — Revit's true-north plan rotation. */
    const ROTATED_SITE: SpatialFixture = {
      siteOrigin: [0, 0, 0],
      buildingZ: 0,
      storeyElevations: [0, 3.5],
      wallOffset: [8, 6],
      siteRotation: { axis: 'z', degrees: 30 },
    }

    /** Site tipped 30 deg about X, with the building datum 100 up. */
    const TILTED_SITE: SpatialFixture = {
      siteOrigin: [0, 0, 0],
      buildingZ: 100,
      storeyElevations: [0, 3.5],
      wallOffset: [8, 6],
      siteRotation: { axis: 'x', degrees: 30 },
    }

    test( 'plan rotation: plate XY is the AABB of the ROTATED samples',
        async () => {

          const [payloads, model] = await emitForFixture( ROTATED_SITE, 1 )
          const plates = storeyPlates( payloads, model )

          expect( plates ).toHaveLength( 2 )

          // The two walls each storey contains, composed through the
          // rotated site placement.
          const cornerA = rotatePoint( ROTATED_SITE.siteRotation, [0, 0, 0] )
          const cornerB = rotatePoint(
              ROTATED_SITE.siteRotation, [...ROTATED_SITE.wallOffset, 0] )

          for ( const plate of plates ) {

            expect( plate.aabb!.min[ 0 ] )
                .toBeCloseTo( Math.min( cornerA[ 0 ], cornerB[ 0 ] ), 6 )
            expect( plate.aabb!.max[ 0 ] )
                .toBeCloseTo( Math.max( cornerA[ 0 ], cornerB[ 0 ] ), 6 )
            expect( plate.aabb!.min[ 1 ] )
                .toBeCloseTo( Math.min( cornerA[ 1 ], cornerB[ 1 ] ), 6 )
            expect( plate.aabb!.max[ 1 ] )
                .toBeCloseTo( Math.max( cornerA[ 1 ], cornerB[ 1 ] ), 6 )
          }

          // And specifically NOT the unrotated offset the translation-sum
          // implementation produced: 6 m north instead of 9.2 m.
          expect( plates[ 0 ].aabb!.max[ 1 ] )
              .not.toBeCloseTo( ROTATED_SITE.wallOffset[ 1 ], 3 )
        } )

    test( 'tilt about X: storey floors band on the DATUM\'s world Z',
        async () => {

          const [payloads, model] = await emitForFixture( TILTED_SITE, 1 )
          const plates = storeyPlates( payloads, model )

          expect( plates ).toHaveLength( 2 )

          const rotation = TILTED_SITE.siteRotation
          const floorA = rotatePoint( rotation, [0, 0, 100] )
          const floorB = rotatePoint( rotation, [...TILTED_SITE.wallOffset, 100] )

          // Elevation is a length along the datum's own +Z, so a tilted
          // datum puts the floor at cos(30) * the elevation, not at it.
          expect( plates[ 0 ].aabb!.min[ 2 ] ).toBeCloseTo( floorA[ 2 ], 6 )
          expect( plates[ 1 ].aabb!.min[ 2 ] )
              .toBeCloseTo( rotatePoint( rotation, [0, 0, 103.5] )[ 2 ], 6 )

          // A Z-only fixture leaves the third matrix column at the
          // identity; this one does not, so an Axis/RefDirection mixup
          // shows up as Y bounds that never left zero.
          expect( plates[ 0 ].aabb!.min[ 1 ] )
              .toBeCloseTo( Math.min( floorA[ 1 ], floorB[ 1 ] ), 6 )
          expect( plates[ 0 ].aabb!.max[ 1 ] )
              .toBeCloseTo( Math.max( floorA[ 1 ], floorB[ 1 ] ), 6 )

          // The translation-sum implementation put both floors at the
          // bare elevations, 100 and 103.5.
          expect( plates[ 0 ].aabb!.min[ 2 ] ).not.toBeCloseTo( 100, 3 )
          expect( plates[ 1 ].aabb!.min[ 2 ] ).not.toBeCloseTo( 103.5, 3 )
        } )

    test( 'an Axis with no RefDirection still yields a frame', async () => {

      // Axis = world +X with RefDirection omitted: the IFC default
      // RefDirection (1,0,0) is parallel to it, so a naive build finds a
      // zero cross product. Falling all the way back to world axes there
      // discards a perfectly good rotation; IFC's IfcFirstProjAxis
      // substitutes a perpendicular reference instead, which sends local
      // (a,b,c) to world (c,a,b).
      const [payloads, model] = await emitForFixture( {
        siteOrigin: [0, 0, 0],
        buildingZ: 0,
        storeyElevations: [0, 3.5],
        wallOffset: [8, 6],
        siteAxes: [[1, 0, 0], void 0],
      }, 1 )

      const plates = storeyPlates( payloads, model )

      expect( plates ).toHaveLength( 2 )

      // Lower storey's walls: local (0,0,0) and (8,6,0) -> (0,0,0) and
      // (0,8,6). X collapses, so the plate is MIN_EDGE thick about
      // zero there; the identity fallback would have spanned 0..8.
      const plate = plates[ 0 ].aabb!

      expect( ( plate.min[ 0 ] + plate.max[ 0 ] ) * 0.5 ).toBeCloseTo( 0, 6 )
      expect( plate.max[ 0 ] - plate.min[ 0 ] ).toBeCloseTo( 1, 6 )
      expect( plate.max[ 1 ] ).toBeCloseTo( 8, 6 )
      expect( plate.max[ 2 ] ).toBeCloseTo( 6, 6 )
    } )

    test( 'a 2D relative placement does not break the chain', async () => {

      // IfcLocalPlacement.RelativePlacement admits IfcAxis2Placement2D,
      // whose field 1 is RefDirection (not Axis) and which has no field
      // 2 at all. Reading the 3D direction fields unconditionally throws
      // "too few fields in record"; that throw memoizes an undefined
      // placement, and every DESCENDANT then composes in local
      // coordinates — the site translation below silently disappears.
      const [payloads, model] = await emitForFixture( {
        siteOrigin: [10, 20, 0],
        buildingZ: 100,
        storeyElevations: [0, 3.5],
        wallOffset: [8, 6],
        sitePlacement2D: true,
      }, 1 )

      const plates = storeyPlates( payloads, model )

      expect( plates ).toHaveLength( 2 )

      // The site's XY still reaches the storeys...
      expect( plates[ 0 ].aabb!.min[ 0 ] ).toBeCloseTo( 10, 6 )
      expect( plates[ 0 ].aabb!.max[ 0 ] ).toBeCloseTo( 18, 6 )
      expect( plates[ 0 ].aabb!.min[ 1 ] ).toBeCloseTo( 20, 6 )
      expect( plates[ 0 ].aabb!.max[ 1 ] ).toBeCloseTo( 26, 6 )

      // ...and so does the building datum the elevations band on.
      expect( plates[ 0 ].aabb!.min[ 2 ] ).toBeCloseTo( 100, 6 )
      expect( plates[ 1 ].aabb!.min[ 2 ] ).toBeCloseTo( 103.5, 6 )
    } )
  } )

  test( 'nothing emits `solid`', async () => {

    const [payloads] = await emitForFixture( MILLIMETRE_GEOREFERENCED, MM_TO_M )

    for ( const payload of payloads ) {
      expect( 'solid' in payload ).toBe( false )
    }
  } )
} )
