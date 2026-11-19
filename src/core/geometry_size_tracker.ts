import { CanonicalMesh, CanonicalMeshType } from './canonical_mesh'


/* The same per-mesh measure as the stores' calculateGeometrySize(): vertices
 * are stored as doubles, indices as 32-bit. */
// eslint-disable-next-line no-magic-numbers
const BYTES_PER_VERTEX_ELEMENT = 8
// eslint-disable-next-line no-magic-numbers
const BYTES_PER_INDEX_ELEMENT = 4


/**
 * The geometry payload one store entry holds, in bytes — the term
 * calculateGeometrySize() sums. 0 for anything that is not buffer geometry.
 *
 * @param mesh The entry's mesh.
 * @return {number} Bytes.
 */
export function canonicalMeshBytes( mesh: CanonicalMesh ): number {

  if ( mesh.type !== CanonicalMeshType.BUFFER_GEOMETRY ) {
    return 0
  }

  const geometry = mesh.geometry

  return geometry.GetVertexDataSize() * BYTES_PER_VERTEX_ELEMENT +
    geometry.GetIndexDataSize() * BYTES_PER_INDEX_ELEMENT
}


/**
 * A running count of the geometry bytes a store holds, and its high-water
 * mark, kept as entries come and go rather than summed on demand.
 *
 * **Why.** `Statistics.geometryMemory` was set once, from
 * calculateGeometrySize() at open. A deferred (demand) open builds nothing
 * until the pump runs, so on that path — Share's, for every IFC and STEP
 * model — it read 0 for the whole load. Re-summing after each pump call is
 * not an option: calculateGeometrySize() makes two wasm calls per entry, and
 * a big model pumps thousands of batches over tens of thousands of entries.
 * And the store's size at the END is not the answer either: under a
 * residency budget (GeometryResidency) cold entries are evicted as the pump
 * goes, so what is left is whatever happened to be resident last. The peak
 * of a running count is the model's geometry footprint, measured the way
 * calculateGeometrySize() measures it, at O(1) per entry.
 *
 * Entries are counted per key, as calculateGeometrySize() does: a native
 * cached under two local IDs counts twice in both, so the two agree.
 *
 * **Deferred entries.** STEP's staged face tessellation (the MT build with a
 * scalable allocator) stores a mesh BEFORE its triangles exist: the face's
 * job is queued and only appended to the native at the next
 * finalizeStagedFaces(), which never passes through the store again. Counting
 * such a mesh at add time measures it empty, permanently. notePending()
 * queues the entry instead, and settle() — called right after each flush —
 * measures what has landed. An entry removed while still pending is dropped
 * uncounted (its native may already be freed).
 */
export class GeometrySizeTracker {

  private readonly bytesByKey_ = new Map< number, number >()
  private readonly pending_ = new Map< number, CanonicalMesh >()
  private bytes_ = 0
  private peakBytes_ = 0

  /**
   * @return {number} Bytes held now.
   */
  public get bytes(): number {
    return this.bytes_
  }

  /**
   * @return {number} The most bytes held at once since construction.
   */
  public get peakBytes(): number {
    return this.peakBytes_
  }

  /**
   * Count an entry, replacing whatever was counted under its key.
   *
   * @param key The entry's local ID.
   * @param mesh The mesh stored under it.
   */
  public noteAdded( key: number, mesh: CanonicalMesh ): void {

    this.noteRemoved( key )

    const bytes = canonicalMeshBytes( mesh )

    if ( bytes === 0 ) {
      return
    }

    this.bytesByKey_.set( key, bytes )
    this.bytes_ += bytes

    if ( this.bytes_ > this.peakBytes_ ) {
      this.peakBytes_ = this.bytes_
    }
  }

  /**
   * Queue an entry whose native may still have staged work outstanding, to
   * be measured at the next settle(). Replaces whatever was counted, or
   * queued, under its key.
   *
   * @param key The entry's local ID.
   * @param mesh The mesh stored under it.
   */
  public notePending( key: number, mesh: CanonicalMesh ): void {

    this.noteRemoved( key )
    this.pending_.set( key, mesh )
  }

  /**
   * Measure every queued entry, now that its staged work has landed. Must
   * only be called when no staged job targets a queued native, i.e. right
   * after a flush.
   */
  public settle(): void {

    if ( this.pending_.size === 0 ) {
      return
    }

    // Count all of them before taking the peak: they landed together.
    for ( const [key, mesh] of this.pending_ ) {

      const bytes = canonicalMeshBytes( mesh )

      if ( bytes !== 0 ) {
        this.bytesByKey_.set( key, bytes )
        this.bytes_ += bytes
      }
    }

    this.pending_.clear()

    if ( this.bytes_ > this.peakBytes_ ) {
      this.peakBytes_ = this.bytes_
    }
  }

  /**
   * Stop counting an entry. Uses the bytes recorded when it was added, so it
   * is safe to call after the native has been freed, and a no-op for a key
   * never counted. A pending entry is dropped without being measured.
   *
   * @param key The entry's local ID.
   */
  public noteRemoved( key: number ): void {

    this.pending_.delete( key )

    const bytes = this.bytesByKey_.get( key )

    if ( bytes === void 0 ) {
      return
    }

    this.bytesByKey_.delete( key )
    this.bytes_ -= bytes
  }
}
