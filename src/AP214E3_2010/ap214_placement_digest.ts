import crypto from 'crypto'
import { CanonicalMeshType } from '../core/canonical_mesh'
import { AP214SceneBuilder } from './ap214_scene_builder'


/**
 * Elements in a 4x4 placement matrix.
 *
 * Named because `no-magic-numbers` is error level here, and because the
 * identity below has to be exactly this long: a scene-root geometry node has
 * no parent transform at all, and it is canonicalised to identity rather
 * than to a shorter "absent" token (see {@link placementRecord}).
 */
const MATRIX_ELEMENT_COUNT = 16

/**
 * Significant decimal digits each matrix element is rounded to before it
 * enters the hash.
 *
 * Absolute transforms are composed inside wasm by repeated 4x4 multiply, so
 * for a given walk they are bit-for-bit reproducible and no rounding is
 * strictly needed. The rounding is margin, and it is free: quantisation is a
 * pure function of the double, so it can only ever collapse a difference,
 * never invent one. Twelve digits leaves ~1e-9 mm of resolution on a
 * metre-scale coordinate — four orders coarser than a double's ulp there, and
 * many orders finer than any real placement change.
 */
const PLACEMENT_SIGNIFICANT_DIGITS = 12

/** Column-major 4x4 identity, the placement of a geometry node with no parent. */
const IDENTITY_TRANSFORM: readonly number[] =
  Array.from( { length: MATRIX_ELEMENT_COUNT },
      ( _, index ) => ( index % 5 === 0 ? 1 : 0 ) )


/**
 * Render one matrix element as a canonical decimal string.
 *
 * `-0` and `0` collapse to the same text: they are the same placement, and
 * which one a multiply produces is not a fact about where geometry landed.
 * Non-finite values are passed through as their own text rather than
 * discarded, so a NaN in a transform is visible in the digest instead of
 * hashing the same as a zero.
 *
 * @param value The matrix element.
 * @return {string} Canonical text for that element.
 */
export function canonicalPlacementValue( value: number ): string {

  if ( !Number.isFinite( value ) ) {
    return `${value}`
  }

  if ( value === 0 ) {
    return '0'
  }

  return `${Number( value.toPrecision( PLACEMENT_SIGNIFICANT_DIGITS ) )}`
}


/**
 * Build the canonical record for one placed instance: where it landed, and
 * which assembly occurrence put it there.
 *
 * The occurrence path is part of the record because a placement is only half
 * the identity — the same world transform reached through a different NAUO
 * chain is a different assembly structure, and that is inside the class of
 * change this column exists to catch (`REPRESENTATION_RELATIONSHIP` /
 * `MAPPED_ITEM` handling, where the transform comes from the reference
 * rather than the definition).
 *
 * A geometry node with no parent transform records identity rather than an
 * "absent" marker, so moving geometry between the scene root and an identity
 * transform node — which changes nothing about where it is drawn — does not
 * churn the digest.
 *
 * @param absoluteTransform The instance's absolute transform, or undefined
 * for a geometry node parented directly to the scene root.
 * @param occurrencePath NAUO express ids, root->this placement.
 * @return {string} The canonical record text.
 */
export function placementRecord(
    absoluteTransform: readonly number[] | undefined,
    occurrencePath: readonly number[] ): string {

  const matrix = absoluteTransform ?? IDENTITY_TRANSFORM

  return `${occurrencePath.join( '/' )}|${
    matrix.map( canonicalPlacementValue ).join( ' ' )}`
}


/**
 * Hash a set of placement records into one digest cell.
 *
 * Sorted, so the value does not depend on the order the scene was walked in
 * — which is the whole point of the column. AP214 demand extraction cuts a
 * model into units whose count and boundaries change with
 * `demandItemsPerUnit` and with the pump's wall-clock budget, and a digest
 * that moved when the scheduler moved would be worse than no digest at all.
 * Duplicates are kept, so an instance count change is a digest change.
 *
 * @param records Placement records for one geometry definition.
 * @return {string} Hex sha1 over the sorted records.
 */
function hashPlacementRecords( records: string[] ): string {

  records.sort()

  return crypto.createHash( 'sha1' ).update( records.join( '\n' ) ).digest( 'hex' )
}


/**
 * Compute the placement digest of every mesh definition placed in a scene.
 *
 * This is the second axis of the AP214 regression digest (conway#583). The
 * `Hash` column answers "was this tessellated the same way"; this answers
 * "did every copy of it land in the same place, under the same occurrence".
 * The two are independent: the mapped-item fixture in `data/` relocates five
 * solids by 500 mm with byte-identical OBJ hashes, which is exactly the
 * failure any change to walk order, transform-stack handling or assembly
 * traversal risks — and exactly what the digest could not see before.
 *
 * Only `BUFFER_GEOMETRY` meshes are considered, matching the rows the digest
 * writes. A definition that is never placed gets no entry, which the caller
 * writes as an empty cell — distinguishable from a definition placed once at
 * identity, which gets a hash.
 *
 * Design lineage: this is the placement-aware parity hash conway#582 ran as
 * PR-local evidence, promoted into the digest, less the vertex and index
 * buffers — the `Hash` column already carries those, and reading them back
 * out of the wasm heap is unreliable in the pthreads build (conway#584).
 * It is also the `step-regression.md` §Determinism "sort the hash set"
 * recommendation, applied per definition row rather than to the whole model
 * so the value keeps a stable key.
 *
 * @param scene The extracted scene.
 * @return {Map<number, string>} Mesh local id -> hex sha1 placement digest.
 */
export function placementDigests( scene: AP214SceneBuilder ): Map<number, string> {

  const recordsByGeometry = new Map<number, string[]>()

  for ( const [absoluteTransform, , mesh, , , occurrencePath] of
    scene.walkWithOccurrence() ) {

    if ( mesh.type !== CanonicalMeshType.BUFFER_GEOMETRY ) {
      continue
    }

    const records = recordsByGeometry.get( mesh.localID )
    const record = placementRecord( absoluteTransform, occurrencePath )

    if ( records === void 0 ) {
      recordsByGeometry.set( mesh.localID, [record] )
    } else {
      records.push( record )
    }
  }

  const result = new Map<number, string>()

  for ( const [localID, records] of recordsByGeometry ) {
    result.set( localID, hashPlacementRecords( records ) )
  }

  return result
}
