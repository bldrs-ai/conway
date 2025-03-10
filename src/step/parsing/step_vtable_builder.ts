export type IndexMark = number;

/**
 * Encode a V-Table for a semi-parsed STEP serialized object, by encoding the byte
 * positions of all the fields.
 */
export default class StepVtableBuilder {
  private buffer_: Uint32Array
  private bufferMark_: number
  private indexMark_: number

  /**
   * Get the buffer associated with this V-Table
   * @returns The buffer associated with this v-table builder that contains the
   * addresses.
   */
  public get buffer(): Uint32Array {
    return this.buffer_
  }

  /**
   * Construct this with an initial buffer allocation.
   * @param startingBufferSize The initial size of the buffer to allocate, in 32 bit intervals.
   */
  constructor( startingBufferSize: number = 16 ) {
    this.buffer_     = new Uint32Array( Math.max( startingBufferSize, 1 ) )
    this.bufferMark_ = 0
    this.indexMark_  = 0
  }

  /**
   * Clear this out, note that anything using the table should also be invalidated.
   * @param dropBuffer Should we also drop the buffer to allow it to be garbage collected,
   * or should we drop it and allow the memory to be reclaimed.
   */
  public clear( dropBuffer: boolean = false ): void {

    if ( dropBuffer ) {
       
      this.buffer_ = new Uint32Array( 16 )
    }

    this.bufferMark_ = 0
    this.indexMark_  = 0
  }

  /**
   * Push an address to the back of this current entry.
   * @param address The address to put back.
   */
  public push( address: number ) : void {
    if ( this.bufferMark_ === this.buffer_.length ) {
      const newBuffer = new Uint32Array( ( this.buffer_.length ) << 1 )

      newBuffer.set( this.buffer_ )

      // We don't attempt de-allocation, the buffer is append only,
      // this means a reader can grab it as long as they don't try and read something not read yet.
      this.buffer_ = newBuffer
    }

    this.buffer_[ this.bufferMark_++ ] = address
  }

  /**
   * Complete a row of vtable entries in the buffer, returning the index mark of the vtable run +
   * the number of entries.
   * @param endCursor
   * @returns The index mark (i.e. location in the buffer this run
   * exists),
   * the number of entries, and the last cursor position.
   */
  public complete( endCursor: number ): [IndexMark, number, number] {
    const indexMark = this.indexMark_

    this.indexMark_ = this.bufferMark_

    return [indexMark, this.indexMark_ - indexMark, endCursor]
  }
}
