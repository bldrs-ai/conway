/**
 * FNV1A hash function, used for minimal perfect hashing algorithm.
 * @param data The buffer to read data to hash from
 * @param offset The offset into the buffer to start reading data to hash
 * @param end The end offset (non-inclusive) of the data to hash.
 * @param hash The initial hash seed.
 * @returns The hash value.
 */
export function fnv1a( data: Uint8Array, offset: number, end: number, hash: number = 0x811C9DC5 ) {
  for ( ; offset < end; ++offset ) {
    hash ^= data[ offset ]

    // This is the equivalent to multiplying by the FNV1A polynomial,
    // but because JavaScript numbers don't handle the multiply without coing to negative
    // this is what we need to do to get around that.
     
    hash += ( hash << 1 ) + ( hash << 4 ) + ( hash << 7 ) + ( hash << 8 ) + ( hash << 24 )
  }

  // this is needed to handle the fact that javascript has no proper unsigned concept.
  return hash >>> 0
}

/**
 * FNV1A hash function, used for minimal perfect hashing algorithm, with a 24 bit mixing step
 * at the end to avoid problems from pathological cases.
 * @param data The buffer to read data to hash from
 * @param offset The offset into the buffer to start reading data to hash
 * @param end The end offset (non-inclusive) of the data to hash.
 * @param hash The initial hash seed.
 * @returns The hash value.
 */
export function fnv1a24(
    data: Uint8Array,
    offset: number,
    end: number,
    hash: number = 0x811C9DC5 ) {
  for ( ; offset < end; ++offset ) {
    hash ^= data[ offset ]

    // This is the equivalent to multiplying by the FNV1A polynomial,
    // but because JavaScript numbers don't handle the multiply without coing to negative
    // this is what we need to do to get around that.
     
    hash += ( hash << 1 ) + ( hash << 4 ) + ( hash << 7 ) + ( hash << 8 ) + ( hash << 24 )
  }

  // this is needed to handle the fact that javascript has no proper unsigned concept.
  const hashPreFold = hash >>> 0

   
  return ( hashPreFold ^ ( hashPreFold >>> 8 ) ) & 0xFFFFFF
}

/**
 * Test if two blobs in byte array spans are equal.
 * @param a The first blob to test.
 * @param offseta Offset into the first blob.
 * @param enda End of the first blob.
 * @param b The second blob to test.
 * @param offsetb Offset into the second blob,
 * @param endb The end of the second blob.
 * @returns True if the blobs are equal.
 */
export function blobEquals(
    a: Uint8Array,
    offseta: number,
    enda: number,
    b: Uint8Array,
    offsetb: number,
    endb: number ): boolean {
  const lengtha = enda - offseta
  const lengthb = endb - offsetb

  if ( lengtha !== lengthb ) {
    return false
  }

  for ( ; offseta < enda; ++offseta, ++offsetb ) {
    if ( a[ offseta ] !== b[ offsetb ] ) {
      return false
    }
  }

  return true
}
