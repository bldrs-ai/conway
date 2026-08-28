/**
 * Source-buffer residency for STEP models.
 *
 * A parsed model's descriptors index the raw STEP text by absolute
 * `[address, address + length)` byte ranges (the SoA `address_` /
 * `length_` columns). Historically the whole source buffer stayed
 * resident for the model's lifetime so any range could be read
 * synchronously. That pins the full file (hundreds of MB on large
 * models) for property access patterns that only ever touch a tiny
 * fraction of it after load.
 *
 * A {@link StepBufferProvider} abstracts "give me the bytes for this
 * range" behind two operations:
 *
 *  - `acquire(address, length)` — SYNCHRONOUS. Returns a byte view
 *    containing the range plus the absolute address of the view's
 *    first byte, so callers can translate between absolute addresses
 *    and view-relative cursors. Throws
 *    {@link StepBufferNotResidentError} when the range is not
 *    resident — synchronous extraction paths never wait.
 *  - `ensureResident(address, length)` — ASYNCHRONOUS. Pages the
 *    range in (from an external store) so a following `acquire`
 *    succeeds. Async API surfaces (the web-ifc shim's property
 *    methods) call this before entering synchronous extraction.
 *
 * Two implementations:
 *
 *  - {@link ResidentStepBufferProvider} wraps the fully-resident
 *    source buffer. `acquire` returns the whole buffer with offset 0
 *    (so view-relative cursors ARE absolute addresses) and
 *    `ensureResident` resolves immediately. This is the default and
 *    matches the historical behaviour bit-for-bit.
 *  - {@link WindowedStepBufferProvider} pages fixed-size chunks from
 *    a {@link StepExternalByteStore} with an LRU residency cap.
 *    Records contained in one chunk are served as a view over it;
 *    records straddling chunks get a per-record merged copy. Eviction
 *    is advisory while a descriptor still holds a chunk view.
 *    {@link StepModelBase.releaseSourceViews} drops those views so
 *    the LRU can evict; the next sync read must `ensureResident`
 *    first (same as any other miss).
 *
 * The external store itself is environment-provided (OPFS in the
 * browser, a file or memory in node) — this module only defines the
 * read contract plus an in-memory implementation used by tests and
 * small models.
 */

/* Chunk sizing: large enough that virtually every record is served
 * zero-copy from a single chunk (STEP records are bytes-to-KBs;
 * pathological geometry records reach single-digit MBs), small enough
 * that the default residency cap keeps the working set modest. */
// eslint-disable-next-line no-magic-numbers -- byte-size arithmetic (4MiB)
const DEFAULT_CHUNK_BYTES = 4 * 1024 * 1024
const DEFAULT_MAX_RESIDENT_CHUNKS = 16

/* Adaptive residency (issue #616).
 *
 * The default 4 MiB x 16 window is right for a load that sweeps the file
 * forwards, which is what most models do. It is badly wrong for a model
 * whose rel-aggregate pass walks a working set larger than the window:
 * D3D.ifc read 47.1 GB from a 213.6 MB file — a 220x read amplification
 * that was 56% of its load — with a measured reuse distance of p50 = 16
 * chunks against a cap of exactly 16. Every one of those re-reads was a
 * capacity miss; the request stream itself is identical at every window
 * size, so it is a retention failure, not a re-request loop.
 *
 * Neither model's shape is knowable at open, so the cap is a policy rather
 * than a constant: start at the shipped window and double it when the
 * workload demonstrates that a larger one would have avoided the reads.
 *
 * Two properties make growth safe rather than a gamble:
 *
 *  - LRU is a stack algorithm (Mattson's inclusion property): for a fixed
 *    reference stream, the chunks resident at cap N are a subset of those
 *    resident at cap N+1, so raising the cap can never turn a hit into a
 *    miss. Growth costs memory; it cannot cost reads. The cap only ever
 *    grows within a provider's life, which is what keeps that argument
 *    applicable — a shrink would break it.
 *  - Growth triggers on *capacity* misses only, classified against a ghost
 *    list of recently-evicted chunks. A forward sweep's misses are
 *    compulsory (the chunk was never resident), so a sweep does not grow:
 *    measured over PSB.ifc, 0 of 62 intervals met the trigger, against 360
 *    of 1,095 on D3D — whose loads are 85.2% capacity misses against PSB's
 *    5.9%.
 *
 * Residency is bounded by {@link ADAPTIVE_MAX_RESIDENT_BYTES} and by the
 * store's own size, so an adapted provider never holds more than the
 * fully-resident {@link ResidentStepBufferProvider} would have. That bound
 * is the memory cost of the policy and it is deliberate: a thrashing model
 * trades transient garbage (D3D churned 47 GB of 4 MiB buffers) for bounded
 * retention.
 */
