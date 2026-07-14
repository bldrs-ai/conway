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
 *    is advisory — descriptors that captured a chunk keep it alive
 *    via their own reference, so correctness never depends on the
 *    residency set; only memory does.
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

  private readonly maxResidentChunks_: number

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
   * @param store_ The store holding the source bytes.
   * @param chunkBytes Chunk size in bytes (default 4MiB).
   * @param maxResidentChunks LRU residency cap in chunks (default 16).
   */
  constructor(
      private readonly store_: StepExternalByteStore,
      chunkBytes: number = DEFAULT_CHUNK_BYTES,
      maxResidentChunks: number = DEFAULT_MAX_RESIDENT_CHUNKS ) {

    if ( chunkBytes <= 0 || !Number.isInteger( chunkBytes ) ) {
      throw new Error( `Invalid chunkBytes ${chunkBytes}` )
    }

    this.chunkBytes_        = chunkBytes
    this.maxResidentChunks_ = Math.max( 1, maxResidentChunks )
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
      this.ensurePins_.set( chunkIndex, ( this.ensurePins_.get( chunkIndex ) ?? 0 ) + 1 )
    }

    try {

      const loads: Promise< void >[] = []

      for ( let chunkIndex = firstChunk; chunkIndex <= lastChunk; ++chunkIndex ) {

        const resident = this.chunks_.get( chunkIndex )

        if ( resident !== void 0 ) {

          this.touch_( chunkIndex, resident )
          continue
        }

        let inflight = this.loading_.get( chunkIndex )

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
        }
      }

    } finally {

      for ( let chunkIndex = firstChunk; chunkIndex <= lastChunk; ++chunkIndex ) {

        const pins = this.ensurePins_.get( chunkIndex ) ?? 0

        if ( pins <= 1 ) {
          this.ensurePins_.delete( chunkIndex )
        } else {
          this.ensurePins_.set( chunkIndex, pins - 1 )
        }
      }
    }
  }
}
