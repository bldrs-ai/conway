/* eslint-disable no-magic-numbers */

const uInt32 = new Uint32Array([0x11223344])
const uInt8 = new Uint8Array(uInt32.buffer)

const littleEndian = uInt8[0] === 0x44

/**
 * Search an index set using a binary search
 *
 * @param searchValue The value to search for.
 * @param buffer The index set to search in.
 * @param offset The offset to the start of the range to search
 * @param end The end of the buffer.
 * @return {number} The closest found location.
 */
function keySearch32(
    searchValue: number,
    buffer: Uint32Array,
    // eslint-disable-next-line default-param-last
    offset: number = 0,
    end?: number ): number {

  let right = ( end ?? buffer.length ) >>> 0

  searchValue >>>= 0

  while ( offset < right ) {
    const mid = ( ( offset + right ) >>> 1 ) & ( ~1 >>> 0 )

    if ( buffer[ mid + 1 ] < searchValue ) {
      offset = mid + 2
    } else {
      right = mid
    }
  }

  return offset
}

/**
 * Search an index set using a binary search
 *
 * @param searchValue The value to search for.
 * @param buffer The index set to search in.
 * @param offset The offset to the start of the range to search
 * @param end The end of the buffer.
 * @return {number} The closest found location.
 */
function keyProbe32(
    searchValue: number,
    buffer: Uint32Array,
    // eslint-disable-next-line default-param-last
    offset: number = 0,
    end?: number ): number {

  const right = ( end ?? buffer.length ) >>> 0

  searchValue >>>= 0

  while ( offset < right ) {

    if ( buffer[ offset + 1 ] >= searchValue ) {
      return offset
    }

    offset += 2
  }

  return offset
}

/**
 * This is a sorted order data structure for constant/bulk insert data that
 * performs near the speed of a hash table that maps 32 bit unsigned integers
 * to 32bit unsigned integers.
 */
