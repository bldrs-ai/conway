import { extractOneHotLow, pop32 } from './bit_operations'
import { IIndexSetCursor } from '../core/i_index_set_cursor'


/**
 * Count the number of set items in a cursor.
 *
 * @param cursor The cursor to count the items in.
 * @return {number} The count of items in the cursor set.
 */
export function cursorCount( cursor: IIndexSetCursor ): number {
  let result = 0

  while ( cursor.step() ) {
    result += pop32( cursor.low )
  }

  return result
}

/**
 * Iterate over a cursor, getting all the local IDs.
 *
 * @param cursor The cursor to iterate over.
 * @yields {number} Every local ID within the cursor.
 */
export function* cursorIterator( cursor: IIndexSetCursor ):
  IterableIterator< number > {

  while ( cursor.step() ) {
    const high = cursor.high
    let low = cursor.low

    while (low !== 0) {
      const lowestOneHot = extractOneHotLow(low)

      low ^= (1 << lowestOneHot) >>> 0

      const localID = (high | lowestOneHot) >>> 0

      yield localID
    }
  }
}

/**
 * Iterate over a cursor, mapping the extracted local IDs to values.
 *
 * @param cursor The cursor to iterate over.
 * @param func
 * @yields {number} Every local ID within the cursor.
 */
export function* cursorMap< TResult >(
    cursor: IIndexSetCursor,
    func: ( localId: number ) => TResult ): IterableIterator< TResult > {

  while ( cursor.step() ) {
    const high = cursor.high
    let low = cursor.low

    while (low !== 0) {
      const lowestOneHot = extractOneHotLow(low)

      low ^= (1 << lowestOneHot) >>> 0

      const localID = (high | lowestOneHot) >>> 0

      yield func( localID )
    }
  }
}
