import type IfcStepModel from '../../ifc/ifc_step_model'
import EntityTypesIfc from '../../ifc/ifc4_gen/entity_types_ifc.gen'
import {
  IfcBuilding,
  IfcBuildingStorey,
  IfcProject,
  IfcRelAggregates,
  IfcRelContainedInSpatialStructure,
  IfcSite,
  IfcSpace,
} from '../../ifc/ifc4_gen'
import {
  deriveCoordinationF64,
  mat4MultiplyF64,
  NORMALIZE_MAT_F64,
} from './coordination_f64'
import type { PreviewMeshPayload } from './streamed_preview_channel'


/* eslint-disable no-magic-numbers */

/** Black, almost transparent — Share honours `w` as opacity. */
export const SPATIAL_IMPOSTER_COLOR = { x: 0, y: 0, z: 0, w: 0.3 }

/** Sample this many contained-product placements per spatial node. */
const PRODUCT_SAMPLE = 32

/** Collapse a parent whose box matches its only child this closely. */
const COLLAPSE_REL = 0.15

/**
 * Minimum box edge IN METRES so a point origin still draws. Every box in
 * this module is in raw IFC source units, so callers convert this by the
 * model's linear scaling factor before use ({@link minEdgeSourceUnits}) —
 * a bare `1` is one metre on a metre model but one millimetre on a
 * millimetre one, which made the padding invisible on mm files.
 */
const MIN_EDGE_M = 1

/** Degenerate-scale floor for a box matrix (source units). */
const MIN_BOX_SCALE = 1e-3


/** An axis-aligned box in raw IFC source-unit space (Z-up). */
export interface Aabb3 {
  min: [number, number, number]
  max: [number, number, number]
}


/**
 * MIN_EDGE_M expressed in the model's own source units.
 *
 * @param linearScalingFactor Source units -> metres.
 * @return {number} The minimum edge in source units.
 */
function minEdgeSourceUnits( linearScalingFactor: number ): number {

  return MIN_EDGE_M / sanitizeScale_( linearScalingFactor )
}


/**
 * @param linearScalingFactor Source units -> metres, possibly garbage.
 * @return {number} The factor, or 1 when it is not usable.
 */
function sanitizeScale_( linearScalingFactor: number ): number {

  return Number.isFinite( linearScalingFactor ) && linearScalingFactor > 0 ?
    linearScalingFactor : 1
}


/**
 * Column-major 4x4 mapping a centred unit cube onto `aabb`, entirely in
 * RAW IFC space: `translate(centre) * scale(size)`.
 *
 * Deliberately carries NO Z-up -> Y-up flip and NO unit scaling: both of
 * those live in the coordination matrix this is composed under (see
 * {@link emitSpatialStructureImposters}), exactly as they do for real
 * meshes. Baking the flip here — which the parse-time point-list
 * imposter this replaced used to do — put the plates in a frame the
 * durable geometry never shares (conway#515).
 *
 * @param aabb The IFC-space bounds.
 * @return {number[]} 16-element matrix.
 */
export function aabbBoxMatrix( aabb: Aabb3 ): number[] {

  const sx = Math.max( aabb.max[ 0 ] - aabb.min[ 0 ], MIN_BOX_SCALE )
  const sy = Math.max( aabb.max[ 1 ] - aabb.min[ 1 ], MIN_BOX_SCALE )
  const sz = Math.max( aabb.max[ 2 ] - aabb.min[ 2 ], MIN_BOX_SCALE )
  const cx = ( aabb.min[ 0 ] + aabb.max[ 0 ] ) * 0.5
  const cy = ( aabb.min[ 1 ] + aabb.max[ 1 ] ) * 0.5
  const cz = ( aabb.min[ 2 ] + aabb.max[ 2 ] ) * 0.5

  return [
    sx, 0, 0, 0,
    0, sy, 0, 0,
    0, 0, sz, 0,
    cx, cy, cz, 1,
  ]
}

const REL_AGGREGATES_RELATING = [4, 4, 3] as const
const REL_AGGREGATES_RELATED = [5, 4, 3] as const
const REL_CONTAINED_RELATED = [4, 4, 3] as const
const REL_CONTAINED_RELATING = [5, 4, 3] as const
const PRODUCT_PLACEMENT = [5, 5, 3] as const
const LOCAL_PLACEMENT_REL_TO = [0, 0, 1] as const
const LOCAL_PLACEMENT_RELATIVE = [1, 0, 1] as const
const PLACEMENT_LOCATION = [0, 0, 2] as const
const PLACEMENT_AXIS = [1, 1, 3] as const
const PLACEMENT_REF_DIRECTION = [2, 1, 3] as const
const STOREY_ELEVATION = [9, 9, 6] as const

/** Column-major 4x4, the convention {@link mat4MultiplyF64} multiplies in. */
type Mat4 = number[]

const IDENTITY_PLACEMENT: Mat4 = [
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1,
]

/** Column-major indices of a 4x4's translation component. */
const TRANSLATION = [12, 13, 14] as const

/** Column-major index of the local +Z axis' world Z component. */
const LOCAL_Z_WORLD_Z = 10

/** Cross-product magnitude below which two unit axes are parallel. */
const MIN_AXIS_CROSS = 1e-9


