import { IIndexSetCursor } from '../core/i_index_set_cursor'
import IndexSetConstants from './index_set_constants'
import { DynamicSingleIndexSetCursor } from './dynamic_single_index_set_cursor'
import { indexSetSearch32 } from './search_operations'
import { extractOneHotLow } from './bit_operations'
import { SingleIndexSet } from './single_index_set'


const MASK_BOTTOMBITS = IndexSetConstants.MASK_BOTTOMBITS
const MASK_TOPBITS    = IndexSetConstants.MASK_TOPBITS

/**
 * As deep as the stack of nodes for this can ever be.
 */
export const MAX_NODE_STACK      = 27
export const ELEMENT_SIZE        = 2

const mergeCursor = new Uint32Array( MAX_NODE_STACK )

/**
 * A single set of indices
 */
export default class DynamicSingleIndexSet {

  private stack_: Uint32Array[] = []
  private populated_: number = 0
  private size_: number = 0

  /**
   * Construct this empty or with a predefined index set or cursor.
   *
   * @param from The index set or cursor to create this from if
   * this is defined.
   * @return {DynamicSingleIndexSet} An instance of DynamicSingleIndexSet
   */
  constructor( from?: SingleIndexSet | IIndexSetCursor ) {

    if ( from === void 0 ) {
      return
    }

    if ( from instanceof SingleIndexSet ) {

      this.stack_.push( from.buffer.slice() )
      return
    }

    let outputCursor = 0
    let currentOutput = new Uint32Array( ELEMENT_SIZE )

    while ( from.step() ) {

      if ( outputCursor === currentOutput.length ) {

        this.stack_.splice(0, 0, currentOutput)
        currentOutput = new Uint32Array( currentOutput.length << 1 )
        outputCursor = 0
        this.populated_ <<= 1
        this.populated_ |= 1
      }

      currentOutput[ outputCursor++ ] = from.high
      currentOutput[ outputCursor++ ] = from.low
    }

    if ( outputCursor > 0 ) {

      this.stack_.splice(0, 0, currentOutput.subarray( 0, outputCursor ))
    }
  }

  /**
   * Insert a local ID in the set.
   *
   * @param localID The id to insert.
   * @return {boolean} True if the value was inserted, not a duplicate
   */
  public insert( localID: number ): boolean {

    const topBits      = ( localID & MASK_TOPBITS ) >>> 0
    const bottomOneHot = ( 1 << ( localID & MASK_BOTTOMBITS ) ) >>> 0

    const localStack = this.stack_

    for ( const row of localStack ) {

      const foundResult = indexSetSearch32( topBits, row )

      if ( foundResult < row.length && row[ foundResult ] === topBits ) {

        const currentValue = row[ foundResult + 1 ]
        const newValue     = ( currentValue | bottomOneHot ) >>> 0

        if ( newValue === currentValue ) {
          return false
        }

        row[ foundResult + 1 ] = newValue
        ++this.size_

        return true
      }
    }

    const firstUnpopulated = extractOneHotLow( ~this.populated_ )
    let   totalToMerge = 0

    const newFront = new Uint32Array( ELEMENT_SIZE )

    newFront[ 0 ] = topBits
    newFront[ 1 ] = bottomOneHot

    this.stack_.push( newFront )

    if ( firstUnpopulated > 0 ) {

      const fromBack = localStack.length - 1
      const stackDepth = firstUnpopulated + 1

      for ( let where = 0; where < stackDepth; ++where ) {

        const rowIndex    = fromBack - where

        totalToMerge           += localStack[ rowIndex ].length
        mergeCursor[ rowIndex ] = 0
      }

      let mergeBuffer = new Uint32Array( totalToMerge )

      let mergeCount = 0
      let outputCursor = 0

      while ( mergeCount < totalToMerge ) {

        // eslint-disable-next-line no-magic-numbers
        let currentMinimum  = ( 0xFFFFFFFF ) >>> 0 // maximum uint32
        let currentRowIndex = 0

        for ( let where = 0; where < stackDepth; ++where ) {

          const rowIndex    = fromBack - where

          const cursorIndex = mergeCursor[ rowIndex ]
          const row         = localStack[ rowIndex ]

          if ( cursorIndex >= row.length ) {

            continue
          }

          const rowTopBits = row[ cursorIndex ]

          if ( rowTopBits <= currentMinimum ) {

            currentRowIndex = rowIndex
            currentMinimum = rowTopBits
          }
        }

        const currentRow    = localStack[ currentRowIndex ]
        const currentCursor = mergeCursor[ currentRowIndex ]
        const bottomBits    = currentRow[ currentCursor + 1 ]

        mergeCount += ELEMENT_SIZE

        mergeCursor[ currentRowIndex ] += ELEMENT_SIZE

        if ( bottomBits === 0 ) {

          continue
        }

        mergeBuffer[ outputCursor++ ] = currentMinimum
        mergeBuffer[ outputCursor++ ] = bottomBits
      }

      if ( outputCursor !== ELEMENT_SIZE ) {

        mergeBuffer = mergeBuffer.subarray( 0, outputCursor )
      }

      for ( let where = 0; where < stackDepth; ++where ) {

        localStack.pop()
      }

      localStack.push( mergeBuffer )

      const newPopulated = ( 1 << firstUnpopulated ) >>> 0

      this.populated_ &= ( ~( newPopulated - 1 ) ) >>> 0
      this.populated_ |= newPopulated

    }  else {

      this.populated_ |= 1
    }

    ++this.size_

    return true
  }

