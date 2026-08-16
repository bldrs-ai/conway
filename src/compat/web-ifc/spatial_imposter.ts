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
import type { Aabb3 } from './parse_aabb_imposter'
import { aabbToPreviewMatrix } from './parse_aabb_imposter'
import type { PreviewMeshPayload } from './streamed_preview_channel'


/* eslint-disable no-magic-numbers */

/** Black, almost transparent — Share honours `w` as opacity. */
export const SPATIAL_IMPOSTER_COLOR = { x: 0, y: 0, z: 0, w: 0.3 }

/** Sample this many contained-product placements per spatial node. */
const PRODUCT_SAMPLE = 32

/** Collapse a parent whose box matches its only child this closely. */
const COLLAPSE_REL = 0.15

/** Minimum box edge (metres / source units) so a point origin still draws. */
const MIN_EDGE = 1

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
 * @return {boolean} True if they match.
 */
export function aabbMostlyEqual( a: Aabb3, b: Aabb3, rel: number = COLLAPSE_REL ): boolean {

  for ( let axis = 0; axis < 3; ++axis ) {

    const span = Math.max(
        a.max[ axis ] - a.min[ axis ],
        b.max[ axis ] - b.min[ axis ],
        MIN_EDGE )
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


function padAabb_( box: Aabb3 ): Aabb3 {

  const min: [number, number, number] = [box.min[ 0 ], box.min[ 1 ], box.min[ 2 ]]
  const max: [number, number, number] = [box.max[ 0 ], box.max[ 1 ], box.max[ 2 ]]

  for ( let axis = 0; axis < 3; ++axis ) {

    if ( max[ axis ] - min[ axis ] < MIN_EDGE ) {
      const mid = ( min[ axis ] + max[ axis ] ) * 0.5
      min[ axis ] = mid - MIN_EDGE * 0.5
      max[ axis ] = mid + MIN_EDGE * 0.5
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
 * @param model Parsed IFC model (windowed or resident).
 * @param onMesh Preview consumer.
 * @return {Promise<number>} Boxes emitted.
 */
export async function emitSpatialStructureImposters(
    model: IfcStepModel,
    onMesh: ( mesh: PreviewMeshPayload ) => void ): Promise< number > {

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
        contained.set( structureID, products )
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
    queue.push( ...node.children )
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

  const storeys = [...nodes.values()].
      filter( ( node ) => STOREY_TYPES.has( node.typeID ) && node.elevation !== void 0 ).
      sort( ( a, b ) => ( a.elevation ?? 0 ) - ( b.elevation ?? 0 ) )

  const storeyHeight = new Map< number, number >()

  for ( let i = 0; i < storeys.length; ++i ) {

    const here = storeys[ i ].elevation ?? 0
    const next = storeys[ i + 1 ]?.elevation
    const height = next !== void 0 && next > here ? next - here : MIN_EDGE
    storeyHeight.set( storeys[ i ].localID, height )
  }

  const aabbOf = ( localID: number ): Aabb3 | undefined => {

    const node = nodes.get( localID )

    if ( node === void 0 ) {
      return
    }

    if ( node.aabb !== void 0 ) {
      return node.aabb
    }

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
      const z0 = node.elevation ?? box.min[ 2 ]
      const z1 = height !== void 0 ? z0 + height : box.max[ 2 ]
      box = {
        min: [box.min[ 0 ], box.min[ 1 ], Math.min( box.min[ 2 ], z0 )],
        max: [box.max[ 0 ], box.max[ 1 ], Math.max( box.max[ 2 ], z1 )],
      }
    }

    node.aabb = box
    return box
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
          aabbMostlyEqual( node.aabb, child.aabb ) &&
          shouldEmitSpatialNode( child.depth, maxDepth, child.typeID ) ) {
        continue
      }
    }

    emitIDs.push( node.localID )
  }

  let emitted = 0

  for ( const localID of emitIDs ) {

    const node = nodes.get( localID )

    if ( node?.aabb === void 0 ) {
      continue
    }

    const aabb = padAabb_( node.aabb )

    try {

      onMesh( {
        expressID: node.expressID,
        geometryExpressID: -1,
        color: SPATIAL_IMPOSTER_COLOR,
        flatTransformation: aabbToPreviewMatrix( aabb ),
        aabb,
        solid: true,
      } )
      ++emitted
    } catch {
      // Preview must never break open.
    }
  }

  return emitted
}
