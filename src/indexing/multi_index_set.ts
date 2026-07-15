import { IIndexSetCursor } from '../core/i_index_set_cursor'
import { MultiIndexSetCursorOr } from './multi_index_set_cursor_or'
import { indexSetPointQuery32 } from './search_operations'
import { SingleIndexSetCursor } from './single_index_set_cursor'

/* eslint-disable no-magic-numbers -- SWAR popcount constants */
/**
 * Standard SWAR population count for a 32 bit integer.
 *
 * @param value The value to count set bits in.
 * @return {number} The number of set bits.
 */
function popCount32( value: number ): number {
  let result = value - ( ( value >> 1 ) & 0x55555555 )

  result = ( result & 0x33333333 ) + ( ( result >> 2 ) & 0x33333333 )
  result = ( result + ( result >> 4 ) ) & 0x0F0F0F0F

  return ( result * 0x01010101 ) >> 24
}
/* eslint-enable no-magic-numbers */

/**
 * A set of indices each associated with a number identifier.
 */
export class MultiIndexSet< IndexType extends number > {
   
  /**
   * Construct this with a prefix sum table and matching elements table.
   *
   * @param prefixSumTable_ A prefix sum array where each item is its summed index,
   * with an extra element at the end with the entire count.
   * @param elements_ The elements in the index, matching the prefix sum indices * 2,
   * where there's 2 elements in the array for each item,
   * packed (first has the bottom 5 bits masked out, and is the top bits, the second
   * is a bit field representing the elements for the top bit range, in a
   * unioned-one-hot representation).
   */
  public constructor(
    private readonly prefixSumTable_: Uint32Array,
    private readonly elements_: Uint32Array ) {}
   

  /**
   * All the types with a non-zero size in the index.
   *
   * @yields {IterableIterator}
   */
  public* types() : IterableIterator< IndexType > {

    const prefixSumTable = this.prefixSumTable_

    for (
      let indexType: number = 0, end = prefixSumTable.length - 1;
      indexType < end;
      ++indexType ) {

      if ( ( prefixSumTable[ indexType + 1 ] - prefixSumTable[ indexType ] ) > 0 ) {

        yield indexType as IndexType
      }
    }
  }

  /**
   * Does the set have a particular index for a particular type.
   *
   * @param indexType The index type to check for.
   * @param localID The dense index in the set to check.
   * @return {boolean} True if it has the type.
   */
  public has( indexType: IndexType, localID: number ): boolean {
    if ( indexType >= this.prefixSumTable_.length - 1 ) {
      return false
    }

    const prefixSum   = this.prefixSumTable_
     
    const indexOffset = prefixSum[ indexType ] * 2
     
    const indexEnd    = prefixSum[ indexType + 1 ] * 2

    return indexSetPointQuery32( localID, this.elements_, indexOffset, indexEnd )
  }

  /**
   * Count of items for a set of types without materializing entities —
   * popcounts the packed one-hot blocks per type (the prefix sums index
   * 32-element blocks, not items), so it's O(blocks), thousands of times
   * cheaper than iterating a cursor. Per-type ranges are disjoint, but an
   * element multi-mapped under several of the queried types counts once per
   * mapping (matching what a cursor union would visit), so treat multi-type
   * counts as an upper bound (fine for progress totals, its motivating use).
   *
   * @param indexTypes The list of types to count.
   * @return {number} The summed count for the given types.
   */
  public count( ...indexTypes: IndexType[] ): number {
    const prefixSum = this.prefixSumTable_
    const elements = this.elements_

    let result = 0

    for ( const indexType of indexTypes ) {

      if ( indexType >= prefixSum.length - 1 ) {
        continue
      }

      const blockStart = prefixSum[ indexType ] * 2
      const blockEnd = prefixSum[ indexType + 1 ] * 2

      // Each packed block is [maskedTopBits, oneHotBitfield] — the bitfield's
      // set bits are the block's members.
      for ( let where = blockStart; where < blockEnd; where += 2 ) {
        result += popCount32( elements[ where + 1 ] )
      }
    }

    return result
  }

  /**
   * Get a cursor that lets you iterate over the union of the sets of multiple indices.
   *
   * @param indexTypes The list of types to build a cursor out of.
   * @return {IIndexSetCursor} The cursor for the list of types.
   */
  public cursor( ...indexTypes: IndexType[] ): IIndexSetCursor {
    const prefixSum = this.prefixSumTable_

    if ( indexTypes.length === 1 ) {
      const indexType   = indexTypes[ 0 ]
      const indexOffset = prefixSum[ indexType ]
      const indexEnd    = prefixSum[ indexType + 1 ]

      return SingleIndexSetCursor.allocate( this.elements_, indexOffset, indexEnd )
    }

    const result = MultiIndexSetCursorOr.allocate( this.elements_ )

    for ( const indexType of indexTypes ) {
      const indexOffset = prefixSum[ indexType ]
      const indexEnd    = prefixSum[ indexType + 1 ]

      result.addRange( indexOffset, indexEnd )
    }

    return result
  }
}
