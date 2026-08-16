import EntityTypesIfc from '../../ifc/ifc4_gen/entity_types_ifc.gen'
import type { PreviewMeshPayload } from './streamed_preview_channel'

/* eslint-disable no-magic-numbers */

/** Emit every Nth point-list AABB — sparse on purpose. */
const IMPOSTER_STRIDE = 8

/** Skip lists with fewer than this many points (noise). */
const MIN_POINTS = 8

/** Pale cyan, see-through — reads as a ghost, not finished geom. */
const IMPOSTER_COLOR = { x: 0.45, y: 0.75, z: 0.95, w: 0.35 }

const CHAR_0 = 0x30
const CHAR_9 = 0x39
const CHAR_MINUS = 0x2d
const CHAR_PLUS = 0x2b
const CHAR_DOT = 0x2e
const CHAR_E = 0x45
const CHAR_e = 0x65
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

  const end = bytes.length
  // Skip `#id=TYPENAME(` so the express ID is not a phantom first real.
  let cursor = 0

  if ( bytes[ cursor ] === CHAR_HASH ) {

    while ( cursor < end && bytes[ cursor ] !== CHAR_EQ ) {
      ++cursor
    }

    if ( cursor < end ) {
      ++cursor
    }
  }

  while ( cursor < end && bytes[ cursor ] !== CHAR_LPAREN ) {
    ++cursor
  }

  while ( cursor < end ) {

    const parsed = parseStepReal_( bytes, cursor, end )

    if ( parsed === null ) {
      ++cursor
      continue
    }

    cursor = parsed.next
    const value = parsed.value

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

  // Z-up → Y-up (same as StreamedPreviewChannel.NORMALIZE_MAT).
  return [
    sx, 0, 0, 0,
    0, sz, 0, 0,
    0, 0, sy, 0,
    cx, cz, -cy, 1,
  ]
}


/**
 * Stateful filter: every IMPOSTER_STRIDE-th IfcCartesianPointList3D
 * becomes a tiny preview payload. Synchronous and allocation-light —
 * safe on the parse's onRecordIndexed seam. The view `recordBytes`
 * is into the sliding parse window; do not retain it.
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


/**
 * @param bytes
 * @param start
 * @param end
 * @return The real and the cursor after it, or null if `start` is not
 * the start of a number.
 */
function parseStepReal_(
    bytes: Uint8Array,
    start: number,
    end: number ): { value: number, next: number } | null {

  let cursor = start
  const first = bytes[ cursor ]

  if ( first !== CHAR_MINUS && first !== CHAR_PLUS && first !== CHAR_DOT &&
      ( first < CHAR_0 || first > CHAR_9 ) ) {
    return null
  }

  if ( first === CHAR_MINUS || first === CHAR_PLUS ) {
    ++cursor
    if ( cursor >= end ) {
      return null
    }
  }

  const digitOrDot = bytes[ cursor ]

  if ( digitOrDot !== CHAR_DOT && ( digitOrDot < CHAR_0 || digitOrDot > CHAR_9 ) ) {
    return null
  }

  while ( cursor < end ) {

    const ch = bytes[ cursor ]

    if ( ( ch >= CHAR_0 && ch <= CHAR_9 ) || ch === CHAR_DOT ) {
      ++cursor
      continue
    }

    if ( ch === CHAR_E || ch === CHAR_e ) {
      ++cursor
      if ( cursor < end &&
          ( bytes[ cursor ] === CHAR_MINUS || bytes[ cursor ] === CHAR_PLUS ) ) {
        ++cursor
      }
      while ( cursor < end && bytes[ cursor ] >= CHAR_0 && bytes[ cursor ] <= CHAR_9 ) {
        ++cursor
      }
    }

    break
  }

  const value = Number.parseFloat(
      String.fromCharCode( ...bytes.subarray( start, cursor ) ) )

  if ( !Number.isFinite( value ) ) {
    return null
  }

  return { value, next: cursor }
}