export default class InterpolationSearchTable32 implements
 ReadonlyMap< number, number > {

  private readonly interpolationTable_?: Uint32Array
  private readonly minKey_: number
  private readonly maxKey_: number
  private readonly interpolationFactor_: number

  /**
   * Get the number of items in this.
   *
   * @return {number} The number of itmes in this.
   */
  public get size(): number {

    return this.keyValues_.length >>> 1
  }

  /**
   * Construct the interpolation search table
   *
   * @param keyValues_ This is expected to be an array with pairs of elements
   * as a key-value pair packed into the array with keys. e.g. [0] = value, [1] = key
   * and so on.
   *
   * This will be mutated in-place, so copy if you do not wish the array to be mutated.
   */
  constructor( private readonly keyValues_: Uint32Array, alreadySorted: boolean = false ) {

    if ( ( keyValues_.length & 1 ) === 1 ) {
      throw new Error( 'Invalid key value pair array, had odd number of items')
    }

    if ( !alreadySorted ) {

      // if not a little-endian platform, assume bigendian
      // we shouldn't need to support mixed endian and
      // big-endian is the rarer case, so take the performance hit there.
      if ( !littleEndian ) {

        for ( let pairIndex = 0; pairIndex < keyValues_.length; pairIndex += 2 ) {

          const tempValue = keyValues_[ pairIndex ]

          keyValues_[ pairIndex ]     = keyValues_[ pairIndex + 1 ]
          keyValues_[ pairIndex + 1 ] = tempValue

        }
      }

      // Here we sort by key/value lexicographical by using the
      // Uint64 array, relying on the platform endianness to
      // combo-sort the key-value pairs.
      // This should be implemented in fast native code.
      new BigUint64Array( keyValues_.buffer ).sort()

      if ( !littleEndian ) {

        for ( let pairIndex = 0; pairIndex < keyValues_.length; pairIndex += 2 ) {

          const tempKey = keyValues_[ pairIndex ]

          keyValues_[ pairIndex ] = keyValues_[ pairIndex + 1 ]
          keyValues_[ pairIndex + 1 ] = tempKey

        }
      }
    }
    const interpolationTableSize = ( keyValues_.length >>> 4 )

    if ( interpolationTableSize === 0 ) {

      this.minKey_ = 0
      this.maxKey_ = 0
      this.interpolationFactor_ = 0

      return
    }

    // Note, this is prefixed summed, that's why we have the extra entry
    const interpolationTable = new Uint32Array( interpolationTableSize + 1 )

    this.interpolationTable_ = interpolationTable

    const minKey                 = this.keyValues_[ 1 ]
    const maxKey                 = this.keyValues_[ this.keyValues_.length - 1 ]
    const interpolationFactor    = interpolationTableSize / ( maxKey - minKey )
    const maxInterpolationBucket = interpolationTableSize - 1

    this.interpolationFactor_ = interpolationFactor

    this.minKey_ = minKey
    this.maxKey_ = maxKey

    for ( let keyIndex = 1; keyIndex < keyValues_.length; keyIndex += 2 ) {

      const key = keyValues_[ keyIndex ]

      const interpolationBucket =
        Math.min( Math.trunc( interpolationFactor * ( key - minKey ) ), maxInterpolationBucket )

      // Note the + 1 is there because we're doing the prefix sum,
      // and we want a "0" in that first entry to act as the first offset.
      interpolationTable[ interpolationBucket + 1 ] += 2
    }

    // This converts the interpolation table to prefix sum,
    // because that will make for picking out spans.
    for ( let bucketIndex = 0; bucketIndex < interpolationTableSize; ++bucketIndex ) {

      interpolationTable[ bucketIndex + 1 ]  += interpolationTable[ bucketIndex ]
    }
  }

  /**
   * Implements Map Foreach.
   *
   * @param callbackfn The for each callback.
   * @param thisArg Overridable this arg.
   */
  public forEach(
      callbackfn: (
        value: number,
        key: number,
        map: ReadonlyMap<number, number>) => void, thisArg?: any): void {

    const keyValues = this.keyValues_

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    thisArg ??= this

    for ( let where = 0, end = keyValues.length; where < end; where += 2 ) {

      const value = keyValues[ where ]
      const key   = keyValues[ where + 1 ]

      callbackfn.call( thisArg, value, key, this )
    }
  }

  /**
   * Does this have the matching key?
   *
   * @param key The key to search for
   * @return {boolean} True if found, false otherwise.
   */
  public has(key: number): boolean {
    return this.get( key ) !== void 0
  }

  /**
   * Iterate through all entries (key value pairs)
   *
   * @yields {[number, number]} A key value pair.
   */
  public* entries(): IterableIterator<[number, number]> {
    const keyValues = this.keyValues_

    for ( let where = 0, end = keyValues.length; where < end; where += 2 ) {

      const value = keyValues[ where ]
      const key   = keyValues[ where + 1 ]

      yield [key, value]
    }
  }

  /**
   * Iterate through all keys in sort order.
   *
   * @yields {number} A key.
   */
  public* keys(): IterableIterator<number> {
    const keyValues = this.keyValues_

    for ( let where = 1, end = keyValues.length; where < end; where += 2 ) {

      yield keyValues[ where ]
    }
  }

  /**
   * Iterate through all values in key sort order.
   *
   * @yields {number} A value.
   */
  public* values(): IterableIterator<number> {

    const keyValues = this.keyValues_

    for ( let where = 0, end = keyValues.length; where < end; where += 2 ) {

      yield keyValues[ where ]
    }
  }

  /**
   * Iterates through all the entries in this.
   *
   * @return {IterableIterator<[number, number]>} Iterate through all entries.
   */
  [Symbol.iterator](): IterableIterator<[number, number]> {
    return this.entries()
  }

  // TODO - in future, a ranged search iterator can be added.

  /**
   * Will find an exact key (first match) and return its value,
   * or undefined if not found.
   *
   * @param key The key to search for.
   * @return {number | undefined} The matching value, or undefined
   * if no matching value is found.
   */
  public get( key: number ): number | undefined {

    key >>>= 0

    const interpolationTable = this.interpolationTable_
    const keyValues = this.keyValues_
    const keyValuesLength = keyValues.length

    let lowerBound: number
    let upperBound: number

    if ( interpolationTable !== void 0 ) {

      if ( key > this.maxKey_ ) {

        return
      }

      const maxInterpolationBucket = interpolationTable.length - 2
      const interpolationFactor = this.interpolationFactor_
      const minKey = this.minKey_

      const bucket =
        Math.min( Math.trunc( interpolationFactor * ( key - minKey ) ), maxInterpolationBucket )

      lowerBound = interpolationTable[ bucket ]
      upperBound = interpolationTable[ bucket + 1 ]


    } else {

      lowerBound = 0
      upperBound = keyValuesLength
    }

    let searchIndex: number

    if ( (upperBound - lowerBound) > 16 ) {

      searchIndex = keySearch32( key, keyValues, lowerBound, upperBound )

    } else {

      searchIndex = keyProbe32( key, keyValues, lowerBound, upperBound )
    }

    if ( searchIndex >= upperBound ) {
      return
    }

    if ( keyValues[ searchIndex + 1 ] !== key ) {
      return
    }

    return keyValues[ searchIndex ]
  }
}
