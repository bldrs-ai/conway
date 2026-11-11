import { yieldToEventLoop } from '../../core/progress'
import { AsyncByteSource, ByteSource, ReadableByteSource } from './byte_source'
import {
  SIDECAR_HASH_FNV1A_32,
  SIDECAR_HASH_SHA256_BLOCKS,
  SampledHashFold,
} from './index_sidecar'


/** Tail read size when finishing a hash the parse did not reach the end of. */
// eslint-disable-next-line no-magic-numbers
const TAIL_CHUNK_BYTES = 4 * 1024 * 1024

/** FNV-1a 32-bit offset basis — the seed `hashSource` starts from. */
const FNV_OFFSET_BASIS = 2166136261

/** FNV-1a 32-bit prime. */
const FNV_PRIME = 16777619


/**
 * Fold `data[start, end)` into a running FNV-1a — `hashSource`'s loop, made
 * range-scoped and resumable so chaining it over windows reproduces the
 * whole-buffer digest.
 *
 * Deliberately not `src/indexing/hashing.ts`'s `fnv1a`, which computes the
 * same digest by the shift-and-add expansion of the prime: that form lets
 * the running value grow past 32 bits between iterations, so V8 keeps it as
 * a double, and it measured **~6× slower** than this `Math.imul` loop on a
 * 200 MiB buffer in Node 22 (1.55 s vs 0.27 s) — the difference between a
 * ~1.5 s and a ~7 s hash on a 900 MB model (conway#756).
 *
 * @param data The bytes.
 * @param start First byte to fold.
 * @param end One past the last byte to fold.
 * @param hash The running hash.
 * @return {number} The updated hash, unsigned.
 */
function foldFnv1a( data: Uint8Array, start: number, end: number, hash: number ): number {

  for ( let where = start; where < end; ++where ) {
    hash ^= data[ where ]
    hash = Math.imul( hash, FNV_PRIME )
  }

  return hash >>> 0
}


/**
 * Which whole-source digest an open records (`SOURCE_HASH_ALGORITHM` /
 * `sourceHashAlgorithm`), and which a sidecar's `hashAlgorithm` slot names:
 *
 *  - `'fnv1a32'` — chained FNV-1a 32 over every byte ({@link foldFnv1a},
 *    `hashSource`), sidecar id {@link SIDECAR_HASH_FNV1A_32}. The default,
 *    and the only digest a synchronous open can take.
 *  - `'sha256Blocks'` — {@link Sha256BlockFold}: native SHA-256 of each
 *    {@link SOURCE_HASH_BLOCK_BYTES} block of the file, chained, sidecar id
 *    {@link SIDECAR_HASH_SHA256_BLOCKS}. Needs a WebCrypto
 *    `crypto.subtle.digest`; without one an open records `'fnv1a32'`.
 *
 * Why the second exists (bldrs-ai/Share#2092): the FNV loop is one serial
 * xor → `Math.imul` dependency chain per byte, so even fully optimised it
 * runs at the multiply's latency (~1 ns/byte: ~1 s on a 900 MB model in V8),
 * and in any tier below the optimising JIT it runs several times slower. On
 * Firefox, whose engine worker discarded its JIT code at most major GCs of a
 * PSB parse, the hash and export together cost ~10 s of a 40.7 s parse. The
 * block digest moves the per-byte work out of JS altogether: the parse's
 * thread only hands each 4 MiB block to `digest` (which copies it
 * synchronously, per the WebCrypto spec) and the hashing itself is native
 * — off the thread entirely where the platform runs digests on a worker
 * pool (Node's libuv pool does).
 */
export type SourceHashAlgorithm = 'fnv1a32' | 'sha256Blocks'


/**
 * Block size of the {@link Sha256BlockFold} digest, in bytes. Part of the
 * digest's definition (blocks are cut at multiples of this from file
 * offset 0, whatever reads the bytes arrive in), so changing it is a new
 * algorithm id, not a tweak.
 */
// eslint-disable-next-line no-magic-numbers
export const SOURCE_HASH_BLOCK_BYTES = 4 * 1024 * 1024