  /**
   * Get the number of elements in this set
   *
   * @return {number} The size of this.
   */
  public get size(): number {
    return this.size_
  }

  /**
   * Delete a local ID from this.
   *
   * @param localID The local ID of the item to delete.
   * @return {boolean} True if the item existed to be deleted.
   */
  public delete( localID: number ): boolean {

    const topBits      = ( localID & MASK_TOPBITS ) >>> 0
    const bottomOneHot = ( 1 << ( localID & MASK_BOTTOMBITS ) ) >>> 0

    const localStack = this.stack_

    for ( const row of localStack ) {

      const foundResult = indexSetSearch32( topBits, row )

      if ( foundResult < row.length && row[ foundResult ] === topBits ) {

        const currentValue = row[ foundResult + 1 ]

        if ( ( ( currentValue & bottomOneHot ) >>> 0 ) === 0 ) {

          return false
        }

        row[ foundResult + 1 ] = ( currentValue ^ bottomOneHot ) >>> 0
        --this.size_

        return true
      }
    }

    return false
  }

  /**
   * Does the set have a particular index for a particular type.
   *
   * @param localID The dense index in the set to check.
   * @return {boolean} True if it has the type.
   */
  public has( localID: number ): boolean {

    const topBits      = ( localID & MASK_TOPBITS ) >>> 0
    const bottomOneHot = ( 1 << ( localID & MASK_BOTTOMBITS ) ) >>> 0

    const localStack = this.stack_

    for ( const row of localStack ) {

      const foundResult = indexSetSearch32( topBits, row )

      if ( foundResult < row.length && row[ foundResult ] === topBits ) {

        const currentValue = row[ foundResult + 1 ]

        if ( ( ( currentValue & bottomOneHot ) >>> 0 ) === 0 ) {

          return false
        }

        return true
      }
    }

    return false
  }

  /**
   * Get a cursor that lets you iterate over the current set.
   *
   * @return {IIndexSetCursor} The cursor for the items currently in the set.
   */
  public cursor(): DynamicSingleIndexSetCursor {

    return DynamicSingleIndexSetCursor.allocate( [...this.stack_] )

  }

  /* TODO - Add bulk inserter static creators to slurp up an array or cursor into  */
}