// eslint-disable-next-line no-magic-numbers -- byte-size arithmetic (256MiB)
const ADAPTIVE_MAX_RESIDENT_BYTES = 256 * 1024 * 1024

/* Chunk requests per policy evaluation. Small enough to react inside a
 * load (D3D issues 4.5M requests, so ~1,100 evaluations), large enough
 * that the trigger is a rate rather than a burst. Replaying D3D's recorded
 * request stream (`scripts/pager_policy_sim.mjs`) over trigger 4-16 x
 * interval 2,048-16,384, the policy reaches a whole-file window in two
 * doublings in every cell; only how fast it gets there moves, from 0.012x
 * of the shipped window's load count to 0.057x. The 2,048-4,096 band is
 * flat at 0.012x-0.017x, and the midpoints are taken from it. */
const ADAPTIVE_EVAL_REQUESTS = 4096

/* Capacity misses in one interval that justify doubling — and the share of
 * that interval's misses they must be. The fraction is what keeps a model
 * that is simply reading a lot of new file (all-compulsory misses) from
 * growing on volume alone. */
const ADAPTIVE_GROWTH_CAPACITY_MISSES = 8
const ADAPTIVE_GROWTH_MISS_FRACTION = 0.5

/**
 * Brand carrying the absolute source address of a view's first byte.
 * Cursors recorded against a windowed view are view-relative; adding
 * the view's base converts them back to absolute source addresses
 * (inline-element lookups are keyed by parse-time absolute address).
 * Attached as a non-enumerable property so views flow through
 * existing code untouched; absent (fully-resident source buffer,
 * chunk 0) means base 0.
 */
const STEP_BUFFER_BASE: unique symbol = Symbol( 'stepBufferBase' )

/**
 * Get the absolute source address of `buffer[ 0 ]`.
 *
 * @param buffer A view handed out by a {@link StepBufferProvider}.
 * @return {number} The base address (0 for the resident source buffer).
 */
export function stepBufferBase( buffer: Uint8Array ): number {
  return ( buffer as { [STEP_BUFFER_BASE]?: number } )[ STEP_BUFFER_BASE ] ?? 0
}

/**
 * Tag a view with its absolute base address (no-op for base 0, which
 * is the default reading).
 *
 * @param buffer The view to tag.
 * @param base The absolute source address of `buffer[ 0 ]`.
 * @return {Uint8Array} The same view.
 */
function tagBufferBase( buffer: Uint8Array, base: number ): Uint8Array {

  if ( base !== 0 ) {
    Object.defineProperty( buffer, STEP_BUFFER_BASE, { value: base } )
  }

  return buffer
}

/**
 * Read contract for the spilled source bytes. Implementations must
 * return exactly the requested range (clamped reads are the caller's
 * responsibility — the provider never requests past `byteLength`).
 */
export interface StepExternalByteStore {

  /** Total size of the stored byte sequence. */
  readonly byteLength: number

  /**
   * Read `length` bytes starting at `offset`.
   *
   * @param offset Absolute offset of the first byte to read.
   * @param length Number of bytes to read.
   * @return {Promise< Uint8Array >} The bytes — a standalone array
   * (byteOffset 0) of exactly `length` bytes.
   */
  read( offset: number, length: number ): Promise< Uint8Array >
}

