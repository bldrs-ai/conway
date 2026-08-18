import { CanonicalMesh, CanonicalMeshType } from '../core/canonical_mesh'
import { IfcModelGeometry } from './ifc_model_geometry'


/* Bytes per element of the two native buffers, matching
 * IfcModelGeometry.calculateGeometrySize: vertices are doubles, indices are
 * 32-bit. Getting this wrong does not break the policy — it is proportional
 * either way — but it makes the configured budget mean something other than
 * what it says. */
// eslint-disable-next-line no-magic-numbers
const BYTES_PER_VERTEX_ELEMENT = 8
// eslint-disable-next-line no-magic-numbers
const BYTES_PER_INDEX_ELEMENT = 4

/* Composite key over the model's TWO geometry stores. Local IDs are
 * store-relative, so `geometry` and `voidGeometry` can hold the same ID for
 * different meshes; the budget spans both, so the recency order has to as
 * well. */
const VOID_STORE_BIT = 1

// eslint-disable-next-line no-magic-numbers
const BYTES_PER_MIB = 1024 * 1024


/**
 * Least-recently-used residency for a model's extracted geometry, against a
 * configured byte budget — the "budgeted arena" half of M3.
 *
 * **Why LRU rather than release-on-emit.** Freeing everything a batch created
 * is correct (the fixture `data/mapped_shared_representation.ifc` shows no
 * lost or misplaced instances) but rebuilds geometry a later product still
 * maps: +62.6 % assets on MB-Khaya at batch 64, +79.4 % on D3D. Evicting only
 * what does not fit keeps whatever there is room for, so extraction order's
 * natural locality — a representation goes cold once its users are extracted
 * — does the work instead of the batch boundary. Measured on MB-Khaya: 3 053
 * assets evicted for **zero** rebuilds, and the wasm peak 102 -> 71 MB.
 *
 * **What a too-small budget costs.** Ordinary cache pressure, bounded and
 * proportional: D3D under 64 MB rebuilds 2.8 % more assets than an unbudgeted
 * load and finishes in the same time (52.5 s against 53.1 s); MB-Khaya under
 * an absurd 1 MB rebuilds 38 % more. Nothing here thrashes. (An earlier
 * version of this file carried a floor that raised the budget when eviction
 * looked like churn, written after a 64 MB D3D load ran for an hour. That
 * load was not thrashing — eviction was freeing natives other cached entries
 * still referenced, see natives_ — and once that was fixed the floor never
 * fired on any model available, so it went.)
 *
 * **Why bytes and not the wasm heap.** `wasmHeapByteLength` is grow-only: it
 * does not fall when a native is freed, so a controller driven by it would
 * evict once, observe no change, and evict everything. What a budget can
 * actually govern is the live set; the heap high-water follows it, at a
 * multiple this cannot see (an 8 MB live set sat under an 85 MB heap on
 * MB-Khaya, the difference being allocator overhead, fragmentation, and the
 * intermediate buffers a boolean leaves behind).
 *
 * **The contract this changes.** An evicted asset is gone from
 * `GetGeometry`/`getByLocalID` until something re-extracts it. That is safe
 * for a consumer which copies payloads at delivery — the invariant
 * Share#1640 already asserts — and unsafe for one that holds geometry IDs and
 * fetches lazily later. So a budget is opt-in and unlimited by default:
 * turning it on is a statement about the consumer, not just about memory.
 */
export class GeometryResidency {

  private budgetBytes_ = Number.POSITIVE_INFINITY

  private liveBytes_ = 0

  /* Insertion order IS recency order: re-setting an existing key does not
   * move it, so a touch deletes before setting. */
  private readonly order_ = new Map< number, { store: IfcModelGeometry, native: object } >()