const SPACE_TYPES = new Set< number >( [
  EntityTypesIfc.IFCSPACE,
  EntityTypesIfc.IFCSPATIALZONE,
  EntityTypesIfc.IFCEXTERNALSPATIALELEMENT,
] )

const STOREY_TYPES = new Set< number >( [
  EntityTypesIfc.IFCBUILDINGSTOREY,
] )


interface SpatialNode {
  localID: number
  expressID: number
  typeID: number
  depth: number
  children: number[]
  /** Composed world placement, or undefined when the chain gave none. */
  placement?: Mat4
  /** `placement`'s translation column, cached for the box arithmetic. */
  origin?: [number, number, number]
  elevation?: number
  aabb?: Aabb3
  computing?: boolean
}


/**
 * Deepest spatial depth we still emit (never Spaces). Halfway down the
 * tree, plus every BuildingStorey — floor plates are the useful cut.
 *
 * @param maxDepth Deepest spatial node (spaces included).
 * @return {number} Inclusive depth cap for non-storey nodes.
 */
export function spatialImposterDepthCap( maxDepth: number ): number {

  return Math.max( 0, Math.ceil( maxDepth / 2 ) )
}


/**
 * Whether this spatial node should become a box.
 *
 * @param depth Node depth from the project root.
 * @param maxDepth Tree depth.
 * @param typeID Schema type.
 * @return {boolean} True to emit.
 */
export function shouldEmitSpatialNode(
    depth: number,
    maxDepth: number,
    typeID: number ): boolean {

  if ( SPACE_TYPES.has( typeID ) ) {
    return false
  }

  if ( STOREY_TYPES.has( typeID ) ) {
    return true
  }

  return depth <= spatialImposterDepthCap( maxDepth )
}


/**
 * True when two AABBs are within `rel` of each other on every axis
 * (used to drop Project/Site wrappers that match the Building).
 *
 * @param a First box.
 * @param b Second box.
 * @param rel Relative slack.
 * @param minEdge Span floor, in the same source units as `a` and `b`.
 * The walk always passes {@link minEdgeSourceUnits}' converted value;
 * the default is the unconverted MIN_EDGE_M, which is only correct on a
 * metre model — a caller that omits it on a millimetre one gets a
 * one-millimetre floor, the very bug MIN_EDGE_M removed.
 * @return {boolean} True if they match.
 */
export function aabbMostlyEqual(
    a: Aabb3,
    b: Aabb3,
    rel: number = COLLAPSE_REL,
    minEdge: number = MIN_EDGE_M ): boolean {

  for ( let axis = 0; axis < 3; ++axis ) {

    const span = Math.max(
        a.max[ axis ] - a.min[ axis ],
        b.max[ axis ] - b.min[ axis ],
        minEdge )
    const slack = span * rel

    if ( Math.abs( a.min[ axis ] - b.min[ axis ] ) > slack ||
        Math.abs( a.max[ axis ] - b.max[ axis ] ) > slack ) {
      return false
    }
  }

  return true
}


/**
 * Union of boxes; ignores undefined.
 *
 * @param boxes Boxes to join.
 * @return {Aabb3 | undefined} The union.
 */
export function unionAabb( ...boxes: ( Aabb3 | undefined )[] ): Aabb3 | undefined {

  let min: [number, number, number] | undefined
  let max: [number, number, number] | undefined

  for ( const box of boxes ) {

    if ( box === void 0 ) {
      continue
    }

    if ( min === void 0 || max === void 0 ) {
      min = [box.min[ 0 ], box.min[ 1 ], box.min[ 2 ]]
      max = [box.max[ 0 ], box.max[ 1 ], box.max[ 2 ]]
      continue
    }

    for ( let axis = 0; axis < 3; ++axis ) {
      if ( box.min[ axis ] < min[ axis ] ) {
        min[ axis ] = box.min[ axis ]
      }
      if ( box.max[ axis ] > max[ axis ] ) {
        max[ axis ] = box.max[ axis ]
      }
    }
  }

  return min === void 0 || max === void 0 ? void 0 : { min, max }
}


function padAabb_( box: Aabb3, minEdge: number ): Aabb3 {

  const min: [number, number, number] = [box.min[ 0 ], box.min[ 1 ], box.min[ 2 ]]
  const max: [number, number, number] = [box.max[ 0 ], box.max[ 1 ], box.max[ 2 ]]

  for ( let axis = 0; axis < 3; ++axis ) {

    if ( max[ axis ] - min[ axis ] < minEdge ) {
      const mid = ( min[ axis ] + max[ axis ] ) * 0.5
      min[ axis ] = mid - minEdge * 0.5
      max[ axis ] = mid + minEdge * 0.5
    }
  }

  return { min, max }
}


function pointAabb_( x: number, y: number, z: number ): Aabb3 {

  return { min: [x, y, z], max: [x, y, z] }
}


async function ensure_( model: IfcStepModel, localID: number ): Promise< void > {

  await model.ensureResidentByLocalID( localID )
}


/**
 * @param v A vector.
 * @return {[number, number, number] | undefined} `v` scaled to unit
 * length, or undefined when it has none (zero / non-finite input).
 */
function normalize3_(
    v: [number, number, number] ): [number, number, number] | undefined {

  const length = Math.hypot( v[ 0 ], v[ 1 ], v[ 2 ] )

  return Number.isFinite( length ) && length > 0 ?
    [v[ 0 ] / length, v[ 1 ] / length, v[ 2 ] / length] : void 0
}


