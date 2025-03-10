import TypeIndex from './type_index'
import { blobEquals, fnv1a as fnv1A, fnv1a24 as fnv1A24 } from './hashing'

/**
 * A minimal perfect hash indexing lookup that
 */
export default class MinimalPerfectHash< ValueType extends number > implements
  ReadonlyMap< Uint8Array, ValueType >, TypeIndex< ValueType > {

  /* eslint-disable no-useless-constructor, no-empty-function */
  /**
   *
   * @param gMap_ The G mapping (see minimum perfect hashing algorithm)
   * that provides the initial mapping from the first colliding hash function
   * to the secondary disambiguation hash function.
   * @param keyPrefixSum_ The mapping to the actual key buffer in the form
   * of a prefix sum table.
   * @param slotMap_ The slots in the hash mapped back to their enum values.
   * @param keyBlob_ The blob of keys indexed by the prefix sum.
   */
  constructor(
    private readonly gMap_: Int32Array,
    private readonly keyPrefixSum_: Uint32Array,
    private readonly slotMap_: Int32Array,
    private readonly keyBlob_: Uint8Array ) {}
  /* eslint-enable no-useless-constructor, no-empty-function */

  /**
   * Iterates through this (alias for this.entries() that works with for of loop).
   *
   * @return {IterableIterator} The iterator to iterate through this.
   */
  public [Symbol.iterator](): IterableIterator<[Uint8Array, ValueType]> {
    return this.entries()
  }

  /**
   * Get the number of keys/slots in this.
   *
   * @return {number} The number of keys/slots.
   */
  public get size(): number {
    return this.slotMap_.length
  }

  /**
   * Implements the for each idiom on this map.
   *
   * @param callbackfn The callback function to call per element.
   * @param thisArg Extra arg to bind this to callback function.
   */
  public forEach(
      callbackfn: (
          value: ValueType,
          key: Uint8Array,
          map: MinimalPerfectHash< ValueType >) => void,
      thisArg?: any ): void {
    const slotMap      = this.slotMap_
    const keyPrefixSum = this.keyPrefixSum_
    const keyBlob      = this.keyBlob_

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    thisArg ??= this

    for ( let where = 0, end = slotMap.length; where < end; ++where ) {
      const slotValue = slotMap[ where ]

      if ( slotValue >= 0 ) {
        const key = keyBlob.subarray( keyPrefixSum[ where ], keyPrefixSum[ where + 1 ] )

        callbackfn.call( thisArg, slotValue as ValueType, key, this )
      }
    }
  }

  /**
   * Get all the items in this map in the form of a lazy iterator.
   *
   * @return {IterableIterator} The lazy iterator to loop through the entries in the map.
   * @yields {[Uint8Array, number]} A key value tuple pair between slot valeus and the
   * key data.
   */
  public* entries(): IterableIterator<[Uint8Array, ValueType]> {
    const slotMap      = this.slotMap_
    const keyPrefixSum = this.keyPrefixSum_
    const keyBlob      = this.keyBlob_

    for ( let where = 0, end = slotMap.length; where < end; ++where ) {
      const slotValue = slotMap[ where ]

      if ( slotValue >= 0 ) {
        const key = keyBlob.subarray( keyPrefixSum[ where ], keyPrefixSum[ where + 1 ] )

        yield [key, slotValue as ValueType]
      }
    }
  }

  /**
   * Get all the keys in this map in the form of a lazy iterator.
   *
   * @return {IterableIterator} The lazy iterator to loop through the keys in the map.
   * @yields {Uint8Array} A key from this map.
   */
  public* keys(): IterableIterator<Uint8Array> {
    const slotMap      = this.slotMap_
    const keyPrefixSum = this.keyPrefixSum_
    const keyBlob      = this.keyBlob_

    for ( let where = 0, end = slotMap.length; where < end; ++where ) {
      const slotValue = slotMap[ where ]

      if ( slotValue >= 0 ) {
        const key = keyBlob.subarray( keyPrefixSum[ where ], keyPrefixSum[ where + 1 ] )

        yield key
      }
    }
  }

  /**
   * Get all the values in this map in the form of a lazy iterator.
   *
   * @return {IterableIterator} The lazy iterator to loop through the values in the map.
   * @yields {number} A value from this map.
   */
  public* values(): IterableIterator<ValueType> {
    const slotMap      = this.slotMap_

    for ( let where = 0, end = slotMap.length; where < end; ++where ) {
      const slotValue = slotMap[ where ]

      if ( slotValue >= 0 ) {
        yield slotValue as ValueType
      }
    }
  }

  /**
   * Does this map have a particular key.
   *
   * @param buffer The buffer to get the key to match from.
   * @param offset An optional offset into the buffer (will be 0 if not specified)
   * @param end The end offset in the buffer (non inclusive, will be length if specified.
   * @return {boolean} True if the key is in the map.
   */
  public has( buffer: Uint8Array, offset?: number, end?: number ): boolean {
    return this.get( buffer, offset, end ) !== void 0
  }

  /**
   * Get the corresponding value in this map for a particular key.
   *
   * @param buffer The buffer to get the key to match from.
   * @param offset An optional offset into the buffer (will be 0 if not specified)
   * @param end The end offset in the buffer (non inclusive, will be length if specified.
   * @return {number | undefined} The matching value if the key is in the map,
   * otherwise undefined.
   */
  public get( buffer: Uint8Array, offset?: number, end?: number ): ValueType | undefined {
    offset ??= 0
    end    ??= buffer.length

    const gMap  = this.gMap_
    const ghash = fnv1A( buffer, offset, end ) % gMap.length

    const d = gMap[ ghash ]

    const slotMap = this.slotMap_

    let slot: number

    if ( d > 0 ) {
      slot = fnv1A24( buffer, offset, end, d ) % slotMap.length
    } else {
      slot = Math.abs( d ) | 0
    }

    if ( slot < 0 ) {
      return
    }

    const keyPrefixSum = this.keyPrefixSum_

    if ( !blobEquals(
        buffer,
        offset,
        end,
        this.keyBlob_,
        keyPrefixSum[ slot ],
        keyPrefixSum[ slot + 1 ] ) ) {
      return
    }

    return this.slotMap_[ slot ] as ValueType
  }
}