/**
 * Block digests a {@link Sha256BlockFold} lets run before its feeder waits
 * for the oldest: each holds a native copy of its 4 MiB block until it
 * resolves, so this bounds that memory at 32 MiB if the digests ever fall
 * behind the parse (they run at GB/s against a parse's tens of MB/s, so in
 * practice they do not).
 */
export const MAX_BLOCK_DIGESTS_IN_FLIGHT = 8

// SHA-256 digest length.
const SHA256_BYTES = 32

// The length prefix of the final digest's input: an f64, little-endian.
const LENGTH_PREFIX_BYTES = 8


/**
 * The part of WebCrypto's `SubtleCrypto` the block digest uses. Structural,
 * so a test can count what reaches it.
 */
export interface SourceDigestProvider {

  /**
   * @param algorithm Always `'SHA-256'` here.
   * @param data The bytes; copied before this returns (WebCrypto §14.3.1).
   * @return {Promise<ArrayBuffer>} The digest.
   */
  digest( algorithm: 'SHA-256', data: Uint8Array ): Promise< ArrayBuffer >
}


/**
 * This platform's WebCrypto digest (`globalThis.crypto.subtle`): present in
 * browser windows and workers in a secure context, and in Node from 19 on
 * (17.x–18.x behind `--experimental-global-webcrypto`).
 *
 * @return {SourceDigestProvider | undefined} The provider, or undefined
 * where there is none.
 */
export function nativeDigestProvider(): SourceDigestProvider | undefined {

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subtle = ( globalThis as any ).crypto?.subtle

  return typeof subtle?.digest === 'function' ? subtle as SourceDigestProvider : void 0
}


/**
 * The algorithm an open will actually record when `requested` is asked for:
 * `'sha256Blocks'` only when there is a digest provider to run it, else
 * `'fnv1a32'` (which is also the default).
 *
 * @param requested What the caller asked for.
 * @param provider The digest provider there is, if any (an open passes
 * {@link nativeDigestProvider}'s).
 * @return {SourceHashAlgorithm} What to record.
 */
export function resolveSourceHashAlgorithm(
    requested: SourceHashAlgorithm | undefined,
    provider: SourceDigestProvider | undefined ): SourceHashAlgorithm {

  return requested === 'sha256Blocks' && provider !== void 0 ? 'sha256Blocks' : 'fnv1a32'
}


/**
 * @param algorithm The algorithm.
 * @return {number} Its sidecar `hashAlgorithm` id.
 */
export function sidecarHashAlgorithmId( algorithm: SourceHashAlgorithm ): number {
  return algorithm === 'sha256Blocks' ? SIDECAR_HASH_SHA256_BLOCKS : SIDECAR_HASH_FNV1A_32
}


/**
 * The `'sha256Blocks'` source digest, folded from bytes that arrive once, in
 * file order, in reads of any shape:
 *
 * ```
 *   block_i = SHA-256( source[ i·B, min( (i+1)·B, length ) ) )   B = 4 MiB
 *   digest  = first 4 bytes, little-endian, of
 *             SHA-256( f64le( length ) ‖ block_0 ‖ … ‖ block_(n−1) )
 * ```
 *
 * Truncated to 32 bits because that is the sidecar's slot (a wider one is a
 * format version, not this change); as with FNV, it detects a *changed*
 * file, it is not a security boundary (`index_sidecar.ts` §"The trust
 * gate").
 *
 * Feeding costs the caller's thread one `digest` call per block — the call
 * copies the block before it returns, so a read buffer the parse reuses at
 * once is safe to pass — plus a `set` into a staging block for a block that
 * straddles two reads. No byte is touched by a JS loop. At most
 * {@link MAX_BLOCK_DIGESTS_IN_FLIGHT} digests are left running; a feeder
 * that can await calls {@link settle} after each fold to stay inside that.
 */
export class Sha256BlockFold {

  private readonly blockDigests_: Array< Uint8Array | undefined > = []

