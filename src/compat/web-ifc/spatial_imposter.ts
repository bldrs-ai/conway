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
const STOREY_ELEVATION = [9, 9, 6] as const


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
 * @param minEdge Span floor in source units (see MIN_EDGE_M).
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
 * World translation of an IfcLocalPlacement chain (rotation ignored —
 * enough for the axis-aligned storey plates this first pass draws).
 *
 * @param model The model.
 * @param placementLocalID IfcObjectPlacement local ID.
 * @param cache Memo.
 * @return {Promise<[number, number, number] | undefined>} World origin.
 */
async function placementOrigin_(
    model: IfcStepModel,
    placementLocalID: number,
    cache: Map< number, [number, number, number] | undefined > ):
    Promise< [number, number, number] | undefined > {

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

    let local: [number, number, number] = [0, 0, 0]

    if ( relativeID !== null ) {

      await ensure_( model, relativeID )
      const relative = model.getElementByLocalID( relativeID )

      if ( relative !== void 0 ) {

        const locationID = relative.extractReferenceLocalID(
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
            local = [coords[ 0 ], coords[ 1 ], coords[ 2 ] ?? 0]
          }
        }
      }
    }

    const parentID = entity.extractReferenceLocalID(
        LOCAL_PLACEMENT_REL_TO[ 0 ],
        LOCAL_PLACEMENT_REL_TO[ 1 ],
        LOCAL_PLACEMENT_REL_TO[ 2 ],
        true )

    if ( parentID === null ) {
      cache.set( placementLocalID, local )
      return local
    }

    const parent = await placementOrigin_( model, parentID, cache )

    if ( parent === void 0 ) {
      cache.set( placementLocalID, local )
      return local
    }

    const world: [number, number, number] = [
      parent[ 0 ] + local[ 0 ],
      parent[ 1 ] + local[ 1 ],
      parent[ 2 ] + local[ 2 ],
    ]

    cache.set( placementLocalID, world )
    return world
  } catch {
    return
  }
}


async function productOrigin_(
    model: IfcStepModel,
    localID: number,
    cache: Map< number, [number, number, number] | undefined > ):
    Promise< [number, number, number] | undefined > {

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

  return placementOrigin_( model, placementID, cache )
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

  const originCache = new Map< number, [number, number, number] | undefined >()

  for ( const node of nodes.values() ) {

    try {

      // IfcProject is an IfcContext, not an IfcProduct — field 5 is
      // not ObjectPlacement.
      if ( node.typeID !== EntityTypesIfc.IFCPROJECT ) {
        node.origin = await productOrigin_( model, node.localID, originCache )
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
        const origin = await productOrigin_( model, products[ i ], originCache )

        if ( origin !== void 0 ) {
          origins.push( origin )
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

      if ( node.origin !== void 0 ) {
        pieces.push( pointAabb_( ...node.origin ) )
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
        // drew its plates 100 units low. The placement chain's world Z
        // is the datum-free answer; elevation is only the fallback for
        // a storey with no usable placement. Storey HEIGHTS above stay
        // on elevation deltas — those are datum-invariant.
        const z0 = node.origin?.[ 2 ] ?? node.elevation ?? box.min[ 2 ]
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
 * The durable coordination frame, derived the way the preview channels
 * derive theirs but anchored on the spatial root's centre instead of the
 * first extracted geometry's first point: identity placement + that
 * anchor is exactly `deriveCoordinationF64`'s input contract, so the
 * quantized model-zero policy (no recentre inside
 * LARGE_COORDINATE_BUDGET_M, snap to COORDINATION_SNAP_M beyond) applies
 * unchanged. Used only when no preview instance latched a frame first.
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