/**
 * @param a Left vector.
 * @param b Right vector.
 * @return {[number, number, number]} `a` x `b`.
 */
function cross3_(
    a: [number, number, number],
    b: [number, number, number] ): [number, number, number] {

  return [
    a[ 1 ] * b[ 2 ] - a[ 2 ] * b[ 1 ],
    a[ 2 ] * b[ 0 ] - a[ 0 ] * b[ 2 ],
    a[ 0 ] * b[ 1 ] - a[ 1 ] * b[ 0 ],
  ]
}


/**
 * The `DirectionRatios` of an IfcDirection referenced from `field` of
 * `entity`, or undefined when the field is absent.
 *
 * @param model The model.
 * @param entity The referring entity.
 * @param field The (index, min, max) field triple.
 * @return {Promise<[number, number, number] | undefined>} The ratios.
 */
async function directionRatios_(
    model: IfcStepModel,
    entity: { extractReferenceLocalID(
      a: number, b: number, c: number, optional: boolean ): number | null },
    field: readonly [number, number, number] ):
    Promise< [number, number, number] | undefined > {

  const directionID =
    entity.extractReferenceLocalID( field[ 0 ], field[ 1 ], field[ 2 ], true )

  if ( directionID === null ) {
    return
  }

  await ensure_( model, directionID )
  const direction = model.getElementByLocalID( directionID ) as
    { DirectionRatios?: number[] } | undefined
  const ratios = direction?.DirectionRatios

  if ( ratios === void 0 || ratios.length < 2 ) {
    return
  }

  return [ratios[ 0 ], ratios[ 1 ], ratios[ 2 ] ?? 0]
}


/**
 * The local +X reference to use when a placement states an `Axis` but no
 * `RefDirection`: world +X, unless that is (nearly) parallel to the
 * stated axis, in which case world +Y.
 *
 * IFC's own `IfcFirstProjAxis` makes exactly this substitution, and
 * without it a lie-down placement — `Axis = (1,0,0)`, RefDirection
 * omitted, which is how a wall-mounted or rotated-into-plan element is
 * commonly written — has its Axis cross the defaulted (1,0,0) to zero
 * and falls all the way back to the world frame, discarding a perfectly
 * well-formed rotation. conway-geom divides by that zero cross product
 * and returns NaN, so matching the C++ settles nothing here; keeping the
 * stated Axis is strictly better than dropping it.
 *
 * @param zAxis The normalized local +Z.
 * @return {[number, number, number]} A reference not parallel to it.
 */
function defaultRefDirection_(
    zAxis: [number, number, number] ): [number, number, number] {

  // |cross(zAxis, worldX)| — world +X stays the default (which is what
  // the IFC default says, and what the overwhelmingly common
  // zAxis = (0,0,1) needs) until it degenerates.
  return Math.hypot( zAxis[ 1 ], zAxis[ 2 ] ) > MIN_AXIS_CROSS ?
    [1, 0, 0] : [0, 1, 0]
}


/**
 * The 4x4 an IfcAxis2Placement denotes: Location as the translation,
 * and — on the 3D form only — Axis as local +Z and RefDirection as local
 * +X, both defaulting to the world axes when absent per the IFC
 * defaults.
 *
 * The 2D form has to be handled, not assumed away.
 * `IfcLocalPlacement.RelativePlacement` is
 * `IfcAxis2Placement2D | IfcAxis2Placement3D`, and the two disagree on
 * every field past Location: offset 1 is `Axis` on the 3D entity but
 * `RefDirection` on the 2D one, and offset 2 does not exist there at
 * all, so reading it throws "too few fields in record". That throw would
 * escape to {@link placementTransform_}'s catch, which memoizes
 * `undefined` for the placement — and a memoized undefined is not merely
 * a lost sample: every descendant placement then takes the
 * no-parent branch and is composed in LOCAL coordinates, silently
 * reparenting a whole subtree to the origin. So the direction fields are
 * read only once the type is confirmed 3D, which also restores the
 * pre-#517 behaviour for 2D links (translation only).
 *
 * Deliberately the same construction as conway-geom's
 * `GetAxis2Placement3D` (ConwayGeometryProcessor.cpp) — normalize the
 * two references, `y = normalize(z x x)`, then re-derive
 * `x = normalize(y x z)` so a non-perpendicular RefDirection is
 * projected rather than skewing the frame. It has to match: the plates
 * are previewing meshes the durable pipeline places with that function,
 * and a second convention here (Gram-Schmidt on x, say) would rotate
 * them apart on any file whose RefDirection is off-perpendicular.
 *
 * One deviation, on degenerate input: where the C++ divides by a zero
 * cross product and yields NaN, this falls back to the identity axes. A
 * NaN transform reaching Share is an invisible or scene-destroying box,
 * and the imposter path's standing rule is that a preview must never
 * break open.
 *
 * @param model The model.
 * @param axisLocalID The IfcAxis2Placement3D's local ID.
 * @return {Promise<Mat4>} The placement, identity if unreadable.
 */