  private readonly pending_: Array< Promise< void > | undefined > = []

  private inFlight_ = 0

  private oldestUnsettled_ = 0

  private failure_: { error: unknown } | undefined

  private staging_: Uint8Array | undefined

  private stagingFill_ = 0

  private fed_ = 0

  private nativeBytes_ = 0

  /**
   * @param byteLength_ The length of the source that will be fed.
   * @param provider_ The digest provider.
   */
  constructor(
      private readonly byteLength_: number,
      private readonly provider_: SourceDigestProvider ) {}

  /**
   * @return {number} Bytes handed to the native digest so far, staging
   * included — every byte of the source exactly once, once finished.
   */
  public get nativeBytes(): number {
    return this.nativeBytes_
  }

  /**
   * @return {number} Block digests started and not yet resolved.
   */
  public get inFlight(): number {
    return this.inFlight_
  }

  /**
   * Fold `bytes[from, to)`, the next bytes of the source in file order.
   *
   * @param bytes The buffer.
   * @param from First index in `bytes`.
   * @param to One past the last index in `bytes`.
   */
  public fold( bytes: Uint8Array, from: number, to: number ): void {

    let at = from

    while ( at < to ) {

      if ( this.stagingFill_ === 0 && to - at >= SOURCE_HASH_BLOCK_BYTES ) {

        // A whole block in this read: straight to the digest, no JS copy.
        this.submit_( bytes.subarray( at, at + SOURCE_HASH_BLOCK_BYTES ) )
        at += SOURCE_HASH_BLOCK_BYTES
        continue
      }

      const staging = this.staging_ ??= new Uint8Array( SOURCE_HASH_BLOCK_BYTES )
      const take = Math.min( SOURCE_HASH_BLOCK_BYTES - this.stagingFill_, to - at )

      staging.set( bytes.subarray( at, at + take ), this.stagingFill_ )
      this.stagingFill_ += take
      at += take

      if ( this.stagingFill_ === SOURCE_HASH_BLOCK_BYTES ) {
        // Reused at once: `digest` has already copied it.
        this.submit_( staging )
        this.stagingFill_ = 0
      }
    }

    this.fed_ += to - from
  }

  /**
   * Wait until no more than `maxInFlight` block digests are running.
   *
   * @param maxInFlight The bound (default {@link MAX_BLOCK_DIGESTS_IN_FLIGHT}).
   */
  public async settle( maxInFlight: number = MAX_BLOCK_DIGESTS_IN_FLIGHT ): Promise< void > {

    while ( this.inFlight_ > maxInFlight && this.oldestUnsettled_ < this.pending_.length ) {

      const oldest = this.pending_[ this.oldestUnsettled_ ]

      this.pending_[ this.oldestUnsettled_++ ] = void 0
      await oldest
    }
  }

  /**
   * Close the last (short) block and return the digest. Every byte of the
   * source must have been fed.
   *
   * @return {Promise<number>} The 32-bit digest.
   */
  public async finish(): Promise< number > {

    if ( this.fed_ !== this.byteLength_ ) {
      throw new Error(
          `Sha256BlockFold was fed ${this.fed_} of ${this.byteLength_} bytes` )
    }

    if ( this.stagingFill_ > 0 ) {
      this.submit_( this.staging_!.subarray( 0, this.stagingFill_ ) )
      this.stagingFill_ = 0
    }

    await Promise.all( this.pending_ )

    if ( this.failure_ !== void 0 ) {
      throw this.failure_.error
    }

    const chain = new Uint8Array( LENGTH_PREFIX_BYTES + this.blockDigests_.length * SHA256_BYTES )

    new DataView( chain.buffer ).setFloat64( 0, this.byteLength_, true )

    this.blockDigests_.forEach( ( digest, block ) =>
      chain.set( digest!, LENGTH_PREFIX_BYTES + block * SHA256_BYTES ) )

    const final = await this.provider_.digest( 'SHA-256', chain )

    return new DataView( final ).getUint32( 0, true )
  }

