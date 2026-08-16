import EntityTypesIfc from '../../ifc/ifc4_gen/entity_types_ifc.gen'
import ParsingBuffer from '../../parsing/parsing_buffer'
import type { PreviewMeshPayload } from './streamed_preview_channel'

/* eslint-disable no-magic-numbers */

/** Emit every Nth point-list AABB — sparse on purpose. */
const IMPOSTER_STRIDE = 8

/** Skip lists with fewer than this many points (noise). */
const MIN_POINTS = 8

/** Cap so one huge tessellation list cannot stall the parse yield. */
const SCAN_BUDGET_BYTES = 128 * 1024

const IMPOSTER_COLOR = { x: 0.45, y: 0.75, z: 0.95, w: 0.35 }

const CHAR_HASH = 0x23
const CHAR_EQ = 0x3d
const CHAR_LPAREN = 0x28


export interface Aabb3 {
  min: [number, number, number]
  max: [number, number, number]
}


/**
 * Min/max of every STEP real triple in `bytes`. Used for
 * IfcCartesianPointList3D bodies: the numbers live in the record, so a
 * store-backed parse can emit an AABB without hydrating the entity or
 * paging a closure.
 *
 * @param bytes The record's source bytes (window view; do not retain).
 * @return {Aabb3 | null} Bounds, or null if fewer than MIN_POINTS triples.
 */
export function aabbFromStepReals( bytes: Uint8Array ): Aabb3 | null {

  let minX = Infinity
  let minY = Infinity
  let minZ = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let maxZ = -Infinity
  let points = 0
  let axis = 0
  let x = 0
  let y = 0

  // Skip `#id=TYPENAME(` so the express ID is not a phantom first real.
  let start = 0
  const end = Math.min( bytes.length, SCAN_BUDGET_BYTES )

  if ( bytes[ start ] === CHAR_HASH ) {

    while ( start < end && bytes[ start ] !== CHAR_EQ ) {
      ++start
    }

    if ( start < end ) {
      ++start
    }
  }

  while ( start < end && bytes[ start ] !== CHAR_LPAREN ) {
    ++start
  }

  const input = new ParsingBuffer( bytes, start, end )

  while ( !input.finished ) {

    const value = input.readReal()

    if ( value === void 0 ) {
      input.step()
      continue
    }

    if ( axis === 0 ) {
      x = value
      axis = 1
    } else if ( axis === 1 ) {
      y = value
      axis = 2
    } else {
      if ( x < minX ) {
        minX = x
      }
      if ( y < minY ) {
        minY = y
      }
      if ( value < minZ ) {
        minZ = value
      }
      if ( x > maxX ) {
        maxX = x
      }
      if ( y > maxY ) {
        maxY = y
      }
      if ( value > maxZ ) {
        maxZ = value
      }
      ++points
      axis = 0
    }
  }

  if ( points < MIN_POINTS || !Number.isFinite( minX ) ) {
    return null
  }

  return { min: [minX, minY, minZ], max: [maxX, maxY, maxZ] }
}


/**
 * Column-major 4x4: IFC Z-up box → Y-up, translated to the box centre
 * and scaled to its size. Share instances a shared unit cube with this.
 *
 * @param aabb The IFC-space bounds.
 * @return {number[]} 16-element matrix.
 */
export function aabbToPreviewMatrix( aabb: Aabb3 ): number[] {

  const sx = Math.max( aabb.max[ 0 ] - aabb.min[ 0 ], 1e-3 )
  const sy = Math.max( aabb.max[ 1 ] - aabb.min[ 1 ], 1e-3 )
  const sz = Math.max( aabb.max[ 2 ] - aabb.min[ 2 ], 1e-3 )
  const cx = ( aabb.min[ 0 ] + aabb.max[ 0 ] ) * 0.5
  const cy = ( aabb.min[ 1 ] + aabb.max[ 1 ] ) * 0.5
  const cz = ( aabb.min[ 2 ] + aabb.max[ 2 ] ) * 0.5

  // Z-up → Y-up, then scale/centre for a unit cube.
  return [
    sx, 0, 0, 0,
    0, sz, 0, 0,
    0, 0, sy, 0,
    cx, cz, -cy, 1,
  ]
}


/**
 * Stateful filter: every IMPOSTER_STRIDE-th IfcCartesianPointList3D
 * becomes a tiny preview payload. The view `recordBytes` is into the
 * sliding parse window; do not retain it.
 *
 * @param onMesh Preview consumer (Share's ON_PREVIEW_MESH).
 * @return A callback matching onRecordIndexed.
 */
export function makeParseAabbImposter(
    onMesh: ( mesh: PreviewMeshPayload ) => void ):
    ( localID: number,
      expressID: number,
      typeID: number | undefined,
      recordBytes?: Uint8Array ) => void {

  let seen = 0

  return ( _localID, expressID, typeID, recordBytes ) => {

    if ( typeID !== EntityTypesIfc.IFCCARTESIANPOINTLIST3D ||
        recordBytes === void 0 ) {
      return
    }

    ++seen

    if ( seen % IMPOSTER_STRIDE !== 0 ) {
      return
    }

    try {

      const aabb = aabbFromStepReals( recordBytes )

      if ( aabb === null ) {
        return
      }

      onMesh( {
        expressID,
        geometryExpressID: -1,
        color: IMPOSTER_COLOR,
        flatTransformation: aabbToPreviewMatrix( aabb ),
        aabb,
      } )
    } catch {
      // Preview must never break the parse.
    }
  }
}
