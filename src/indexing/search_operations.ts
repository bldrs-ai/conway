import IndexSetConstants from './index_set_constants'


const MASK_BOTTOMBITS = IndexSetConstants.MASK_BOTTOMBITS
const MASK_TOPBITS    = IndexSetConstants.MASK_TOPBITS

/**
 * Search an index set using a binary search to find the correct high bits.
 * @param searchValue The value to search for.
 * @param buffer The index set to search in.
 * @param offset The offset to the start of the range to search
 * @param end The end of the buffer.
 * @returns The closest found location.
 */
export function indexSetSearch32(
    searchValue: number,
    buffer: Uint32Array,
     
    offset: number = 0,
    end?: number ): number {
  let right = end ?? buffer.length

  searchValue &= MASK_TOPBITS
  searchValue >>>= 0

  while ( offset < right ) {
    const mid = ( ( offset + right ) >>> 1 ) & ( ~1 >>> 0 )

    if ( buffer[ mid ] < searchValue ) {
       
      offset = mid + 2
    } else {
      right = mid
    }
  }

  return offset
}

/**
 * Search an index set using a binary search to find if a particular item is set.
 * @param searchValue The value to search for.
 * @param buffer The index set to search in.
 * @param offset The offset to the start of the range to search
 * @param end The end of the buffer.
 * @returns The closest found location.
 */
export function indexSetPointQuery32(
    searchValue: number,
    buffer: Uint32Array,
     
    offset: number = 0,
    end?: number ): boolean {
  const newOffset = indexSetSearch32( searchValue, buffer, offset, end )
  const lowPartOneHot = ( 1 << ( searchValue & MASK_BOTTOMBITS ) ) >>> 0

  return (
    newOffset < buffer.length &&
    ( buffer[ newOffset ] === ( searchValue & MASK_TOPBITS ) ) &&
    ( buffer[ newOffset + 1 ] & lowPartOneHot ) >>> 0 > 0 )
}
