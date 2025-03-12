import { encodeCharacter, encodeToken } from './token_parsing'


const BITSET_DWORD_COUNT = 8

/**
 * Simple bitset for parsing to identify if a character is a match within a bitset range.
 */
export default class ByteBitSet {
  public readonly bitset = new Uint32Array( BITSET_DWORD_COUNT )

  public has = ( char: number ): boolean => {
    // eslint-disable-next-line no-magic-numbers
    return ( this.bitset[ char >>> 5 ] & ( 1 << ( char & 31 ) ) ) !== 0
  }

  /**
   * Kleene Star operator (zero or many)
   *
   * @param input The input buffer to match against.
   * @param cursor The cursor to test the match against.
   * @param endCursor The end point to look at in the buffer.
   * @param end
   * @return {number} The end of the match.
   */
  public star = ( input: Uint8Array, cursor: number, end: number ) : number => {
    while ( cursor < end && this.has( input[ cursor ] ) ) {
      ++cursor
    }

    return cursor
  }

  /**
   * Plus operator (one or many)
   *
   * @param input The input buffer to match against.
   * @param cursor The cursor to test the match against.
   * @param endCursor The end point to look at in the buffer.
   * @param end
   * @return {number | undefined} The end of the match or undefined.
   */
  public plus = ( input: Uint8Array, cursor: number, end: number ) : number | undefined => {
    if ( cursor >= end || !this.has( input[ cursor ] ) ) {
      return
    }

    ++cursor

    while ( cursor < end && this.has( input[ cursor ] ) ) {
      ++cursor
    }

    return cursor
  }

  /**
   * Set a range of characters into the bitset.
   *
   * @param begin
   * @param end
   */
  protected range( begin: number | string, end: number | string ) {
    if ( typeof begin === 'string' ) {
      begin = encodeCharacter( begin )
    }

    if ( typeof end === 'string' ) {
      end = encodeCharacter( end )
    }

    for ( ; begin <= end; ++begin ) {
      this.set( begin )
    }
  }

  /**
   * Set items in the bitfield corresponding to a byte or bytes.
   *
   * @param chars A byte as number, a string as a set of characters (ASCII) or a list
   * of bytes in a Uint8array.
   */
  public set( chars: number | string | Uint8Array ) {
    if ( typeof chars === 'number' ) {
      // eslint-disable-next-line no-magic-numbers
      this.bitset[ chars >>> 5 ] |= 1 << ( chars & 31 )
    } else if ( typeof chars === 'string' ) {
      this.set( encodeToken( chars ) )
    } else {
      for ( const innerChar of chars ) {
        this.set( innerChar )
      }
    }
  }

}