/**
 * In-memory {@link StepExternalByteStore}. Used by tests and as a
 * degenerate store when the caller wants windowed accounting without
 * real external storage.
 */
export class InMemoryStepByteStore implements StepExternalByteStore {

  /**
   * Construct this around a byte array (not copied).
   *
   * @param bytes_ The backing bytes.
   */
  constructor( private readonly bytes_: Uint8Array ) {}

  /**
   * Total size of the stored byte sequence.
   *
   * @return {number} The byte length.
   */
  public get byteLength(): number {
    return this.bytes_.byteLength
  }

  /**
   * Read a range as a standalone copy.
   *
   * @param offset Absolute offset of the first byte to read.
   * @param length Number of bytes to read.
   * @return {Promise< Uint8Array >} The bytes.
   */
  public read( offset: number, length: number ): Promise< Uint8Array > {
    return Promise.resolve( this.bytes_.slice( offset, offset + length ) )
  }
}

/**
 * Result of a synchronous range acquisition: a byte view containing
 * the requested range and the absolute address of `buffer[ 0 ]`.
 * `address - offset` converts an absolute address into an index into
 * `buffer`. The buffer is always standalone (byteOffset 0) or the
 * original resident source buffer — both satisfy the extraction
 * layer's `new DataView( buffer.buffer )` zero-offset assumption.
 */
export interface StepBufferAcquisition {
  buffer: Uint8Array
  offset: number
}

/**
 * Thrown by {@link StepBufferProvider.acquire} when the requested
 * range is not resident. Reaching this means a synchronous extraction
 * ran without a preceding `ensureResident` — a caller-side sequencing
 * bug, not a recoverable data condition.
 */
export class StepBufferNotResidentError extends Error {

  /**
   * Construct this for a byte range.
   *
   * @param address Absolute start of the range.
   * @param length Length of the range.
   */
  constructor( public readonly address: number, public readonly length: number ) {
    super(
        `STEP source range [${address}, ${address + length}) is not resident — ` +
        'call ensureResident before synchronous extraction' )
    this.name = 'StepBufferNotResidentError'
  }
}

/**
 * Residency provider for a model's source bytes.
 */
export interface StepBufferProvider {

  /** Total logical size of the source bytes. */
  readonly byteLength: number

  /** Bytes currently held resident by the provider itself. */
  readonly residentBytes: number

  /**
   * Synchronously acquire a view containing a byte range.
   *
   * @param address Absolute start of the range.
   * @param length Length of the range.
   * @throws { StepBufferNotResidentError } When the range isn't resident.
   * @return {StepBufferAcquisition} The view and its base address.
   */
  acquire( address: number, length: number ): StepBufferAcquisition

  /**
   * Make a byte range resident so a following {@link acquire} succeeds.
   *
   * @param address Absolute start of the range.
   * @param length Length of the range.
   * @return {Promise< void >} Resolves when resident.
   */
  ensureResident( address: number, length: number ): Promise< void >

  /**
   * Hold a range against LRU eviction until a matching
   * {@link unpinRange}. No-op on a fully-resident source. Refcounted.
   *
   * @param address Absolute start of the range.
   * @param length Length of the range.
   */
  pinRange?( address: number, length: number ): void

  /**
   * Drop one {@link pinRange} hold on a range.
   *
   * @param address Absolute start of the range.
   * @param length Length of the range.
   */
  unpinRange?( address: number, length: number ): void
}

/**
 * Provider over a fully-resident source buffer — the default, and
 * bit-for-bit the historical behaviour: acquisitions are the source
 * buffer itself at offset 0, so view-relative cursors are absolute
 * addresses and nothing changes for existing extraction code.
 */
export class ResidentStepBufferProvider implements StepBufferProvider {

  /**
   * Construct this over the resident source buffer.
   *
   * @param buffer_ The full source bytes.
   */
  constructor( private readonly buffer_: Uint8Array ) {}

  /**
   * Total logical size of the source bytes.
   *
   * @return {number} The byte length.
   */
  public get byteLength(): number {
    return this.buffer_.byteLength
  }

