/**
 * A random-access, forward-readable byte source for the streaming parser.
 *
 * The streaming index builder (see streaming_index_builder.ts) reads the
 * source sequentially into a small moving window, so a `ByteSource` only has
 * to satisfy positioned reads — it never needs the whole file resident. The
 * in-memory `BufferByteSource` here is for tests and the resident case; a
 * file-descriptor source (node) or an HTTP-Range source (M4) implements the
 * same shape without holding the file in the JS heap.
 *
 * M0 keeps reads synchronous to reuse the existing synchronous parse loop
 * unchanged. The asynchronous variant (network pull-parser) is M4.
 */
export interface ByteSource {

  /** Total length of the source in bytes. */
  readonly byteLength: number

  /**
   * Read up to `length` bytes starting at `offset` into `into` at
   * `intoOffset`, returning the number of bytes actually copied (fewer than
   * `length` only at end of source).
   *
   * @param offset Absolute source offset to read from.
   * @param length Maximum number of bytes to read.
   * @param into Destination buffer.
   * @param intoOffset Offset within `into` to write at.
   * @return {number} The number of bytes copied.
   */
  read( offset: number, length: number, into: Uint8Array, intoOffset: number ): number
}

/**
 * A `ByteSource` backed by an in-memory `Uint8Array`. Reads are `subarray`
 * copies into the destination window. Used by tests and the resident path;
 * note it does hold the whole buffer (that residency is the source's, not the
 * parser's — the parser still only touches a window).
 */
export class BufferByteSource implements ByteSource {

  /**
   * @param buffer The backing bytes.
   */
  constructor( private readonly buffer: Uint8Array ) {}

  /**
   * @return {number} The buffer length.
   */
  public get byteLength(): number {
    return this.buffer.length
  }

  /**
   * @param offset Absolute source offset to read from.
   * @param length Maximum number of bytes to read.
   * @param into Destination buffer.
   * @param intoOffset Offset within `into` to write at.
   * @return {number} The number of bytes copied.
   */
  public read(
      offset: number, length: number, into: Uint8Array, intoOffset: number ): number {

    const end = Math.min( offset + length, this.buffer.length )

    if ( end <= offset ) {
      return 0
    }

    into.set( this.buffer.subarray( offset, end ), intoOffset )

    return end - offset
  }
}