  /* Native object -> the keys that reference it, and its size.
   *
   * Store entries are NOT one-to-one with natives: on D3D 1 448 of 23 692
   * cached meshes hand back a native some other localID already holds (6 %).
   * Two things follow, and both are bugs if this map does not exist. The
   * budget would charge for those bytes once per key rather than once, and —
   * far worse — evicting one key would free a native its siblings still
   * point at, leaving them dangling with no diagnostic until something reads
   * them. So residency is refcounted on the NATIVE: bytes are charged once,
   * and the native is freed only when its last referencing key goes. */
  private readonly natives_ =
    new Map< object, { bytes: number, keys: Set< number > } >()

  /**
   * @return {boolean} Whether a finite budget is configured. Every hook below
   * returns immediately when this is false, so an unbudgeted model pays one
   * predictable-branch per geometry add and lookup rather than the
   * bookkeeping — `getByLocalID` is on the scene-walk hot path.
   */
  public get enabled(): boolean {
    return this.budgetBytes_ !== Number.POSITIVE_INFINITY
  }

  /**
   * @return {number} The configured budget in bytes, or Infinity.
   */
  public get budgetBytes(): number {
    return this.budgetBytes_
  }

  /**
   * @return {number} Bytes currently accounted resident.
   */
  public get liveBytes(): number {
    return this.liveBytes_
  }

  /**
   * @return {number} How many assets are tracked.
   */
  public get residentCount(): number {
    return this.order_.size
  }

  /**
   * Set the budget. A non-finite or non-positive value disables eviction,
   * which is the default and the behaviour every consumer had before this
   * existed.
   *
   * Raising or lowering it takes effect at the next eviction pass rather than
   * immediately, so a caller that lowers the budget mid-load does not stall
   * the current batch freeing memory.
   *
   * @param bytes The new ceiling, or Infinity to disable.
   */
  public setBudgetBytes( bytes: number ): void {

    if ( !Number.isFinite( bytes ) || bytes <= 0 ) {

      this.budgetBytes_ = Number.POSITIVE_INFINITY

      // Drop the bookkeeping too: with no budget it can only go stale, and a
      // stale order would evict the wrong things if a budget were set later.
      this.order_.clear()
      this.natives_.clear()
      this.liveBytes_ = 0
      return
    }

    this.budgetBytes_ = bytes
  }

  /**
   * Record an asset as resident, or refresh one being replaced.
   *
   * @param store The store holding it.
   * @param mesh The mesh added.
   */
  public noteAdded( store: IfcModelGeometry, mesh: CanonicalMesh ): void {

    if ( !this.enabled ) {
      return
    }

    const key = residencyKey( store, mesh.localID )

    if ( this.order_.has( key ) ) {
      this.releaseKey_( key )
    }

    if ( mesh.type !== CanonicalMeshType.BUFFER_GEOMETRY ) {
      return
    }

    const native = mesh.geometry as unknown as object
    const tracked = this.natives_.get( native )

    if ( tracked !== void 0 ) {

      // Already resident under another key: charge nothing more, just add
      // the reference.
      tracked.keys.add( key )

    } else {

      const bytes = meshBytes( mesh )

      this.natives_.set( native, { bytes, keys: new Set( [ key ] ) } )
      this.liveBytes_ += bytes
    }

    this.order_.set( key, { store, native } )
  }

  /**
   * Drop one key's reference, reporting whether the native it names is now
   * unreferenced and therefore safe to free.
   *
   * @param key The composite key.
   * @return {boolean} True when this was the last reference.
   */
  private releaseKey_( key: number ): boolean {

    const entry = this.order_.get( key )

    this.order_.delete( key )

    if ( entry === void 0 ) {
      return true
    }

    const tracked = this.natives_.get( entry.native )

    if ( tracked === void 0 ) {
      return true
    }

    tracked.keys.delete( key )

    if ( tracked.keys.size > 0 ) {
      return false
    }

    this.liveBytes_ -= tracked.bytes
    this.natives_.delete( entry.native )

    return true
  }

