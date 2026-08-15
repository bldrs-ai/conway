import fs from 'fs'

import { ByteSource } from './byte_source'


/**
 * A `ByteSource` over a Node file descriptor — the node/test twin of
 * `SyncAccessHandleByteSource`. The file is never held as one JS
 * buffer; each `read` is `fs.readSync` into the caller's window.
 *
 * The caller owns the fd (open + close). This class does not close it.
 */
export class FileDescriptorByteSource implements ByteSource {

  /**
   * @param fd_ An fd open for reading.
   * @param byteLength_ File size in bytes (`fstat.size`).
   */
  constructor(
      private readonly fd_: number,
      private readonly byteLength_: number ) {}

  /**
   * Open `path` read-only and wrap it. Caller must {@link close}.
   *
   * @param path Filesystem path.
   * @return {FileDescriptorByteSource} The source.
   */
  public static open( path: string ): FileDescriptorByteSource {

    const fd = fs.openSync( path, 'r' )

    return new FileDescriptorByteSource( fd, fs.fstatSync( fd ).size )
  }

  /**
   * @return {number} The file length.
   */
  public get byteLength(): number {
    return this.byteLength_
  }

  /**
   * Close the underlying fd. Further reads throw.
   */
  public close(): void {
    fs.closeSync( this.fd_ )
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

    const end = Math.min( offset + length, this.byteLength_ )

    if ( end <= offset ) {
      return 0
    }

    return fs.readSync( this.fd_, into, intoOffset, end - offset, offset )
  }
}
