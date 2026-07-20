import { ChunkedPool, ChunkSpan } from './chunked_pool'


/**
 * Refcounted **assets** resident in a {@link ChunkedPool} — the sharing layer
 * of the memory system (see `src/core/mem/`).
 *
 * The general relationship this models: many **instances** reference shared
 * **assets** (the definition/occurrence split that recurs across CAD — STEP
 * AP214 literally names it *occurrence*). Concretely for geometry: products
 * are instances, representation geometry is the asset, and mapped items make
 * many products share one representation. But nothing here is
 * geometry-specific — an asset is any refcounted, chunk-resident payload
 * (a parsed property block, a decoded sidecar, a texture).
 *
 * Storage is keyed and refcounted on the **asset**, so the correctness rule
 * for shared data falls out structurally: releasing one instance's reference
 * never frees an asset another instance still holds; chunks return to the
 * pool only on the last release. (Evicting product A must not free the
 * representation product B still renders — the mapped-item bug a
 * per-instance store invites.)
 *
 * Instance-level bookkeeping (which assets an instance holds, demand
 * priorities, eviction order) belongs to the layer above — see
 * `GeometryTilePool` for the geometry narrowing and `DemandGeometryQueue`
 * for the scheduling policy.
 */
export class SharedAssetPool<AssetID> {

  private readonly pool_: ChunkedPool

  private readonly assets_ = new Map<AssetID, { span: ChunkSpan, refCount: number }>()

  /**
   * @param pool The chunk pool assets reside in.
   */
  constructor( pool: ChunkedPool ) {
    this.pool_ = pool
  }

  /**
   * @return {ChunkedPool} The underlying chunk pool.
   */
  public get pool(): ChunkedPool {
    return this.pool_
  }

  /**
   * @return {number} The number of resident assets.
   */
  public get assetCount(): number {
    return this.assets_.size
  }

  /**
   * Take a reference on an asset, acquiring chunks for it if it is not yet
   * resident. All-or-nothing: returns false (and changes nothing) only when
   * the asset is absent and the pool can't fit it — the caller's cue to evict
   * and retry. A `wasAbsent` result of true tells the caller to materialise
   * the payload into the asset's chunks (the 0→1 transition).
   *
   * @param assetID The asset to reference.
   * @param byteSize Its payload size (used only on first residency).
   * @return {{ retained: boolean, wasAbsent: boolean }} Whether the reference
   * was taken, and whether this was the residency-creating reference.
   */
  public retain( assetID: AssetID, byteSize: number ):
      { retained: boolean, wasAbsent: boolean } {

    const existing = this.assets_.get( assetID )

    if ( existing !== void 0 ) {
      ++existing.refCount
      return { retained: true, wasAbsent: false }
    }

    const span = this.pool_.acquire( byteSize )

    if ( span === void 0 ) {
      return { retained: false, wasAbsent: true }
    }

    this.assets_.set( assetID, { span, refCount: 1 } )

    return { retained: true, wasAbsent: true }
  }

  /**
   * Drop a reference on an asset. On the last reference (1→0) the asset's
   * chunks return to the pool and the caller should discard the payload.
   *
   * @param assetID The asset to release.
   * @return {boolean} True if this was the last reference (asset freed).
   */
  public release( assetID: AssetID ): boolean {

    const asset = this.assets_.get( assetID )

    if ( asset === void 0 ) {
      throw new Error( `Release of non-resident asset ${String( assetID )}` )
    }

    if ( --asset.refCount > 0 ) {
      return false
    }

    this.pool_.release( asset.span )
    this.assets_.delete( assetID )

    return true
  }

  /**
   * @param assetID The asset to check.
   * @return {boolean} True if the asset is resident.
   */
  public isResident( assetID: AssetID ): boolean {
    return this.assets_.has( assetID )
  }

  /**
   * @param assetID The asset to query.
   * @return {number} The asset's current reference count (0 if absent).
   */
  public refCountOf( assetID: AssetID ): number {
    return this.assets_.get( assetID )?.refCount ?? 0
  }

  /**
   * @param assetID The asset to query.
   * @return {number} The asset's physical (chunk-rounded) resident bytes
   * (0 if absent).
   */
  public physicalBytesOf( assetID: AssetID ): number {

    const asset = this.assets_.get( assetID )

    return asset === void 0 ?
      0 : asset.span.chunks.length * this.pool_.chunkBytes
  }
}