  /**
   * Whether freeing the native behind a store entry is safe — false while
   * another cached mesh still references the same native.
   *
   * @param store The store.
   * @param localID The asset's local ID.
   * @return {boolean} True when the caller should free the native.
   */
  public releaseReference( store: IfcModelGeometry, localID: number ): boolean {

    if ( !this.enabled ) {
      return true
    }

    return this.releaseKey_( residencyKey( store, localID ) )
  }

  /**
   * Record a use, moving the asset to the most-recent end.
   *
   * @param store The store queried.
   * @param localID The asset's local ID.
   */
  public noteUsed( store: IfcModelGeometry, localID: number ): void {

    if ( !this.enabled ) {
      return
    }

    const key = residencyKey( store, localID )
    const existing = this.order_.get( key )

    if ( existing === void 0 ) {
      return
    }

    this.order_.delete( key )
    this.order_.set( key, existing )
  }

  /**
   * Stop accounting for an asset something else freed — an explicit delete,
   * or the extractor reclaiming its own temporaries. Without this the budget
   * would keep charging for bytes nobody holds and evict live assets to make
   * room for them.
   *
   * @param store The store it was in.
   * @param localID The asset's local ID.
   */
  public noteRemoved( store: IfcModelGeometry, localID: number ): void {

    if ( !this.enabled ) {
      return
    }

    this.releaseKey_( residencyKey( store, localID ) )
  }

  /**
   * Evict least-recently-used assets until the live set fits the budget.
   *
   * @return {{evicted: number, freedBytes: number}} What this pass reclaimed.
   */
  public evictToBudget(): { evicted: number, freedBytes: number } {

    if ( !this.enabled ) {
      return { evicted: 0, freedBytes: 0 }
    }

    let evicted = 0
    let freedBytes = 0

    for ( const [ key, entry ] of this.order_ ) {

      if ( this.liveBytes_ <= this.budgetBytes_ ) {
        break
      }

      // Delete drops this entry through noteRemoved, so the accounting and
      // the map are updated there rather than here.
      const localID = localIDOf( key )
      const bytes = this.natives_.get( entry.native )?.bytes ?? 0

      entry.store.delete( localID )

      ++evicted
      freedBytes += bytes
    }

    return { evicted, freedBytes }
  }
}


/**
 * Composite recency key spanning both of a model's geometry stores.
 *
 * @param store The store.
 * @param localID The asset's local ID within it.
 * @return {number} A key unique across both stores.
 */
function residencyKey( store: IfcModelGeometry, localID: number ): number {
  return ( localID * 2 ) + ( store.isVoid ? VOID_STORE_BIT : 0 )
}


/**
 * Recover a local ID from a composite key.
 *
 * @param key The composite key.
 * @return {number} The local ID.
 */
function localIDOf( key: number ): number {
  return ( key - ( key % 2 ) ) / 2
}


/**
 * Approximate the native bytes an asset holds.
 *
 * @param mesh The mesh.
 * @return {number} Payload bytes, or 0 for anything that is not a native
 * buffer geometry (a lazy thunk, a string, an already-freed handle).
 */
function meshBytes( mesh: CanonicalMesh ): number {

  if ( mesh.type !== CanonicalMeshType.BUFFER_GEOMETRY ) {
    return 0
  }

  try {

    // The native's own accounting where it offers one — it knows about the
    // buffers this cannot see. Falls back to the payload estimate, which is
    // what calculateGeometrySize uses.
    const allocated = mesh.geometry.getAllocationSize?.()

    if ( typeof allocated === 'number' && allocated > 0 ) {
      return allocated
    }

    return ( mesh.geometry.GetVertexDataSize() * BYTES_PER_VERTEX_ELEMENT ) +
      ( mesh.geometry.GetIndexDataSize() * BYTES_PER_INDEX_ELEMENT )

  } catch {

    // A geometry whose native is already gone contributes nothing, and
    // throwing here would abort a load over bookkeeping.
    return 0
  }
}