  /**
   * Start one block's digest.
   *
   * @param block The block's bytes (copied by the provider before it returns).
   */
  private submit_( block: Uint8Array ): void {

    const index = this.blockDigests_.length

    this.blockDigests_.push( void 0 )
    this.nativeBytes_ += block.byteLength
    ++this.inFlight_

    // Both outcomes are caught here, so a rejection is never unhandled;
    // `finish` rethrows the first one.
    this.pending_.push( this.provider_.digest( 'SHA-256', block ).then(
        ( digest ) => {
          this.blockDigests_[ index ] = new Uint8Array( digest )
          --this.inFlight_
        },
        ( error: unknown ) => {
          this.failure_ ??= { error }
          --this.inFlight_
        } ) )
  }
}


/**
 * Options for the hashing sources and {@link hashSourceAsync}.
 */
export interface SourceHashOptions {

  /** Which digest to take (default `'fnv1a32'`). */
  algorithm?: SourceHashAlgorithm

  /**
   * The digest provider for `'sha256Blocks'` (default
   * {@link nativeDigestProvider}). Requesting `'sha256Blocks'` with none
   * available throws: resolve the request with
   * {@link resolveSourceHashAlgorithm} first.
   */
  provider?: SourceDigestProvider
}


/**
 * The {@link SourceHashOptions} an open passes its hasher for a requested
 * algorithm: the request resolved against this platform
 * ({@link resolveSourceHashAlgorithm}), so asking for `'sha256Blocks'`
 * where there is no WebCrypto digest records FNV-1a rather than failing
 * the open.
 *
 * @param requested What the caller asked for (`SOURCE_HASH_ALGORITHM` /
 * `sourceHashAlgorithm`).
 * @return {SourceHashOptions} The options.
 */
export function sourceHashOptionsFor(
    requested: SourceHashAlgorithm | undefined ): SourceHashOptions {

  return { algorithm: resolveSourceHashAlgorithm( requested, nativeDigestProvider() ) }
}


/**
 * The block fold for `options`, or undefined for FNV.
 *
 * @param byteLength The source length.
 * @param options The options.
 * @return {Sha256BlockFold | undefined} The fold.
 */
function blockFoldFor(
    byteLength: number,
    options: SourceHashOptions | undefined ): Sha256BlockFold | undefined {

  if ( options?.algorithm !== 'sha256Blocks' ) {
    return void 0
  }

  const provider = options.provider ?? nativeDigestProvider()

  if ( provider === void 0 ) {
    throw new Error(
        'sha256Blocks source hash requested with no crypto.subtle.digest on ' +
        'this platform (resolve it with resolveSourceHashAlgorithm)' )
  }

  return new Sha256BlockFold( byteLength, provider )
}


