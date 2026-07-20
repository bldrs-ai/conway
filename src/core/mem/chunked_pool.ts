/**
 * A fixed-chunk budget pool — the resident-memory primitive (M3 production
 * design; see "Resident memory: two regimes" in the design doc).
 *
 * The wasm heap grows and never shrinks: `free()` returns bytes to the
 * allocator's freelists, not to the browser, so the tab pays the heap's
 * **high-water mark forever** and external fragmentation is a permanent leak,
 * not a throughput nuisance. General-purpose allocation is therefore the
 * wrong tool for large, evictable resident data. This pool is the explicit
 * alternative: one region carved into fixed-size chunks with a freelist —
 * acquire rounds up to whole chunks, release is O(chunks), and the region's
 * high-water mark is the budget, by construction. Fragmentation is confined
 * to bounded internal waste (the tail of the last chunk).
 *
 * This TS class is the pool's **accounting/policy half** and the executable
 * spec for its C++ twin in conway-geom (which owns real bytes inside the wasm
 * heap). It is also usable directly for JS-side resident budgets (property
 * caches, sidecar caches) — the abstraction is deliberately not
 * geometry-specific. The intended layering:
 *
 *   ChunkedPool                — chunks and bytes (this file)
 *   SharedAssetPool            — refcounted assets living in those chunks
 *   GeometryTilePool           — the geometry narrowing (products ⇄ assets)
 *
 * Lifetime regimes, for orientation: *phase-bounded* scratch (tessellation
 * temporaries) stays on the AFTP bump arenas — reset, never freed piecemeal.
 * *Demand-bounded* residents (data that lives until evicted) live here. The
 * general allocator keeps only the small, messy-lifetime residual.
 */

/**
 * An acquired run of chunks. `chunks` are chunk indices into the pool's
 * region (index × chunkBytes = byte offset in the C++ twin); `byteSize` is
 * the caller's requested size, ≤ `chunks.length × chunkBytes`.
 */
export interface ChunkSpan {
  chunks: number[]
  byteSize: number
}


/** Runtime counters for a pool, for tests and telemetry. */
export interface ChunkedPoolStats {
  totalChunks: number
  freeChunks: number
  bytesInUse: number
  acquires: number
  releases: number
  failedAcquires: number
}


/**
 * A budgeted pool of fixed-size chunks with a freelist. Purely accounting —
 * see the module docs for how it maps onto real memory.
 */
export class ChunkedPool {

  private readonly chunkBytes_: number

  private readonly totalChunks_: number

  /** Free chunk indices (LIFO for locality in the C++ twin). */
  private readonly freeList_: number[]

  private acquires_ = 0

  private releases_ = 0

  private failedAcquires_ = 0

  /**
   * @param budgetBytes The pool's total byte budget (rounded down to whole
   * chunks; must fit at least one chunk).
   * @param chunkBytes The fixed chunk size in bytes.
   */
  constructor( budgetBytes: number, chunkBytes: number ) {

    if ( chunkBytes <= 0 || !Number.isInteger( chunkBytes ) ) {
      throw new Error( `Invalid chunkBytes ${chunkBytes}` )
    }

    const totalChunks = Math.floor( budgetBytes / chunkBytes )

    if ( totalChunks < 1 ) {
      throw new Error(
          `Budget ${budgetBytes} does not fit one chunk of ${chunkBytes}` )
    }

    this.chunkBytes_ = chunkBytes
    this.totalChunks_ = totalChunks
    this.freeList_ = []

    for ( let chunk = totalChunks - 1; chunk >= 0; --chunk ) {
      this.freeList_.push( chunk )
    }
  }

  /**
   * @return {number} The fixed chunk size in bytes.
   */
  public get chunkBytes(): number {
    return this.chunkBytes_
  }

  /**
   * @return {number} Total chunks in the pool.
   */
  public get totalChunks(): number {
    return this.totalChunks_
  }

  /**
   * @return {number} Chunks currently free.
   */
  public get freeChunks(): number {
    return this.freeList_.length
  }

  /**
   * @return {number} The pool's total byte capacity (whole chunks).
   */
  public get totalBytes(): number {
    return this.totalChunks_ * this.chunkBytes_
  }

  /**
   * @return {number} Physical bytes currently acquired (chunk-rounded).
   */
  public get bytesInUse(): number {
    return ( this.totalChunks_ - this.freeList_.length ) * this.chunkBytes_
  }

  /**
   * The physical (chunk-rounded) cost of a byte size — what an acquire of
   * `bytes` actually consumes. Use this for any budget accounting layered
   * above the pool so logical charges cover physical use.
   *
   * @param bytes The byte size to round.
   * @return {number} The chunk-rounded byte cost.
   */
  public chunkRound( bytes: number ): number {

    if ( bytes < 0 ) {
      throw new Error( `Invalid byte size ${bytes}` )
    }

    return Math.ceil( bytes / this.chunkBytes_ ) * this.chunkBytes_
  }

  /**
   * Acquire chunks to hold `bytes`. All-or-nothing: returns undefined (and
   * changes nothing) if the free chunks can't cover the request — the
   * caller's cue to evict and retry.
   *
   * @param bytes The byte size to hold (0 is allowed and acquires no chunks).
   * @return {ChunkSpan | undefined} The span, or undefined if it can't fit.
   */
  public acquire( bytes: number ): ChunkSpan | undefined {

    const needed = Math.ceil( Math.max( 0, bytes ) / this.chunkBytes_ )

    if ( needed > this.freeList_.length ) {
      ++this.failedAcquires_
      return void 0
    }

    const chunks: number[] = new Array( needed )

    for ( let where = 0; where < needed; ++where ) {
      chunks[ where ] = this.freeList_.pop() as number
    }

    ++this.acquires_

    return { chunks, byteSize: bytes }
  }

  /**
   * Return a span's chunks to the freelist. The span must not be used (or
   * released) again afterwards.
   *
   * @param span The span to release.
   */
  public release( span: ChunkSpan ): void {

    for ( const chunk of span.chunks ) {
      this.freeList_.push( chunk )
    }

    span.chunks.length = 0
    ++this.releases_
  }

  /**
   * @return {ChunkedPoolStats} A snapshot of runtime counters.
   */
  public get stats(): ChunkedPoolStats {
    return {
      totalChunks: this.totalChunks_,
      freeChunks: this.freeList_.length,
      bytesInUse: this.bytesInUse,
      acquires: this.acquires_,
      releases: this.releases_,
      failedAcquires: this.failedAcquires_,
    }
  }
}
