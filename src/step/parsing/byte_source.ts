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


/**
 * A `ByteSource` whose `read` is asynchronous — a `StepExternalByteStore`
 * (OPFS `File.slice()`), or any other store that cannot serve bytes
 * synchronously on this thread. `buildIndexStreamingAsync` accepts either
 * this or a sync {@link ByteSource}; the sync builder does not.
 */
export interface AsyncByteSource {

  /** Total length of the source in bytes. */
  readonly byteLength: number

  /**
   * Read up to `length` bytes starting at `offset` into `into` at
   * `intoOffset`. Same contract as {@link ByteSource.read}, but async.
   *
   * @param offset Absolute source offset to read from.
   * @param length Maximum number of bytes to read.
   * @param into Destination buffer.
   * @param intoOffset Offset within `into` to write at.
   * @return {Promise<number>} The number of bytes copied.
   */
  read(
      offset: number, length: number, into: Uint8Array, intoOffset: number ): Promise<number>
}


/**
 * Either a sync or async positioned byte source. The cooperative index
 * builder awaits each fill; a sync source just resolves immediately.
 */
export type ReadableByteSource = ByteSource | AsyncByteSource


/**
 * Minimal sync-access handle (OPFS `FileSystemSyncAccessHandle` in a
 * worker). Defined here so the source has no DOM lib dependency.
 */
export interface SyncAccessHandleLike {

  /**
   * Read into `buffer` starting at file offset `options.at`.
   *
   * @param buffer Destination view.
   * @param options `{ at }` file offset (default 0).
   * @return {number} Bytes copied.
   */
  read( buffer: Uint8Array, options?: { at?: number } ): number

  /**
   * @return {number} File size in bytes.
   */
  getSize(): number
}


/**
 * A `ByteSource` over an OPFS (or similar) synchronous access handle —
 * the worker-side parse feed for M1b write-through. Reads never
 * materialise the file as one `ArrayBuffer`.
 */
export class SyncAccessHandleByteSource implements ByteSource {

  /**
   * @param handle_ A sync-access handle already opened on the file.
   */
  constructor( private readonly handle_: SyncAccessHandleLike ) {}

  /**
   * @return {number} The file length.
   */
  public get byteLength(): number {
    return this.handle_.getSize()
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

    const end = Math.min( offset + length, this.byteLength )

    if ( end <= offset ) {
      return 0
    }

    const want = end - offset

    return this.handle_.read( into.subarray( intoOffset, intoOffset + want ), { at: offset } )
  }
}


/**
 * An {@link AsyncByteSource} over a {@link StepExternalByteStore} — the
 * main-thread parse feed for a file that is already in OPFS (or any
 * store whose `read` is async). Peak parse scratch is one window, not
 * the whole file.
 */
export class StoreByteSource implements AsyncByteSource {

  /**
   * @param store_ The external store (same bytes the model will page).
   */
  constructor( private readonly store_: {
    readonly byteLength: number
    read( offset: number, length: number ): Promise<Uint8Array>
  } ) {}

  /**
   * @return {number} The store length.
   */
  public get byteLength(): number {
    return this.store_.byteLength
  }

  /**
   * @param offset Absolute source offset to read from.
   * @param length Maximum number of bytes to read.
   * @param into Destination buffer.
   * @param intoOffset Offset within `into` to write at.
   * @return {Promise<number>} The number of bytes copied.
   */
  public async read(
      offset: number, length: number, into: Uint8Array, intoOffset: number ): Promise<number> {

    const end = Math.min( offset + length, this.store_.byteLength )

    if ( end <= offset ) {
      return 0
    }

    const want = end - offset
    const bytes = await this.store_.read( offset, want )

    into.set( bytes.subarray( 0, want ), intoOffset )

    return Math.min( bytes.byteLength, want )
  }
}