  /**
   * Bytes currently held resident — the whole buffer.
   *
   * @return {number} The byte length.
   */
  public get residentBytes(): number {
    return this.buffer_.byteLength
  }

  /**
   * Acquire the whole buffer at offset 0.
   *
   * @return {StepBufferAcquisition} The acquisition.
   */
  public acquire(): StepBufferAcquisition {
    return { buffer: this.buffer_, offset: 0 }
  }

  /**
   * Always resident.
   *
   * @return {Promise< void >} Resolved promise.
   */
  public ensureResident(): Promise< void > {
    return Promise.resolve()
  }
}

/**
 * Provider that pages fixed-size chunks from an external store with
 * an LRU residency cap.
 *
 * Concurrency note: `ensureResident` de-duplicates in-flight chunk
 * loads, so overlapping property reads for neighbouring records fetch
 * each chunk once. Eviction only drops the provider's own reference —
 * any descriptor that acquired a view over the chunk keeps that chunk
 * alive independently, so previously-materialised entities keep
 * working after eviction (they just pin their chunk until the
 * descriptor cache is invalidated).
 */
export class WindowedStepBufferProvider implements StepBufferProvider {

  private readonly chunkBytes_: number

  /**
   * Current residency cap in chunks. Mutable: the adaptive policy raises
   * it (never lowers it — see the inclusion argument above) up to
   * {@link adaptiveCapChunks_}.
   */
  private maxResidentChunks_: number

  /**
   * Ceiling the adaptive policy may raise the cap to. Equal to the
   * starting cap when adaptation is off, which makes every policy hook a
   * no-op without a second branch at each call site.
   */
  private readonly adaptiveCapChunks_: number

  /**
   * Chunk indices evicted recently, insertion-ordered (Set iteration order
   * is insertion order, so the front is the oldest) and bounded by the
   * current cap. A load of a chunk in here is a capacity miss: a window
   * twice this size would have held it. Empty when adaptation is off.
   */
  private readonly ghostChunks_ = new Set< number >()

  /** Chunk requests seen in the current policy evaluation interval. */
  private intervalRequests_ = 0

  /** Store reads issued in the current interval. */
  private intervalLoads_ = 0

  /** Of those reads, the ones a larger window would have avoided. */
  private intervalCapacityMisses_ = 0

  /** Resident chunks by chunk index; Map order doubles as LRU order. */
  private readonly chunks_ = new Map< number, Uint8Array >()

  /** In-flight chunk loads, de-duplicated by chunk index. */
  private readonly loading_ = new Map< number, Promise< Uint8Array > >()

  /**
   * Chunks covered by an `ensureResident` call that hasn't returned
   * yet, refcounted. Eviction skips them: an overlapping ensure for a
   * different range must not evict chunks another caller has ensured
   * but not yet synchronously acquired (the acquire happens in the
   * caller's continuation, which can interleave with this one).
   */
  private readonly ensurePins_ = new Map< number, number >()

