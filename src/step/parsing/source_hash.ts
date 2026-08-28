import { fnv1a } from '../../indexing/hashing'
import { AsyncByteSource, ReadableByteSource } from './byte_source'


/** Tail read size when finishing a hash the parse did not reach the end of. */
// eslint-disable-next-line no-magic-numbers
const TAIL_CHUNK_BYTES = 4 * 1024 * 1024

/** FNV-1a 32-bit offset basis — the seed `hashSource` starts from. */
const FNV_OFFSET_BASIS = 2166136261


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
 * The parse is already touching every byte in order. Wrapping its source
 * folds the hash into that pass: ~1.5 s of CPU on a 900 MB model, **zero**
 * extra I/O, and no format or digest change — `src/indexing/hashing.ts`'s
 * `fnv1a` is range-scoped and resumable with the same basis and prime, so
 * chaining it over the parse's windows reproduces `hashSource` byte for
 * byte (pinned by `source_hash.test.ts`).
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

      this.hash_ = fnv1a( into, fresh, intoOffset + got, this.hash_ )
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

        this.hash_ = fnv1a( chunk, 0, got, this.hash_ )
        this.covered_ += got
      }
    }

    return this.hash_ >>> 0
  }
}