/**
 * A {@link ReadableByteSource} decorator that folds every byte it serves
 * into a running FNV-1a, producing the **same digest as
 * `hashSource( wholeFile )`** without ever materialising the file.
 *
 * ## Why this exists
 *
 * The sidecar's trust gate is a hash of the source (see
 * `index_sidecar.ts`). Taking it the obvious way means reading the whole
 * file a second time: `hashSource` needs a materialised `Uint8Array`, and
 * on the store-backed path the source is never materialised — the parse
 * windows 16 MiB at a time. Worse, if each *consumer* of a distributed
 * index verifies independently, that second read happens N times, which is
 * the N-way I/O a shared index exists to remove (conway#541).
 *
 * The parse is already touching every byte in order, so wrapping its source
 * would fold the hash into that pass: ~1.2 s of CPU on a 900 MB model,
 * **zero** extra I/O, and no format or digest change — {@link foldFnv1a}
 * is range-scoped and resumable with the same basis and prime, so chaining
 * it over the parse's windows reproduces `hashSource` byte for byte (pinned
 * by `source_hash.test.ts`, over the real window shapes the streaming
 * builder produces).
 *
 * **Every streaming IFC open wraps its parse source in one of these** (or
 * {@link HashingSyncByteSource}) when asked to (`RECORD_SOURCE_HASH` /
 * `recordSourceHash`, opt-in) and records the digest on the model as
 * `StepModelBase.indexedSourceHash` (conway#756). That is what binds an
 * exported sidecar's hash to the bytes its index was built from, rather
 * than to whatever the source holds when the export runs — a resident
 * buffer mutated after open, or a same-length store swapped in by
 * `SpillModelSource`, would otherwise be recorded under the new bytes'
 * hash and pass a verified reopen with the old offsets.
 *
 * ## The sequential-read contract
 *
 * A one-pass hash is only meaningful if the bytes arrive in file order,
 * once. This tracks how far it has covered from offset 0 and:
 *
 *  - folds only the part of a read that extends past the cursor, so the
 *    streaming builder's overlapping window refills and its rare
 *    grow-and-restart (which re-reads from 0) are absorbed correctly;
 *  - **throws** on a read that starts past the cursor, because a gap
 *    would silently produce a digest of a different byte string. A hash
 *    that quietly means nothing is the failure mode worth being loud
 *    about.
 *
 * {@link finishAsync} closes the remaining tail — a parse that stops at
 * `END-ISO-10303-21` before the window reaches EOF leaves bytes unread,
 * and the digest has to cover them to equal `hashSource`.
 *
 * ## Which digest
 *
 * FNV-1a by default. With `{ algorithm: 'sha256Blocks' }` the whole-source
 * digest is a {@link Sha256BlockFold} instead (bldrs-ai/Share#2092): each
 * read's fresh bytes go to the native digest, a 4 MiB block at a time, and
 * no JS loop runs over them — the sequential-read contract and the tail
 * are unchanged, and so is the sampled digest (FNV-1a over ~0.5 MB). The
 * read awaits the oldest block digest only when more than
 * {@link MAX_BLOCK_DIGESTS_IN_FLIGHT} are running.
 */
export class HashingByteSource implements AsyncByteSource {

  private hash_: number = FNV_OFFSET_BASIS >>> 0

  private covered_: number = 0

  // Set for 'sha256Blocks': the whole-source digest goes here instead of
  // the FNV loop.
  private readonly blocks_: Sha256BlockFold | undefined

  /**
   * @param inner_ The source to read through.
   * @param options Which digest (default FNV-1a, `hashSource`'s).
   */
  constructor( private readonly inner_: ReadableByteSource, options?: SourceHashOptions ) {
    this.sampled_ = new SampledHashFold( inner_.byteLength )
    this.blocks_ = blockFoldFor( inner_.byteLength, options )
  }

  /**
   * @return {SourceHashAlgorithm} The whole-source digest this takes.
   */
  public get algorithm(): SourceHashAlgorithm {
    return this.blocks_ !== void 0 ? 'sha256Blocks' : 'fnv1a32'
  }

  /**
   * @return {number} Source bytes handed to the native digest so far (0
   * under FNV) — every byte exactly once by the time
   * {@link finishAsync} resolves under `'sha256Blocks'`.
   */
  public get nativeDigestBytes(): number {
    return this.blocks_?.nativeBytes ?? 0
  }

  // The sampled digest (index_sidecar.ts#sampledSourceSpans), folded in the
  // same pass, so an open records it with no read of its own (conway#758).
  private readonly sampled_: SampledHashFold

  /**
   * The sampled digest of the bytes read so far; the whole source's once
   * {@link finishAsync} has resolved.
   *
   * @return {number} The digest.
   */
  public get sampledHash(): number {
    return this.sampled_.digest
  }

  /**
   * @return {number} The wrapped source's length.
   */
  public get byteLength(): number {
    return this.inner_.byteLength
  }

  /**
   * @return {number} Bytes hashed so far, counted from offset 0.
   */
  public get covered(): number {
    return this.covered_
  }

