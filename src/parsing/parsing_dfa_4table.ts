import { encodeCharacter } from './token_parsing'


const DWORDS_PER_STATE = 16

/**
 * Parser based on at most 3 state table driven DFA table (designed for between 1->3 regular
 * states + terminus, which is always the 0 state), for 8bit symbol sets (such as UTF8 or ASCII)
 *
 * These have 2 bit table entries.
 */
export default abstract class ParsingDfa4Table {
  protected readonly table_: Uint32Array

  /**
   * Construct the DFA table with a maximum state count, which allows limited length arrays.
   * @param maximumState The maximum state value, shouldn't be more than 3.
   */
  constructor( maximumState: number = 3 ) {
    this.table_ = new Uint32Array( maximumState * DWORDS_PER_STATE )
  }

  /**
   * Specify a range of transition bytes from one state to another.
   * another state.
   * @param fromState The state to transition from.
   * @param begin The beginning of the range of byte values.
   * Can be a single character string or number.
   * @param end  The ending of the range of byte values (inclusive).
   * Can be a single character string or number.
   * @param value The state to transition to.
   * @returns
   */
  protected range(
      fromState: number,
      begin: number | string,
      end: number | string,
      value: number ) {
    if ( typeof begin === 'string' ) {
      begin = encodeCharacter( begin )
    }

    if ( typeof end === 'string' ) {
      end = encodeCharacter( end )
    }

    for ( ; begin <= end; ++begin ) {
      this.set( fromState, begin, value )
    }
  }

  /**
   * Specify a transition byte from one state to another.
   * another state.
   * @param fromState The state to transition from.
   * @param entry The byte value to transition on.
   * @param value The state to transition to.
   * @returns
   */
  protected set( fromState: number, entry: number | string | Uint8Array, value: number ) {
    if ( typeof entry === 'string' ) {
      for ( let offset = 0; offset < entry.length; ++offset ) {
        this.set( fromState, encodeCharacter(  entry, offset ), value )
      }

      return
    } else if ( entry instanceof Uint8Array ) {
      for ( const char of entry ) {
        this.set( fromState, char, value )
      }

      return
    }

      // -- All 2 bit related.
    if ( entry < 0 || entry > 255 ) {
      throw Error( 'Character for parse was not byte' )
    }

    const previousValueMasked =
        ( this.table_[
            ( ( fromState - 1 ) << 4 ) + ( entry >>> 4 ) ] & ~( 3 << ( ( entry & 15 ) << 1 ) ))

    this.table_[( ( fromState - 1 ) << 4 ) + ( entry >>> 4 ) ] =
      ( value << ( ( entry & 15 ) << 1 ) ) | previousValueMasked
     
  }

  /**
   * Get the value of a given state for a given value.
   *
   * Useful for using this for mappings. Will cause an exception if out of bounds.
   * @param value The byte value to lookup.
   * @param state The state to get the value for.
   * @returns
   */
  public get( value: number, state: number ): number {

     
    return (
      this.table_[ ( ( state - 1 ) << 4 ) + ( value >>> 4 ) ] >>> ( ( value & 15 ) << 1 ) ) & 3
     
  }

  /**
   * Match a byte run against the DFA.
   * @param buffer The buffer to read from.
   * @param validTerminusFlags What states are terminus (as flags)
   * @param cursor The position in the buffer to start the match from.
   * @param endCursor The last possible position in the buffer to find the match.
   * @param state The initial state to start on.
   * @returns The position in the buffer of the end of the match,
   * or undefined if none found.
   */
  protected match(
      buffer: Uint8Array,
      validTerminusFlags: number,
      cursor: number,
      endCursor: number,
      state: number ): number | undefined {
    const table = this.table_

    while ( cursor < endCursor ) {
      const value     = buffer[ cursor ]

       
      const nextState =
        ( table[ ( ( state - 1 ) << 4 ) + ( value >>> 4 ) ] >>> ( ( value & 15 ) << 1 ) ) & 3
       

      if ( nextState === 0 ) {
        break
      }

      state = nextState
      ++cursor
    }

    if ( ( ( 1 << state ) & validTerminusFlags ) > 0 ) {
      return cursor
    }
  }
}

