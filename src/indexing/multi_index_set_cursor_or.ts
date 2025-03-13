import IndexSetConstants from './index_set_constants'
import { IIndexSetCursor } from '../core/i_index_set_cursor'


const pool: MultiIndexSetCursorOr[] = []

const MASK_TOPBITS                 = IndexSetConstants.MASK_TOPBITS
const STARTING_CURSOR_SET_CAPACITY = 2
/**
 * An index cursor that allows multiple index ranges from the same buffer to be
 * or'd together.
 *
 * This is useful for aggregating sets of items in a union operation.
 */
export class MultiIndexSetCursorOr implements IIndexSetCursor {
  private buffer_?: Uint32Array
  private cursorSet_: Uint32Array

  private currentOpCount_: number = 0
  private high_: number = 0
  private low_: number = 0

  /**
   * Construct this, not accessible.
   */
  private constructor() {
    this.cursorSet_ = new Uint32Array( STARTING_CURSOR_SET_CAPACITY )
  }

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
    let lowestHigh = 0xFFFFFFFF
    const cursorSet  = this.cursorSet_
    const setEnd     = this.currentOpCount_ << 1
    const buffer     = this.buffer_ as Uint32Array

    let result = false

     
    for ( let where = 0; where < setEnd; where += 2 ) {
      const opPosition = cursorSet[ where ]
      const opEnd     = cursorSet[ where + 1 ]

      if ( opPosition < opEnd ) {
        result = true

        const bufferHigh = buffer[ opPosition ] & MASK_TOPBITS

        if ( bufferHigh < lowestHigh ) {
          lowestHigh = bufferHigh
        }
      }
    }

    if ( !result ) {
      return false
    }

    let currentLow = 0

     
    for ( let where = 0; where < setEnd; where += 2 ) {
      const opPosition = cursorSet[ where ]
      const opEnd     = cursorSet[ where + 1 ]

      if ( opPosition < opEnd ) {
        const bufferHigh = buffer[ opPosition ] & MASK_TOPBITS

        if ( lowestHigh === bufferHigh ) {
           
          this.cursorSet_[ where ] = opPosition + 2

          currentLow |= buffer[ opPosition + 1 ]
        }
      }
    }

    this.low_  = currentLow
    this.high_ = lowestHigh

    return true
  }

  /**
   * Allocate a MultiIndexSetCursorOr, re-using freed ones in the pool.
   *
   * @param buffer
   * @return {MultiIndexSetCursorOr} The allocated cursor.
   */
  public static allocate( buffer: Uint32Array ): MultiIndexSetCursorOr {
    let result: MultiIndexSetCursorOr

    if ( pool.length > 0 ) {
      result = pool.pop() as MultiIndexSetCursorOr
    } else {
      result = new MultiIndexSetCursorOr()
    }

    result.buffer_         = buffer
    result.currentOpCount_ = 0

    return result
  }

  /**
   * Add a range from the multi-set buffer to the cursor.
   *
   * @param from The start of the range.
   * @param to The end of the range (not inclusive)
   */
  public addRange( from: number, to: number ): void {
    if ( ( this.cursorSet_.length >>> 1 ) <= this.currentOpCount_ ) {
       
      const newLength = this.currentOpCount_ * 4

      const newCursorSet = new Uint32Array( newLength )

      newCursorSet.set( this.cursorSet_ )

      this.cursorSet_ = newCursorSet
    }

     
    const opIndex = this.currentOpCount_ * 2

    this.cursorSet_[ opIndex ]     = from * 2
    this.cursorSet_[ opIndex + 1 ] = to * 2
     

    ++this.currentOpCount_
  }

  /**
   * Free this back to the pool.
   */
  public free(): void {
    delete this.buffer_
    pool.push( this )
  }
}