async function axisPlacementMatrix_(
    model: IfcStepModel,
    axisLocalID: number ): Promise< Mat4 > {

  await ensure_( model, axisLocalID )
  const placement = model.getElementByLocalID( axisLocalID )

  if ( placement === void 0 ) {
    return IDENTITY_PLACEMENT.slice()
  }

  let translation: [number, number, number] = [0, 0, 0]

  const locationID = placement.extractReferenceLocalID(
      PLACEMENT_LOCATION[ 0 ],
      PLACEMENT_LOCATION[ 1 ],
      PLACEMENT_LOCATION[ 2 ],
      false )

  if ( locationID !== null ) {

    await ensure_( model, locationID )
    const point = model.getElementByLocalID( locationID ) as
      { Coordinates?: number[] } | undefined
    const coords = point?.Coordinates

    if ( coords !== void 0 && coords.length >= 2 ) {
      translation = [coords[ 0 ], coords[ 1 ], coords[ 2 ] ?? 0]
    }
  }

  const is3D =
    model.typeIDOf( axisLocalID ) === EntityTypesIfc.IFCAXIS2PLACEMENT3D

  const axisRatios = is3D ?
    await directionRatios_( model, placement, PLACEMENT_AXIS ) : void 0
  const refRatios = is3D ?
    await directionRatios_( model, placement, PLACEMENT_REF_DIRECTION ) : void 0

  let zAxis: [number, number, number] =
    ( axisRatios !== void 0 ? normalize3_( axisRatios ) : void 0 ) ?? [0, 0, 1]
  let refAxis: [number, number, number] =
    ( refRatios !== void 0 ? normalize3_( refRatios ) : void 0 ) ??
      defaultRefDirection_( zAxis )

  let yAxis = normalize3_( cross3_( zAxis, refAxis ) )

  if ( yAxis === void 0 ) {
    // Axis and RefDirection are parallel (or garbage): nothing here
    // determines a frame, so keep the translation and drop back to world
    // axes. Only reachable with an explicit RefDirection now — an Axis
    // on its own gets a perpendicular default instead of being thrown
    // away with it (see defaultRefDirection_).
    zAxis = [0, 0, 1]
    refAxis = [1, 0, 0]
    yAxis = [0, 1, 0]
  }

  const xAxis = normalize3_( cross3_( yAxis, zAxis ) ) ?? refAxis

  return [
    xAxis[ 0 ], xAxis[ 1 ], xAxis[ 2 ], 0,
    yAxis[ 0 ], yAxis[ 1 ], yAxis[ 2 ], 0,
    zAxis[ 0 ], zAxis[ 1 ], zAxis[ 2 ], 0,
    translation[ 0 ], translation[ 1 ], translation[ 2 ], 1,
  ]
}


/**
 * The composed world transform of an IfcLocalPlacement chain: every
 * link's IfcAxis2Placement3D built out in full and multiplied
 * `parent * local`, which is exactly conway-geom's `GetLocalPlacement`.
 *
 * Rotation used to be dropped here — the chain summed Location
 * translations and nothing else (conway#514's shortcut). That is correct
 * only while every ancestor placement is axis-aligned, and Revit
 * routinely rotates the site or building placement to true north, so on
 * a real export every sampled origin landed unrotated in raw model space
 * while the durable meshes beside it did not: the plate cloud read as a
 * rotated ghost of the building (conway#517).
 *
 * @param model The model.
 * @param placementLocalID IfcObjectPlacement local ID.
 * @param cache Memo of composed transforms, keyed by placement local ID.
 * A placement re-entered while it is being composed (a cyclic RelativeTo)
 * reads back undefined and stops the recursion.
 * @return {Promise<Mat4 | undefined>} The world transform.
 */
async function placementTransform_(
    model: IfcStepModel,
    placementLocalID: number,
    cache: Map< number, Mat4 | undefined > ): Promise< Mat4 | undefined > {

  if ( cache.has( placementLocalID ) ) {
    return cache.get( placementLocalID )
  }

  cache.set( placementLocalID, void 0 )

  try {

    await ensure_( model, placementLocalID )
    const typeID = model.typeIDOf( placementLocalID )

    if ( typeID !== EntityTypesIfc.IFCLOCALPLACEMENT ) {
      return
    }

    const entity = model.getElementByLocalID( placementLocalID )

    if ( entity === void 0 ) {
      return
    }

    const relativeID = entity.extractReferenceLocalID(
        LOCAL_PLACEMENT_RELATIVE[ 0 ],
        LOCAL_PLACEMENT_RELATIVE[ 1 ],
        LOCAL_PLACEMENT_RELATIVE[ 2 ],
        false )

    const local = relativeID !== null ?
      await axisPlacementMatrix_( model, relativeID ) :
      IDENTITY_PLACEMENT.slice()

    const parentID = entity.extractReferenceLocalID(
        LOCAL_PLACEMENT_REL_TO[ 0 ],
        LOCAL_PLACEMENT_REL_TO[ 1 ],
        LOCAL_PLACEMENT_REL_TO[ 2 ],
        true )

    if ( parentID === null ) {
      cache.set( placementLocalID, local )
      return local
    }

    const parent = await placementTransform_( model, parentID, cache )
    const world = parent === void 0 ? local : mat4MultiplyF64( parent, local )

    cache.set( placementLocalID, world )
    return world
  } catch {
    return
  }
}


/**
 * @param transform A composed world transform.
 * @return {[number, number, number]} Its translation column, i.e. where
 * the placement's own origin lands in world space.
 */