  /**
   * Read through to the wrapped source, folding the newly-seen bytes.
   *
   * @param offset Absolute source offset to read from.
   * @param length Maximum number of bytes to read.
   * @param into Destination buffer.
   * @param intoOffset Offset within `into` to write at.
   * @return {Promise<number>} The number of bytes copied.
   */
  public async read(
      offset: number,
      length: number,
      into: Uint8Array,
      intoOffset: number ): Promise<number> {

    if ( offset > this.covered_ ) {
      throw new Error(
          `HashingByteSource requires sequential reads: read at ${offset} ` +
          `skips past the hashed cursor ${this.covered_}` )
    }

    const got = await this.inner_.read( offset, length, into, intoOffset )
    const end = offset + got

    if ( end > this.covered_ ) {

      const fresh = intoOffset + ( this.covered_ - offset )

      this.foldFresh_( into, fresh, intoOffset + got )
      this.covered_ = end

      // Back-pressure only: the digests run at native speed, far ahead of
      // the parse, so this rarely waits — and an FNV read never awaits
      // anything it did not await before.
      if ( this.blocks_ !== void 0 && this.blocks_.inFlight > MAX_BLOCK_DIGESTS_IN_FLIGHT ) {
        await this.blocks_.settle()
      }
    }

    return got
  }

  /**
   * Fold any bytes the parse never read, and return the digest.
   *
   * @return {Promise<number>} The 32-bit hash of the whole source: under
   * FNV identical to `hashSource` over the same bytes, under
   * `'sha256Blocks'` to {@link hashSourceAsync} with that algorithm.
   */
  public async finishAsync(): Promise<number> {

    if ( this.covered_ < this.byteLength ) {

      const chunk = new Uint8Array(
          Math.min( TAIL_CHUNK_BYTES, this.byteLength - this.covered_ ) )

      while ( this.covered_ < this.byteLength ) {

        const got =
          await this.inner_.read( this.covered_, chunk.length, chunk, 0 )

        if ( got <= 0 ) {
          throw new Error(
              `Source ended at ${this.covered_} of ${this.byteLength} bytes ` +
              'while completing its hash' )
        }

        this.foldFresh_( chunk, 0, got )
        this.covered_ += got

        if ( this.blocks_ !== void 0 ) {
          await this.blocks_.settle()
        }
      }
    }

    return this.blocks_ !== void 0 ? await this.blocks_.finish() : this.hash_ >>> 0
  }

  /**
   * Fold `bytes[from, to)`, which holds the source from `covered_` on, into
   * both digests.
   *
   * @param bytes The buffer.
   * @param from First index.
   * @param to One past the last index.
   */
  private foldFresh_( bytes: Uint8Array, from: number, to: number ): void {

    if ( this.blocks_ !== void 0 ) {
      this.blocks_.fold( bytes, from, to )
    } else {
      this.hash_ = foldFnv1a( bytes, from, to, this.hash_ )
    }

    this.sampled_.fold( bytes, from, to, this.covered_ )
  }
}


/**
 * The synchronous twin of {@link HashingByteSource}, for the synchronous
 * streaming build (`openStreamedIfcModel`): same sequential-read contract,
 * same digest, a synchronous {@link finish}. FNV-1a only: a native digest
 * resolves asynchronously, which a synchronous open cannot wait for.
 */
export class HashingSyncByteSource implements ByteSource {

  private hash_: number = FNV_OFFSET_BASIS >>> 0

  private covered_: number = 0

  /**
   * @param inner_ The source to read through.
   */
  constructor( private readonly inner_: ByteSource ) {
    this.sampled_ = new SampledHashFold( inner_.byteLength )
  }

  // See HashingByteSource's sampled_.
  private readonly sampled_: SampledHashFold

  /**
   * The sampled digest of the bytes read so far; the whole source's once
   * {@link finish} has run.
   *
   * @return {number} The digest.
   */
  public get sampledHash(): number {
    return this.sampled_.digest
  }

  /**
   * @return {number} The wrapped source's length.
   */
  public get byteLength(): number {
    return this.inner_.byteLength
  }

  /**
   * @return {number} Bytes hashed so far, counted from offset 0.
   */
  public get covered(): number {
    return this.covered_
  }

