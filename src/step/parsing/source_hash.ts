import { yieldToEventLoop } from '../../core/progress'
import { AsyncByteSource, ByteSource, ReadableByteSource } from './byte_source'


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
 */
export class HashingByteSource implements AsyncByteSource {

  private hash_: number = FNV_OFFSET_BASIS >>> 0

  private covered_: number = 0

  /**
   * @param inner_ The source to read through.
   */
  constructor( private readonly inner_: ReadableByteSource ) {}

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

      this.hash_ = foldFnv1a( into, fresh, intoOffset + got, this.hash_ )
      this.covered_ = end
    }

    return got
  }

  /**
   * Fold any bytes the parse never read, and return the digest.
   *
   * @return {Promise<number>} The 32-bit hash of the whole source,
   * identical to `hashSource` over the same bytes.
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

        this.hash_ = foldFnv1a( chunk, 0, got, this.hash_ )
        this.covered_ += got
      }
    }

    return this.hash_ >>> 0
  }
}


/**
 * The synchronous twin of {@link HashingByteSource}, for the synchronous
 * streaming build (`openStreamedIfcModel`): same sequential-read contract,
 * same digest, a synchronous {@link finish}.
 */
export class HashingSyncByteSource implements ByteSource {

  private hash_: number = FNV_OFFSET_BASIS >>> 0

  private covered_: number = 0

  /**
   * @param inner_ The source to read through.
   */
  constructor( private readonly inner_: ByteSource ) {}

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
 * @return {Promise<number>} The 32-bit FNV-1a of every byte of `source`.
 */
export async function hashSourceAsync(
    source: ReadableByteSource,
    chunkBytes: number = TAIL_CHUNK_BYTES ): Promise<number> {

  const total = source.byteLength
  const chunk = new Uint8Array( Math.max( 1, Math.min( chunkBytes, total ) ) )

  let hash = FNV_OFFSET_BASIS >>> 0
  let covered = 0

  while ( covered < total ) {

    const got = await source.read(
        covered, Math.min( chunk.length, total - covered ), chunk, 0 )

    if ( got <= 0 ) {
      throw new Error(
          `Source ended at ${covered} of ${total} bytes while hashing it` )
    }

    hash = foldFnv1a( chunk, 0, got, hash )
    covered += got

    if ( covered < total ) {
      await yieldToEventLoop()
    }
  }

  return hash >>> 0
}