function originOf_( transform: Mat4 ): [number, number, number] {

  return [
    transform[ TRANSLATION[ 0 ] ],
    transform[ TRANSLATION[ 1 ] ],
    transform[ TRANSLATION[ 2 ] ],
  ]
}


async function productTransform_(
    model: IfcStepModel,
    localID: number,
    cache: Map< number, Mat4 | undefined > ): Promise< Mat4 | undefined > {

  await ensure_( model, localID )
  const entity = model.getElementByLocalID( localID )

  if ( entity === void 0 ) {
    return
  }

  const placementID = entity.extractReferenceLocalID(
      PRODUCT_PLACEMENT[ 0 ],
      PRODUCT_PLACEMENT[ 1 ],
      PRODUCT_PLACEMENT[ 2 ],
      true )

  if ( placementID === null ) {
    return
  }

  return placementTransform_( model, placementID, cache )
}


/**
 * Walk the IFC spatial tree and emit AABB imposters for Share.
 *
 * Project → Site → Building → Storey → Space. Spaces are never
 * drawn (too dense). Everything else is drawn down to half the tree
 * depth, and storeys are always drawn when present. Nested wrappers
 * whose box matches their only child are collapsed.
 *
 * **Frame.** Every box is measured in raw IFC source units and Z-up,
 * because that is what the placement chains this walk reads carry. The
 * emitted `flatTransformation` is `C * M_box`, where `M_box` is that raw
 * box ({@link aabbBoxMatrix}) and `C` is the durable coordination frame —
 * metres, Y-up, recentred per the quantized model-zero policy. So the
 * plates land exactly where the real meshes do, which they did not
 * before (raw units, a locally baked axis flip, no coordination: on a
 * millimetre model the plates came out 1000x too big, and a
 * georeferenced one put them a site-offset away — conway#515).
 * `payload.aabb` stays in raw IFC space as the consumer's reference.
 *
 * **Call it after `prepareDemandExtraction()`, never before.** The frame
 * needs `getLinearScalingFactor()`, which reads 1 until the extraction
 * maps — and with them the unit assignment — are prepared, and
 * `extractLinearScalingFactor()` is `*=`-accumulating, so it cannot be
 * pulled forward on its own without squaring the unit prefix. The cost
 * is latency on the model's first visible feedback: on the resident path
 * the plates now follow the prep instead of preceding it, and on the
 * store-backed path they also follow an awaited
 * `ensureResidentForDemandPrep()`, so on a large model they land
 * measurably later than they used to. Accepted deliberately — a plate at
 * 1000x the model's scale is worse than a plate slightly late.
 *
 * **The latched frame is adopted, not guaranteed.** The deferred durable
 * pump re-derives its own when the composed placement overruns
 * LARGE_COORDINATE_BUDGET_M (`validatePreviewFrame`, Share#1634). Plates
 * emitted here are not re-emitted, so on that path they keep the
 * rejected frame and sit a site-offset from the durable meshes — the
 * conway#515 symptom again, now confined to a case the preview meshes
 * beside them share, and to scenery Share tears down at load end.
 * Re-emitting on rejection is the fix if it ever shows up live.
 *
 * @param model Parsed IFC model (windowed or resident).
 * @param onMesh Preview consumer.
 * @param coordinationMatrix The frame already latched by the preview
 * channel (the one the durable pump adopts). When it is `undefined` — no
 * preview instance was ever captured — the walk derives the same frame
 * from an identity placement anchored on the root spatial box's centre.
 * That is best-effort by construction: below LARGE_COORDINATE_BUDGET_M
 * the policy recentres nothing, so it agrees with the durable derivation
 * exactly; above it, both snap to COORDINATION_SNAP_M and agree as long
 * as the spatial root and the first geometry share a grid cell.
 * @param linearScalingFactor Source units -> metres, from
 * `IfcGeometryExtraction.getLinearScalingFactor()`. Only consulted for
 * the fallback derivation and the minimum-edge padding; when
 * `coordinationMatrix` is supplied its own scaling is already baked in.
 * @return {Promise<number>} Boxes emitted.
 */
