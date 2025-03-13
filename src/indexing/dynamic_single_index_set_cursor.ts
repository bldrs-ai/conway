import { IIndexSetCursor } from '../core/i_index_set_cursor'
import {
  ELEMENT_SIZE,
  MAX_NODE_STACK,
} from './dynamic_single_index_set'


const pool: DynamicSingleIndexSetCursor[] = []

/**
 * Cursor to a dynamic single index set span for queries.
 */
export class DynamicSingleIndexSetCursor implements IIndexSetCursor {

  private stack_?: Uint32Array[]
  private cursorStack_: Uint32Array = new Uint32Array(MAX_NODE_STACK)

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

    if ( this.stack_ === void 0 ) {
      return false
    }

    const localSet = this.stack_
    const localCursors = this.cursorStack_
    const stackSize = localSet.length

    // eslint-disable-next-line no-magic-numbers
    let currentMinimum = ( 0xFFFFFFFF ) >>> 0
    let currentBottom  = 0
    let stackIndex: number | undefined = void 0

    for ( let where = 0; where < stackSize; ++where ) {

      const row       = localSet[ where ]
      let cursorIndex = localCursors[ where ]

      // This skips fully deleted entries
      while ( cursorIndex < row.length && row[ cursorIndex + 1 ] === 0 ) {

        cursorIndex += ELEMENT_SIZE
        localCursors[ where ] = cursorIndex
      }

      if ( cursorIndex >= row.length ) {

        continue
      }

      const topBits = row[ cursorIndex ] >>> 0

      if ( topBits <= currentMinimum ) {

        currentMinimum = topBits
        currentBottom  = row[ cursorIndex + 1 ] >>> 0 // we know this isn't zero
        stackIndex = where
      }
    }

    if ( stackIndex === void 0 ) {

      delete this.stack_
      return false
    }

    localCursors[ stackIndex ] += ELEMENT_SIZE

    this.high_ = currentMinimum
    this.low_ = currentBottom

    return true
  }

  /**
   * Allocate a DynamicSingleIndexSetCursor, re-using freed ones in the pool.
   *
   * @param set The set to construct the cursor from.
   * @return {DynamicSingleIndexSetCursor} The allocated cursor.
   */
  public static allocate( set: Uint32Array[] ): DynamicSingleIndexSetCursor {

    let result: DynamicSingleIndexSetCursor

    if ( pool.length > 0 ) {
      result = pool.pop() as DynamicSingleIndexSetCursor
    } else {
      result = new DynamicSingleIndexSetCursor()
    }

    result.stack_ = set
    result.cursorStack_.fill( 0, 0, set.length )

    return result
  }

  /**
   * Free this cursor back to the pool.
   */
  public free(): void {
    delete this.stack_
    pool.push( this )
  }
}
