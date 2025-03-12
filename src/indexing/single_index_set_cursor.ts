import { IIndexSetCursor } from '../core/i_index_set_cursor'


const pool: SingleIndexSetCursor[] = []

/**
 * Cursor to a single index set span for queries.
 */
export class SingleIndexSetCursor implements IIndexSetCursor {
  private buffer_?: Uint32Array

  private currentIndex_: number = 0
  private end_: number = 0

  private high_: number = 0
  private low_: number = 0

   
  /**
   * Construct this, not accessible.
   */
  private constructor() {}
   

  /**
   * Get the current high 27 bits, as a regular number with the lower 5 bits
   * padded to zero.
   *
   * @return {number} The high bits.
   */
  public get high(): number {
    return this.high_
  }

  /**
   * Get a set of up to 32 low bits, in one-hot format or'd together,
   * so that each bit index represents a 5 bit bottom part corresponding to the top 27
   *
   * @return {number} The high bits.
   */
  public get low(): number {
    return this.low_
  }

  /**
   * Step this cursor to the next high (and matching set of lows)
   *
   * @return {boolean} True if this is not at the end of the sequence,
   * false otherwise.
   */
  public step(): boolean {
    const buffer     = this.buffer_ as Uint32Array

    const currentIndex = this.currentIndex_

    if ( currentIndex >= this.end_ ) {
      return false
    }

    this.high_ = buffer[ currentIndex ]
    this.low_  = buffer[ currentIndex + 1 ]

     
    this.currentIndex_ = currentIndex + 2

    return true
  }

  /**
   * Allocate a SingleIndexSetCursor, re-using freed ones in the pool.
   *
   * @param buffer
   * @param currentIndex
   * @param end
   * @return {SingleIndexSetCursor} The allocated cursor.
   */
  public static allocate(
      buffer: Uint32Array,
       
      currentIndex: number = 0, // note, ? is default undefined
      end?: number ): SingleIndexSetCursor {
    end ??= buffer.length >>> 1

    let result: SingleIndexSetCursor

    if ( pool.length > 0 ) {
      result = pool.pop() as SingleIndexSetCursor
    } else {
      result = new SingleIndexSetCursor()
    }

    result.buffer_       = buffer

     
    result.currentIndex_ = currentIndex * 2

     
    result.end_          = end * 2

    return result
  }

  /**
   * Free this cursor back to the pool.
   */
  public free(): void {
    delete this.buffer_
    pool.push( this )
  }
}