  /**
   * Construct this over an external byte store.
   *
   * `maxResidentChunks` is a starting point, not a budget, unless the
   * caller says otherwise: omitting it opts into the adaptive policy
   * (issue #616), while passing a cap explicitly is read as a hard
   * residency budget and pins the window exactly where it is asked for.
   * That split is deliberate — the callers that pass a cap are the ones
   * that chose it for a reason (a cramped test fixture, a memory-bounded
   * preview), and the ones that take the default are the ones with no
   * opinion, which is where a policy belongs. Pass `adaptive` to override
   * either reading.
   *
   * @param store_ The store holding the source bytes.
   * @param chunkBytes Chunk size in bytes (default 4MiB).
   * @param maxResidentChunks LRU residency cap in chunks (default 16).
   * @param adaptive Whether the cap may grow on measured thrash; defaults
   * to true exactly when `maxResidentChunks` was left to the default.
   */
  constructor(
      private readonly store_: StepExternalByteStore,
      chunkBytes: number = DEFAULT_CHUNK_BYTES,
      maxResidentChunks?: number,
      adaptive: boolean = maxResidentChunks === void 0 ) {

    if ( chunkBytes <= 0 || !Number.isInteger( chunkBytes ) ) {
      throw new Error( `Invalid chunkBytes ${chunkBytes}` )
    }

    const startingCap =
      Math.max( 1, maxResidentChunks ?? DEFAULT_MAX_RESIDENT_CHUNKS )

    this.chunkBytes_        = chunkBytes
    this.maxResidentChunks_ = startingCap

    if ( !adaptive ) {

      this.adaptiveCapChunks_ = startingCap
      return
    }

    // Never more chunks than the store has, and never more bytes than the
    // ceiling — so the adapted window is bounded both by the policy and by
    // what a fully-resident provider would have held anyway.
    const storeChunks =
      Math.max( 1, Math.ceil( store_.byteLength / chunkBytes ) )
    const ceilingChunks =
      Math.max( 1, Math.floor( ADAPTIVE_MAX_RESIDENT_BYTES / chunkBytes ) )

    this.adaptiveCapChunks_ =
      Math.max( startingCap, Math.min( storeChunks, ceilingChunks ) )
  }

  /**
   * Total logical size of the source bytes.
   *
   * @return {number} The byte length.
   */
  public get byteLength(): number {
    return this.store_.byteLength
  }

  /**
   * Bytes currently held resident by the provider.
   *
   * @return {number} The resident byte count.
   */
  public get residentBytes(): number {

    let total = 0

    for ( const chunk of this.chunks_.values() ) {
      total += chunk.byteLength
    }

    return total
  }

  /**
   * Number of resident chunks (telemetry/tests).
   *
   * @return {number} The chunk count.
   */
  public get residentChunkCount(): number {
    return this.chunks_.size
  }

  /**
   * The residency cap currently in force, in chunks. Equal to the
   * constructor's cap unless the adaptive policy has raised it.
   *
   * @return {number} The cap.
   */
  public get residencyCapChunks(): number {
    return this.maxResidentChunks_
  }

  /**
   * The highest cap the adaptive policy may reach, in chunks. Equal to
   * {@link residencyCapChunks}'s starting value when adaptation is off.
   *
   * @return {number} The ceiling.
   */
  public get adaptiveResidencyCapChunks(): number {
    return this.adaptiveCapChunks_
  }

  /**
   * Touch a chunk for LRU recency.
   *
   * @param chunkIndex The chunk to touch.
   * @param chunk The chunk bytes.
   */
  private touch_( chunkIndex: number, chunk: Uint8Array ): void {
    this.chunks_.delete( chunkIndex )
    this.chunks_.set( chunkIndex, chunk )
  }

  /**
   * Synchronously acquire a view containing a byte range.
   *
   * Single-chunk ranges are served as the chunk itself (zero copy);
   * straddling ranges get a standalone merged copy spanning exactly
   * the requested range.
   *
   * @param address Absolute start of the range.
   * @param length Length of the range.
   * @throws { StepBufferNotResidentError } When any covering chunk isn't resident.
   * @return {StepBufferAcquisition} The view and its base address.
   */
  public acquire( address: number, length: number ): StepBufferAcquisition {

    const chunkBytes = this.chunkBytes_
    const firstChunk = Math.floor( address / chunkBytes )
    const lastChunk  = Math.floor( ( address + Math.max( length, 1 ) - 1 ) / chunkBytes )

    if ( firstChunk === lastChunk ) {

      const chunk = this.chunks_.get( firstChunk )

      if ( chunk === void 0 ) {
        throw new StepBufferNotResidentError( address, length )
      }

      this.touch_( firstChunk, chunk )

      return { buffer: chunk, offset: firstChunk * chunkBytes }
    }

    // Straddling range — merge the covering chunks' slices into a
    // standalone per-record copy. Rare (records are usually far
    // smaller than a chunk) and bounded by the record size.
    const merged = tagBufferBase( new Uint8Array( length ), address )

    for ( let chunkIndex = firstChunk; chunkIndex <= lastChunk; ++chunkIndex ) {

      const chunk = this.chunks_.get( chunkIndex )

      if ( chunk === void 0 ) {
        throw new StepBufferNotResidentError( address, length )
      }

      this.touch_( chunkIndex, chunk )

      const chunkBase  = chunkIndex * chunkBytes
      const copyFrom   = Math.max( address, chunkBase )
      const copyTo     = Math.min( address + length, chunkBase + chunk.byteLength )

      if ( copyTo > copyFrom ) {
        merged.set(
            chunk.subarray( copyFrom - chunkBase, copyTo - chunkBase ),
            copyFrom - address )
      }
    }

    return { buffer: merged, offset: address }
  }

