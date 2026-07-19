/**
 * Demand-driven, budgeted geometry materialisation (M3).
 *
 * The streaming loader inverts geometry: instead of extracting every product
 * up front, extraction becomes a **cache fill keyed by product**, ordered by
 * demand (viewport frustum + distance, explicit selection, prefetch hints)
 * and bounded by an explicit byte budget. This module is the scheduler: a
 * priority queue over product local IDs plus an evictable resident set, with
 * the actual extract / release delegated to a pluggable {@link GeometryTiles}.
 *
 * The heavy half — the wasm-side extract → tessellate → upload and the
 * per-product native reclaim — lives behind {@link GeometryTiles}. Its
 * production implementation needs a **conway-geom API to free one product's
 * native geometry** (today the wasm heap has no per-product reclaim); scoping
 * that C++ surface is the M3 blocker tracked in the design doc. This scheduler
 * is engine-side, fully deterministic, and tested against a mock tiles impl,
 * so the queue/budget/eviction policy is settled independently of the wasm
 * work.
 */

/**
 * The per-product geometry work behind the queue. Implementations do the
 * expensive materialisation; the queue owns only ordering and the budget.
 */
export interface GeometryTiles {

  /**
   * Materialise a product's geometry tile and return its resident cost in
   * bytes (GPU/scene + any retained wasm working set the budget should count).
   * Called at most once per product between evictions.
   *
   * @param productLocalID The product's local ID.
   * @return {number} The tile's resident byte cost (≥ 0).
   */
  extract( productLocalID: number ): number

  /**
   * Release a product's materialised tile, freeing its resident bytes — the
   * scene mesh and, crucially, the product's native (wasm) geometry. This is
   * the per-product reclaim the production conway-geom surface must provide.
   *
   * @param productLocalID The product's local ID.
   */
  release( productLocalID: number ): void
}


/** A pending request: a product and its current demand priority. */
interface PendingRequest {
  productLocalID: number
  priority: number
}


/** A resident tile: its byte cost and the priority it was filled at. */
interface ResidentTile {
  bytes: number
  priority: number
}


/**
 * Runtime counters for a queue, for tests and telemetry.
 */
export interface DemandQueueStats {
  extractions: number
  evictions: number
  residentBytes: number
  residentCount: number
  pendingCount: number
}


/**
 * A budgeted, demand-ordered geometry materialisation queue.
 *
 * Usage: `request(productLocalID, priority)` as demand changes (higher
 * priority = more wanted); `pump()` to materialise the most-wanted pending
 * products until the queue drains or the byte budget forces eviction of
 * lower-priority resident tiles. Re-requesting an evicted product re-fills it.
 * A steady stream of `request` + `pump` keeps a bounded working set of the
 * highest-priority products resident — the "full model navigable under a
 * fixed budget" behaviour.
 */
export class DemandGeometryQueue {

  private readonly tiles_: GeometryTiles

  private readonly budgetBytes_: number

  /** Highest priority a product currently wants materialising at. */
  private readonly pending_ = new Map<number, number>()

  /** Resident tiles by product local ID. */
  private readonly resident_ = new Map<number, ResidentTile>()

  private residentBytes_ = 0

  private extractions_ = 0

  private evictions_ = 0

  /**
   * @param tiles The extract/release backend.
   * @param budgetBytes Maximum resident tile bytes before eviction kicks in.
   */
  constructor( tiles: GeometryTiles, budgetBytes: number ) {

    if ( budgetBytes <= 0 ) {
      throw new Error( `Invalid budgetBytes ${budgetBytes}` )
    }

    this.tiles_ = tiles
    this.budgetBytes_ = budgetBytes
  }

  /**
   * Request a product be materialised at the given demand priority. Updates
   * the priority if already pending (keeping the higher of the two) or already
   * resident (so eviction ranks it correctly). Requesting a resident product
   * does not re-extract it.
   *
   * @param productLocalID The product to materialise.
   * @param priority The demand priority (higher = more wanted).
   */
  public request( productLocalID: number, priority: number ): void {

    const tile = this.resident_.get( productLocalID )

    if ( tile !== void 0 ) {
      // Already resident — just refresh its eviction ranking.
      tile.priority = Math.max( tile.priority, priority )
      return
    }

    const existing = this.pending_.get( productLocalID )

    this.pending_.set(
        productLocalID,
        existing === void 0 ? priority : Math.max( existing, priority ) )
  }