  /**
   * Read through to the wrapped source, folding the newly-seen bytes.
   *
   * @param offset Absolute source offset to read from.
   * @param length Maximum number of bytes to read.
   * @param into Destination buffer.
   * @param intoOffset Offset within `into` to write at.
   * @return {number} The number of bytes copied.
   */
  public read(
      offset: number,
      length: number,
      into: Uint8Array,
      intoOffset: number ): number {

    if ( offset > this.covered_ ) {
      throw new Error(
          `HashingSyncByteSource requires sequential reads: read at ${offset} ` +
          `skips past the hashed cursor ${this.covered_}` )
    }

    const got = this.inner_.read( offset, length, into, intoOffset )
    const end = offset + got

    if ( end > this.covered_ ) {

      const fresh = intoOffset + ( this.covered_ - offset )

      this.hash_ = foldFnv1a( into, fresh, intoOffset + got, this.hash_ )
      this.sampled_.fold( into, fresh, intoOffset + got, this.covered_ )
      this.covered_ = end
    }

    return got
  }

  /**
   * Fold any bytes the parse never read, and return the digest.
   *
   * @return {number} The 32-bit hash of the whole source.
   */
  public finish(): number {

    if ( this.covered_ < this.byteLength ) {

      const chunk = new Uint8Array(
          Math.min( TAIL_CHUNK_BYTES, this.byteLength - this.covered_ ) )

      while ( this.covered_ < this.byteLength ) {

        const got = this.inner_.read( this.covered_, chunk.length, chunk, 0 )

        if ( got <= 0 ) {
          throw new Error(
              `Source ended at ${this.covered_} of ${this.byteLength} bytes ` +
              'while completing its hash' )
        }

        this.hash_ = foldFnv1a( chunk, 0, got, this.hash_ )
        this.sampled_.fold( chunk, 0, got, this.covered_ )
        this.covered_ += got
      }
    }

    return this.hash_ >>> 0
  }
}


/**
 * Hash a whole source in bounded chunks, yielding to the event loop between
 * them — the same digest as `hashSource( wholeFile )` (one chained FNV-1a,
 * pinned by `source_hash.test.ts`), for a source that is not, or should not
 * be, one materialised buffer.
 *
 * Used where there is no streaming pass to fold the hash into — the classic
 * cooperative open over a resident buffer, and the index-first open's
 * `verifySourceHash` — so it gives the loop a task boundary per chunk rather
 * than holding it for the ~1.2 s a 900 MB file costs. A
 * {@link HashingByteSource} over the same source gives the same number but
 * awaits only microtasks on a synchronous source, which never lets a
 * message through.
 *
 * @param source The source to hash, read sequentially from offset 0.
 * @param chunkBytes Read size (default 4 MiB).
 * @param options Which digest (default FNV-1a); `'sha256Blocks'` is the
 * {@link Sha256BlockFold} digest, the same number a
 * {@link HashingByteSource} with that algorithm records.
 * @return {Promise<number>} The 32-bit digest of every byte of `source`.
 */
export async function hashSourceAsync(
    source: ReadableByteSource,
    chunkBytes: number = TAIL_CHUNK_BYTES,
    options?: SourceHashOptions ): Promise<number> {

  const total = source.byteLength
  const chunk = new Uint8Array( Math.max( 1, Math.min( chunkBytes, total ) ) )
  const blocks = blockFoldFor( total, options )

  let hash = FNV_OFFSET_BASIS >>> 0
  let covered = 0

  while ( covered < total ) {

    const got = await source.read(
        covered, Math.min( chunk.length, total - covered ), chunk, 0 )

    if ( got <= 0 ) {
      throw new Error(
          `Source ended at ${covered} of ${total} bytes while hashing it` )
    }

    if ( blocks !== void 0 ) {
      blocks.fold( chunk, 0, got )
      await blocks.settle()
    } else {
      hash = foldFnv1a( chunk, 0, got, hash )
    }

    covered += got

    if ( covered < total ) {
      await yieldToEventLoop()
    }
  }

  return blocks !== void 0 ? await blocks.finish() : hash >>> 0
}