  /**
   * Make a byte range resident, paging missing chunks from the store
   * and evicting least-recently-used chunks beyond the cap (never the
   * chunks needed by this call).
   *
   * @param address Absolute start of the range.
   * @param length Length of the range.
   * @return {Promise< void >} Resolves when resident.
   */
  public async ensureResident( address: number, length: number ): Promise< void > {

    const chunkBytes = this.chunkBytes_
    const firstChunk = Math.floor( address / chunkBytes )
    const lastChunk  = Math.floor( ( address + Math.max( length, 1 ) - 1 ) / chunkBytes )

    // Pin this call's chunks against eviction by overlapping ensures
    // until we return — the caller's synchronous acquire runs in its
    // continuation, which can interleave with other ensures' evictions.
    for ( let chunkIndex = firstChunk; chunkIndex <= lastChunk; ++chunkIndex ) {
      this.addPin_( chunkIndex, 1 )
    }

    try {

      const loads: Promise< void >[] = []

      for ( let chunkIndex = firstChunk; chunkIndex <= lastChunk; ++chunkIndex ) {

        const resident = this.chunks_.get( chunkIndex )

        if ( resident !== void 0 ) {

          this.touch_( chunkIndex, resident )
          this.notePolicyRequest_( chunkIndex, false )
          continue
        }

        let inflight = this.loading_.get( chunkIndex )

        this.notePolicyRequest_( chunkIndex, inflight === void 0 )

        if ( inflight === void 0 ) {

          const chunkBase   = chunkIndex * chunkBytes
          const chunkLength = Math.min( chunkBytes, this.store_.byteLength - chunkBase )

          inflight = this.store_.read( chunkBase, chunkLength ).then( ( chunk ) => {

            tagBufferBase( chunk, chunkBase )

            this.chunks_.set( chunkIndex, chunk )
            this.loading_.delete( chunkIndex )

            return chunk
          }, ( error ) => {

            this.loading_.delete( chunkIndex )
            throw error
          })

          this.loading_.set( chunkIndex, inflight )
        }

        loads.push( inflight.then( () => void 0 ) )
      }

      if ( loads.length > 0 ) {
        await Promise.all( loads )
      }

      // Evict beyond the cap, oldest first, sparing pinned chunks
      // (this call's own range is pinned above).
      if ( this.chunks_.size > this.maxResidentChunks_ ) {

        for ( const candidate of this.chunks_.keys() ) {

          if ( this.chunks_.size <= this.maxResidentChunks_ ) {
            break
          }

          if ( ( this.ensurePins_.get( candidate ) ?? 0 ) > 0 ) {
            continue
          }

          this.chunks_.delete( candidate )
          this.rememberEvicted_( candidate )
        }
      }

    } finally {

      for ( let chunkIndex = firstChunk; chunkIndex <= lastChunk; ++chunkIndex ) {
        this.addPin_( chunkIndex, -1 )
      }
    }
  }

  /**
   * Hold a range against LRU eviction until {@link unpinRange}.
   *
   * @param address Absolute start of the range.
   * @param length Length of the range.
   */
  public pinRange( address: number, length: number ): void {

    for ( const chunkIndex of this.chunkSpan_( address, length ) ) {
      this.addPin_( chunkIndex, 1 )
    }
  }