export async function emitSpatialStructureImposters(
    model: IfcStepModel,
    onMesh: ( mesh: PreviewMeshPayload ) => void,
    coordinationMatrix?: ArrayLike< number >,
    linearScalingFactor: number = 1 ): Promise< number > {

  const minEdge = minEdgeSourceUnits( linearScalingFactor )
  const nodes = new Map< number, SpatialNode >()
  const childrenOf = new Map< number, number[] >()
  const parentOf = new Map< number, number >()

  const addNode = ( localID: number, expressID: number, typeID: number ) => {

    if ( !nodes.has( localID ) ) {
      nodes.set( localID, {
        localID,
        expressID,
        typeID,
        depth: 0,
        children: [],
      } )
    }
  }

  const spatialTypes = [
    IfcProject, IfcSite, IfcBuilding, IfcBuildingStorey, IfcSpace,
  ]

  for ( const type of spatialTypes ) {

    for ( const expressID of model.expressIDsOfTypes( type ) ) {

      const localID = model.resolveExpressID( expressID )

      if ( localID === void 0 ) {
        continue
      }

      addNode( localID, expressID, model.typeIDOf( localID ) ?? -1 )
    }
  }

  if ( nodes.size === 0 ) {
    return 0
  }

  for ( const expressID of model.expressIDsOfTypes( IfcRelAggregates ) ) {

    const relLocalID = model.resolveExpressID( expressID )

    if ( relLocalID === void 0 ) {
      continue
    }

    try {

      await ensure_( model, relLocalID )
      const rel = model.getElementByLocalID( relLocalID )

      if ( rel === void 0 ) {
        continue
      }

      const relatingID = rel.extractReferenceLocalID(
          REL_AGGREGATES_RELATING[ 0 ],
          REL_AGGREGATES_RELATING[ 1 ],
          REL_AGGREGATES_RELATING[ 2 ],
          false )

      if ( relatingID === null || !nodes.has( relatingID ) ) {
        continue
      }

      rel.forEachReferenceInField(
          REL_AGGREGATES_RELATED[ 0 ],
          REL_AGGREGATES_RELATED[ 1 ],
          REL_AGGREGATES_RELATED[ 2 ],
          ( relatedExpressID ) => {

            if ( relatedExpressID === void 0 ) {
              return true
            }

            const relatedID = model.resolveExpressID( relatedExpressID )

            if ( relatedID === void 0 || !nodes.has( relatedID ) ) {
              return true
            }

            const list = childrenOf.get( relatingID ) ?? []
            list.push( relatedID )
            childrenOf.set( relatingID, list )
            parentOf.set( relatedID, relatingID )
            return true
          } )
    } catch {
      // One bad relationship must not kill the preview.
    }
  }

  const contained = new Map< number, number[] >()

  for ( const expressID of model.expressIDsOfTypes(
      IfcRelContainedInSpatialStructure ) ) {

    const relLocalID = model.resolveExpressID( expressID )

    if ( relLocalID === void 0 ) {
      continue
    }

    try {

      await ensure_( model, relLocalID )
      const rel = model.getElementByLocalID( relLocalID )

      if ( rel === void 0 ) {
        continue
      }

      const structureID = rel.extractReferenceLocalID(
          REL_CONTAINED_RELATING[ 0 ],
          REL_CONTAINED_RELATING[ 1 ],
          REL_CONTAINED_RELATING[ 2 ],
          false )

      if ( structureID === null || !nodes.has( structureID ) ) {
        continue
      }

      const products: number[] = []

      rel.forEachReferenceInField(
          REL_CONTAINED_RELATED[ 0 ],
          REL_CONTAINED_RELATED[ 1 ],
          REL_CONTAINED_RELATED[ 2 ],
          ( productExpressID ) => {

            if ( productExpressID === void 0 ) {
              return true
            }

            const productID = model.resolveExpressID( productExpressID )

            if ( productID !== void 0 ) {
              products.push( productID )
            }

            return true
          } )

      if ( products.length > 0 ) {
        const existing = contained.get( structureID ) ?? []
        existing.push( ...products )
        contained.set( structureID, existing )
      }
    } catch {
      // Preview must never break open.
    }
  }

  for ( const [parent, kids] of childrenOf ) {
    const node = nodes.get( parent )

    if ( node !== void 0 ) {
      node.children = kids
    }
  }

  const roots: number[] = []

  for ( const localID of nodes.keys() ) {

    if ( !parentOf.has( localID ) ) {
      roots.push( localID )
    }
  }

  if ( roots.length === 0 ) {
    roots.push( ...nodes.keys() )
  }

  const queue = roots.slice()
  const queued = new Set< number >( roots )
  let maxDepth = 0

  while ( queue.length > 0 ) {

    const id = queue.shift() as number
    const node = nodes.get( id )

    if ( node === void 0 ) {
      continue
    }

    const parentID = parentOf.get( id )
    node.depth = parentID === void 0 ? 0 : ( nodes.get( parentID )?.depth ?? 0 ) + 1
    maxDepth = Math.max( maxDepth, node.depth )

    for ( const childID of node.children ) {

      if ( queued.has( childID ) ) {
        continue
      }

      queued.add( childID )
      queue.push( childID )
    }
  }

  const placementCache = new Map< number, Mat4 | undefined >()

  for ( const node of nodes.values() ) {

    try {

      // IfcProject is an IfcContext, not an IfcProduct — field 5 is
      // not ObjectPlacement.
      if ( node.typeID !== EntityTypesIfc.IFCPROJECT ) {

        node.placement =
          await productTransform_( model, node.localID, placementCache )
        node.origin = node.placement !== void 0 ?
          originOf_( node.placement ) : void 0
      }

      if ( STOREY_TYPES.has( node.typeID ) ) {

        await ensure_( model, node.localID )
        const entity = model.getElementByLocalID( node.localID )

        if ( entity !== void 0 ) {
          const elevation = entity.extractNumber(
              STOREY_ELEVATION[ 0 ],
              STOREY_ELEVATION[ 1 ],
              STOREY_ELEVATION[ 2 ],
              true )

          if ( elevation !== null ) {
            node.elevation = elevation
          }
        }
      }
    } catch {
      // Keep walking.
    }
  }

  const productOrigins = new Map< number, [number, number, number][] >()

  for ( const [structureID, products] of contained ) {

    const stride = Math.max( 1, Math.floor( products.length / PRODUCT_SAMPLE ) )
    const origins: [number, number, number][] = []

    for ( let i = 0; i < products.length && origins.length < PRODUCT_SAMPLE; i += stride ) {

      try {
        const transform =
          await productTransform_( model, products[ i ], placementCache )

        if ( transform !== void 0 ) {
          origins.push( originOf_( transform ) )
        }
      } catch {
        // Skip one product.
      }
    }

    if ( origins.length > 0 ) {
      productOrigins.set( structureID, origins )
    }
  }

  const storeysByParent = new Map< number | string, SpatialNode[] >()

  for ( const node of nodes.values() ) {

    if ( !STOREY_TYPES.has( node.typeID ) || node.elevation === void 0 ) {
      continue
    }

    const parentKey = parentOf.get( node.localID ) ?? 'root'
    const group = storeysByParent.get( parentKey ) ?? []
    group.push( node )
    storeysByParent.set( parentKey, group )
  }

  const storeyHeight = new Map< number, number >()

  for ( const group of storeysByParent.values() ) {

    group.sort( ( a, b ) => ( a.elevation ?? 0 ) - ( b.elevation ?? 0 ) )

    for ( let i = 0; i < group.length; ++i ) {

      const here = group[ i ].elevation ?? 0
      const next = group[ i + 1 ]?.elevation
      let height = next !== void 0 && next > here ? next - here : void 0

      if ( height === void 0 ) {

        const samples = productOrigins.get( group[ i ].localID )

        if ( samples !== void 0 && samples.length > 0 ) {

          let minZ = samples[ 0 ][ 2 ]
          let maxZ = samples[ 0 ][ 2 ]

          for ( const origin of samples ) {
            if ( origin[ 2 ] < minZ ) {
              minZ = origin[ 2 ]
            }
            if ( origin[ 2 ] > maxZ ) {
              maxZ = origin[ 2 ]
            }
          }

          height = Math.max( maxZ - minZ, minEdge )
        } else {
          height = minEdge
        }
      }

      storeyHeight.set( group[ i ].localID, height )
    }
  }

  const aabbOf = ( localID: number ): Aabb3 | undefined => {

    const node = nodes.get( localID )

    if ( node === void 0 ) {
      return
    }

    if ( node.aabb !== void 0 ) {
      return node.aabb
    }

    if ( node.computing === true ) {
      return
    }

    node.computing = true

    try {

      const pieces: Aabb3[] = []

      // Where a storey states an Elevation, its floor is the building
      // datum plus that — see the banding block below, which this has to
      // agree with. Under the ordinary authoring it equals the storey's
      // own placement Z; the two only part on files that leave every
      // storey placement on the datum.
      const storeyZ0 =
        STOREY_TYPES.has( node.typeID ) && node.elevation !== void 0 ?
          storeyFloorZ_( localID, node.elevation, nodes, parentOf ) : void 0

      if ( node.origin !== void 0 ) {

        // The placement point contributes this node's XY footprint. For
        // a storey with an Elevation its Z is the DATUM, not its
        // contents, so seeding the band with it would drag every
        // storey's floor down onto the building origin — substitute the
        // banded floor. Non-storeys keep their own Z.
        pieces.push( pointAabb_(
            node.origin[ 0 ],
            node.origin[ 1 ],
            storeyZ0 ?? node.origin[ 2 ] ) )
      }

      const samples = productOrigins.get( localID )

      if ( samples !== void 0 ) {

        for ( const origin of samples ) {
          pieces.push( pointAabb_( ...origin ) )
        }
      }

      for ( const childID of node.children ) {
        const childBox = aabbOf( childID )

        if ( childBox !== void 0 ) {
          pieces.push( childBox )
        }
      }

      let box = unionAabb( ...pieces )

      if ( box !== void 0 && STOREY_TYPES.has( node.typeID ) ) {

        const height = storeyHeight.get( localID )

        // IfcBuildingStorey.Elevation is measured from the BUILDING
        // datum, not from world zero, so a building placed at z=100
        // drew its plates 100 units low. Add the datum back rather than
        // letting the storey's own placement Z replace elevation
        // outright: the two agree under the ordinary authoring (the
        // storey placement is offset from the building BY the
        // elevation), but a file that parks every storey placement on
        // the building datum and carries the height only in Elevation
        // would then collapse all of its plates onto one Z. Storey
        // HEIGHTS stay on elevation deltas — datum-invariant either way,
        // though on a datum tilted out of plumb they over-thicken the
        // plate by 1/cos(tilt) (the floor Z is tilt-correct; see
        // storeyFloorZ_). Left alone: the sample-derived height fallback
        // is already a world-Z span, so one scale cannot serve both, and
        // a tilted building has no horizontal storeys to plate anyway.
        const z0 = storeyZ0 ?? node.origin?.[ 2 ] ?? box.min[ 2 ]
        const z1 = height !== void 0 ? z0 + height : box.max[ 2 ]
        box = {
          min: [box.min[ 0 ], box.min[ 1 ], Math.min( box.min[ 2 ], z0 )],
          max: [box.max[ 0 ], box.max[ 1 ], Math.max( box.max[ 2 ], z1 )],
        }
      }

      node.aabb = box
      return box
    } finally {
      node.computing = false
    }
  }

  for ( const root of roots ) {
    aabbOf( root )
  }

  const emitIDs: number[] = []

  for ( const node of nodes.values() ) {

    if ( !shouldEmitSpatialNode( node.depth, maxDepth, node.typeID ) ) {
      continue
    }

    if ( node.aabb === void 0 ) {
      continue
    }

    if ( node.children.length === 1 ) {

      const child = nodes.get( node.children[ 0 ] )

      if ( child?.aabb !== void 0 &&
          aabbMostlyEqual( node.aabb, child.aabb, COLLAPSE_REL, minEdge ) &&
          shouldEmitSpatialNode( child.depth, maxDepth, child.typeID ) ) {
        continue
      }
    }

    emitIDs.push( node.localID )
  }

  const coordination = coordinationMatrix ??
    fallbackCoordination_( roots, nodes, linearScalingFactor )

  let emitted = 0

  for ( const localID of emitIDs ) {

    const node = nodes.get( localID )

    if ( node?.aabb === void 0 ) {
      continue
    }

    const aabb = padAabb_( node.aabb, minEdge )

    try {

      onMesh( {
        expressID: node.expressID,
        geometryExpressID: -1,
        color: SPATIAL_IMPOSTER_COLOR,
        flatTransformation: mat4MultiplyF64( coordination, aabbBoxMatrix( aabb ) ),
        aabb,
      } )
      ++emitted
    } catch {
      // Preview must never break open.
    }
  }

  return emitted
}


