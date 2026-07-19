import { StepExternalByteStore } from '../step_buffer_provider'


/**
 * Fetch accounting for a {@link RangeByteSource}: how many range requests were
 * issued and how many bytes actually crossed the wire, versus how many the
 * caller asked for. The gap between `bytesFetched` and `bytesServed` is the
 * over-read imposed by block alignment (a real HTTP-Range / OPFS-block store
 * can only fetch whole blocks); a small gap means the access pattern has good
 * locality — the property an index-first open (M4) leans on.
 */
export interface RangeFetchStats {

  /** Number of `read` calls that reached the backing store. */
  requestCount: number

  /** Total bytes actually fetched from the backing store (aligned spans). */
  bytesFetched: number

  /** Total bytes handed back to callers (the sum of requested lengths). */
  bytesServed: number
}


// Default block granularity when none is given: reads are unaligned, so
// `bytesFetched` equals `bytesServed` (each read fetches exactly its range).
const NO_ALIGNMENT = 1


/**
 * An asynchronous {@link StepExternalByteStore} that models a **range-fetched**
 * source — an HTTP server honouring `Range:` requests, or an OPFS/blob store
 * read block-by-block — so the index-first open path (M4) can be exercised and
 * measured without a network. It wraps a fully-resident buffer (the "server")
 * but never assumes the client holds it: every `read` is counted as a fetch,
 * and with a `blockBytes` grid the fetch is rounded out to whole blocks, so
 * {@link stats} reports the real transfer an aligned store would incur.
 *
 * This is the source a sidecar-driven open pairs with: reconstruct the entity
 * index from the sidecar (no scan), then pull only the byte ranges demand asks
 * for through a source like this — and read back from `stats` how little of the
 * file that touched.
 */
export class RangeByteSource implements StepExternalByteStore {

  private readonly blockBytes_: number

  private requestCount_ = 0

  private bytesFetched_ = 0

  private bytesServed_ = 0

  /**
   * @param bytes_ The full backing bytes (the notional server-side file). Not
   * copied; treated as read-only.
   * @param blockBytes Optional fetch granularity: reads are rounded out to a
   * multiple of this so `bytesFetched` reflects whole-block transfer. Omit (or
   * pass 0) for exact, unaligned fetches.
   */
  constructor(
      private readonly bytes_: Uint8Array,
      blockBytes: number = 0 ) {

    if ( blockBytes < 0 ) {
      throw new Error( `Invalid blockBytes ${blockBytes}` )
    }

    this.blockBytes_ = blockBytes > 0 ? blockBytes : NO_ALIGNMENT
  }

  /**
   * Total size of the stored byte sequence.
   *
   * @return {number} The byte length.
   */
  public get byteLength(): number {
    return this.bytes_.byteLength
  }

  /**
   * A snapshot of the fetch counters.
   *
   * @return {RangeFetchStats} The current stats.
   */
  public get stats(): RangeFetchStats {
    return {
      requestCount: this.requestCount_,
      bytesFetched: this.bytesFetched_,
      bytesServed: this.bytesServed_,
    }
  }

  /**
   * Read a range, accounting for the (block-aligned) fetch it would incur.
   * Returns exactly the requested `length` bytes as a standalone array, even
   * though the underlying fetch may have pulled a wider aligned span.
   *
   * @param offset Absolute offset of the first byte to read.
   * @param length Number of bytes to read.
   * @return {Promise< Uint8Array >} The requested bytes (byteOffset 0).
   */
  public read( offset: number, length: number ): Promise< Uint8Array > {

    const total = this.bytes_.byteLength

    const start = Math.max( 0, Math.min( offset, total ) )
    const end = Math.max( start, Math.min( offset + length, total ) )

    // The aligned span a block-granular store would actually transfer.
    const block = this.blockBytes_
    const fetchStart = start - ( start % block )
    const fetchEnd = Math.min( total, Math.ceil( end / block ) * block )

    this.requestCount_ += 1
    this.bytesFetched_ += fetchEnd - fetchStart
    this.bytesServed_ += end - start

    return Promise.resolve( this.bytes_.slice( start, end ) )
  }
}