  /**
   * Drop one {@link pinRange} hold.
   *
   * @param address Absolute start of the range.
   * @param length Length of the range.
   */
  public unpinRange( address: number, length: number ): void {

    for ( const chunkIndex of this.chunkSpan_( address, length ) ) {
      this.addPin_( chunkIndex, -1 )
    }
  }

  /**
   * Chunk indices covering `[address, address + length)`.
   *
   * @param address Absolute start.
   * @param length Length in bytes.
   * @return {number[]} Inclusive chunk indices.
   */
  private chunkSpan_( address: number, length: number ): number[] {

    const chunkBytes = this.chunkBytes_
    const firstChunk = Math.floor( address / chunkBytes )
    const lastChunk  = Math.floor( ( address + Math.max( length, 1 ) - 1 ) / chunkBytes )
    const span: number[] = []

    for ( let chunkIndex = firstChunk; chunkIndex <= lastChunk; ++chunkIndex ) {
      span.push( chunkIndex )
    }

    return span
  }

  /**
   * Record that a chunk left the window, so a later load of it can be
   * recognised as a capacity miss rather than a first touch. The ghost
   * list is the size of the cache, which is what makes a ghost hit mean
   * "a window twice this size would have held it".
   *
   * @param chunkIndex The evicted chunk.
   */
  private rememberEvicted_( chunkIndex: number ): void {

    if ( this.maxResidentChunks_ >= this.adaptiveCapChunks_ ) {

      // At the ceiling — or never adapting at all — there is no decision
      // left for this list to inform, so drop it and stop paying for it.
      // A provider with an explicit cap takes this branch on every
      // eviction it ever performs, so it must stay a single comparison.
      if ( this.ghostChunks_.size > 0 ) {
        this.ghostChunks_.clear()
      }

      return
    }

    this.ghostChunks_.add( chunkIndex )

    while ( this.ghostChunks_.size > this.maxResidentChunks_ ) {

      const oldest = this.ghostChunks_.values().next()

      if ( oldest.done === true ) {
        break
      }

      this.ghostChunks_.delete( oldest.value )
    }
  }

  /**
   * Feed one chunk request to the residency policy, and evaluate it at
   * interval boundaries.
   *
   * Only requests that reach the store count as loads here: a request the
   * provider de-duplicates against an in-flight read costs no bytes, and
   * counting those would inflate the miss signal by the fan-out of a
   * closure walk's `Promise.all` rather than by anything the window did.
   *
   * @param chunkIndex The chunk requested.
   * @param isLoad Whether this request is issuing a store read.
   */
  private notePolicyRequest_( chunkIndex: number, isLoad: boolean ): void {

    if ( this.maxResidentChunks_ >= this.adaptiveCapChunks_ ) {
      return
    }

    ++this.intervalRequests_

    if ( isLoad ) {

      ++this.intervalLoads_

      if ( this.ghostChunks_.delete( chunkIndex ) ) {
        ++this.intervalCapacityMisses_
      }
    }

    if ( this.intervalRequests_ < ADAPTIVE_EVAL_REQUESTS ) {
      return
    }

    if ( this.intervalCapacityMisses_ >= ADAPTIVE_GROWTH_CAPACITY_MISSES &&
         this.intervalCapacityMisses_ >=
           ADAPTIVE_GROWTH_MISS_FRACTION * this.intervalLoads_ ) {

      this.maxResidentChunks_ =
        Math.min( this.adaptiveCapChunks_, this.maxResidentChunks_ * 2 )
    }

    this.intervalRequests_       = 0
    this.intervalLoads_          = 0
    this.intervalCapacityMisses_ = 0
  }

  /**
   * Adjust a chunk's pin count, deleting the entry at zero.
   *
   * @param chunkIndex The chunk.
   * @param delta +1 pin or -1 unpin.
   */
  private addPin_( chunkIndex: number, delta: number ): void {

    const pins = ( this.ensurePins_.get( chunkIndex ) ?? 0 ) + delta

    if ( pins <= 0 ) {
      this.ensurePins_.delete( chunkIndex )
    } else {
      this.ensurePins_.set( chunkIndex, pins )
    }
  }
}