/**
 * World Z of an IfcBuildingStorey's floor: `Elevation` measured up the
 * datum's own +Z from the datum's world origin, where the datum is the
 * nearest ancestor with a resolved placement (the IfcBuilding in a
 * well-formed file).
 *
 * Elevation is a length along the datum's Z, not along world Z, so the
 * datum's whole transform is needed and not just its height — on a
 * building tilted out of plumb the two differ by `cos(tilt)`. Only the
 * Z component is taken, because that is all the banding uses: the plate
 * keeps the XY footprint its placement and contained samples give it.
 * A tilted building's storeys are not horizontal anyway, so the
 * axis-aligned plate is an approximation there by construction — this
 * just stops it being an approximation on the *height* as well.
 *
 * Falls back to a world-relative Elevation (datum at zero, +Z up) when
 * nothing up the chain resolved a placement: the pre-fix behaviour, and
 * the only thing left to anchor on.
 *
 * @param localID The storey.
 * @param elevation The storey's `Elevation`, in source units.
 * @param nodes All walked nodes.
 * @param parentOf Child -> parent.
 * @return {number} The floor's world Z.
 */
function storeyFloorZ_(
    localID: number,
    elevation: number,
    nodes: Map< number, SpatialNode >,
    parentOf: Map< number, number > ): number {

  let id = parentOf.get( localID )

  // Bounded rather than while-truthy: parentOf is built by a BFS and so
  // should be acyclic, but this module treats the aggregate graph as
  // untrusted everywhere else too (see `computing` in aabbOf).
  for ( let hops = 0; id !== void 0 && hops <= nodes.size; ++hops ) {

    const placement = nodes.get( id )?.placement

    if ( placement !== void 0 ) {
      return placement[ TRANSLATION[ 2 ] ] +
        elevation * placement[ LOCAL_Z_WORLD_Z ]
    }

    id = parentOf.get( id )
  }

  return elevation
}