  /**
   * Materialise pending products in descending priority order, evicting the
   * lowest-priority resident tiles whenever the budget is exceeded. A pending
   * product whose priority is below every resident tile AND that can't fit is
   * left pending (it will fill once demand raises it or resident tiles drop).
   *
   * @param maxExtractions Optional cap on how many tiles to extract this pump
   * (e.g. a per-frame budget); unbounded when omitted.
   * @return {number} The number of tiles extracted this pump.
   */
  public pump( maxExtractions: number = Number.POSITIVE_INFINITY ): number {

    let extractedThisPump = 0

    while ( extractedThisPump < maxExtractions && this.pending_.size > 0 ) {

      const next = this.popHighestPending_()

      if ( next === void 0 ) {
        break
      }

      // If the working set is full and this request can't beat the cheapest
      // evictable (lower-priority) resident tile, stop — nothing more fits.
      if ( !this.ensureRoomFor_( next.priority ) ) {
        // Put it back; it stays pending for a future pump.
        this.pending_.set( next.productLocalID, next.priority )
        break
      }

      const bytes = this.tiles_.extract( next.productLocalID )

      this.resident_.set(
          next.productLocalID, { bytes, priority: next.priority } )

      this.residentBytes_ += bytes
      ++this.extractions_
      ++extractedThisPump

      // A single oversized tile can still exceed budget; evict what we can.
      this.evictToBudget_()
    }

    return extractedThisPump
  }

  /**
   * Evict every resident tile (e.g. on model close), releasing all bytes.
   */
  public evictAll(): void {
    for ( const productLocalID of this.resident_.keys() ) {
      this.tiles_.release( productLocalID )
      ++this.evictions_
    }
    this.resident_.clear()
    this.residentBytes_ = 0
  }

  /**
   * @return {boolean} True if the product's tile is resident.
   * @param productLocalID The product to check.
   */
  public isResident( productLocalID: number ): boolean {
    return this.resident_.has( productLocalID )
  }

  /**
   * @return {DemandQueueStats} A snapshot of runtime counters.
   */
  public get stats(): DemandQueueStats {
    return {
      extractions: this.extractions_,
      evictions: this.evictions_,
      residentBytes: this.residentBytes_,
      residentCount: this.resident_.size,
      pendingCount: this.pending_.size,
    }
  }

  /**
   * Pop the highest-priority pending request. Linear scan — swap for a heap
   * if a real workload shows the pending set growing large per pump.
   *
   * @return {PendingRequest | undefined} The request, or undefined if none.
   */
  private popHighestPending_(): PendingRequest | undefined {

    let bestID: number | undefined
    let bestPriority = Number.NEGATIVE_INFINITY

    for ( const [ productLocalID, priority ] of this.pending_ ) {
      if ( priority > bestPriority ) {
        bestPriority = priority
        bestID = productLocalID
      }
    }

    if ( bestID === void 0 ) {
      return void 0
    }

    this.pending_.delete( bestID )

    return { productLocalID: bestID, priority: bestPriority }
  }

  /**
   * Ensure there is conceptual room for a tile requested at `priority` by
   * evicting resident tiles strictly lower in priority while over budget.
   * Returns false if the budget is full of tiles at least as wanted as this
   * request (so it shouldn't displace them).
   *
   * @param priority The incoming request's priority.
   * @return {boolean} True if extraction should proceed.
   */
  private ensureRoomFor_( priority: number ): boolean {

    if ( this.residentBytes_ < this.budgetBytes_ ) {
      return true
    }

    // Over/at budget: only proceed if there's a lower-priority tile to evict.
    let evictedAny = false

    while ( this.residentBytes_ >= this.budgetBytes_ ) {
      const victim = this.lowestPriorityResident_()

      if ( victim === void 0 || victim.priority >= priority ) {
        break
      }

      this.evictOne_( victim.productLocalID )
      evictedAny = true
    }

    return this.residentBytes_ < this.budgetBytes_ || evictedAny
  }

  /**
   * Evict lowest-priority resident tiles until within budget (used after an
   * extraction that pushed us over — e.g. a large tile).
   */
  private evictToBudget_(): void {
    while ( this.residentBytes_ > this.budgetBytes_ ) {
      const victim = this.lowestPriorityResident_()

      if ( victim === void 0 ) {
        break
      }

      this.evictOne_( victim.productLocalID )
    }
  }

  /**
   * @return {{ productLocalID: number, priority: number } | undefined} The
   * lowest-priority resident tile, or undefined if none.
   */
  private lowestPriorityResident_():
      { productLocalID: number, priority: number } | undefined {

    let worstID: number | undefined
    let worstPriority = Number.POSITIVE_INFINITY

    for ( const [ productLocalID, tile ] of this.resident_ ) {
      if ( tile.priority < worstPriority ) {
        worstPriority = tile.priority
        worstID = productLocalID
      }
    }

    return worstID === void 0 ?
      void 0 : { productLocalID: worstID, priority: worstPriority }
  }

  /**
   * Release one resident tile.
   *
   * @param productLocalID The tile to evict.
   */
  private evictOne_( productLocalID: number ): void {
    const tile = this.resident_.get( productLocalID )

    if ( tile === void 0 ) {
      return
    }

    this.tiles_.release( productLocalID )
    this.resident_.delete( productLocalID )
    this.residentBytes_ -= tile.bytes
    ++this.evictions_
  }
}