/**
 * The durable coordination frame, derived the way the preview channels
 * derive theirs but anchored on the spatial root's centre instead of the
 * first extracted geometry's first point: identity placement + that
 * anchor is exactly `deriveCoordinationF64`'s input contract, so the
 * quantized model-zero policy (no recentre inside
 * LARGE_COORDINATE_BUDGET_M, snap to COORDINATION_SNAP_M beyond) applies
 * unchanged. Used only when no preview instance latched a frame first.
 *
 * Best-effort by construction, and the failure has two shapes. Beyond
 * LARGE_COORDINATE_BUDGET_M both sides snap to COORDINATION_SNAP_M and
 * agree as long as the spatial root and the first geometry share a grid
 * cell. Worse: the anchor comes from `placementTransform_`, which reads
 * IfcLocalPlacement chains and never looks at geometry — so a file that
 * keeps identity placements and bakes absolute coordinates into the
 * vertices (civil/GIS exports do this) has a root box near zero and gets
 * no recentre at all, while the durable walk anchors tens of km out and
 * does. That is a full site-offset, not a one-cell disagreement. Whenever
 * the preview channel latched a frame we use it instead, precisely
 * because it was derived from real geometry.
 *
 * @param roots Root spatial node local IDs.
 * @param nodes The walked spatial nodes.
 * @param linearScalingFactor Source units -> metres.
 * @return {number[]} The coordination matrix.
 */
function fallbackCoordination_(
    roots: number[],
    nodes: Map< number, SpatialNode >,
    linearScalingFactor: number ): number[] {

  const rootBox = unionAabb( ...roots.map( ( id ) => nodes.get( id )?.aabb ) )

  const anchor = rootBox !== void 0 ? {
    x: ( rootBox.min[ 0 ] + rootBox.max[ 0 ] ) * 0.5,
    y: ( rootBox.min[ 1 ] + rootBox.max[ 1 ] ) * 0.5,
    z: ( rootBox.min[ 2 ] + rootBox.max[ 2 ] ) * 0.5,
  } : { x: 0, y: 0, z: 0 }

  return deriveCoordinationF64(
      void 0, anchor, NORMALIZE_MAT_F64, sanitizeScale_( linearScalingFactor ) )
}
