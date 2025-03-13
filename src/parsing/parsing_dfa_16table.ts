import { encodeCharacter } from './token_parsing'


const DWORDS_PER_STATE = 32

/**
 * Parser based on at most 16 state table driven DFA table (designed for between
 * 4->15 regular states + terminus, which is always the 0 state), for 8bit symbol
 *
 * sets (such as UTF8 or ASCII)
 */
export default abstract class ParsingDfa16Table {
  protected readonly table_ : Uint32Array

  /**
   * Construct the DFA table with a maximum state count, which allows limited length arrays.
   *
   * @param maximumState The maximum state value, shouldn't be more than 16.
   */
  constructor( maximumState: number = 15 ) {
    this.table_ = new Uint32Array( maximumState * DWORDS_PER_STATE )
  }

  /**
   * Specify a range of transition bytes from one state to another.
   * another state.
   *
   * @param fromState The state to transition from.
   * @param begin The beginning of the range of byte values.
   * Can be a single character string or number.
   * @param end  The ending of the range of byte values (inclusive).
   * Can be a single character string or number.
   * @param value The state to transition to.
   * @return {void}
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
   *
   * @param fromState The state to transition from.
   * @param entry The byte value to transition on.
   * @param value The state to transition to.
   * @return {void}
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

    /* eslint-disable no-magic-numbers */
    if ( entry < 0 || entry > 255 ) {
      throw Error( 'Character for parse was not byte' )
    }

    const previousValueMasked =
      ( this.table_[
          ( ( fromState - 1 ) << 5 ) + ( entry >>> 3 ) ] & ~(( 15 << ( ( entry & 7 ) << 2 ) )))

    this.table_[ ( ( fromState - 1 ) << 5 ) + ( entry >>> 3 ) ] =
      ( value << ( ( entry & 7 ) << 2 ) ) | previousValueMasked
    /* eslint-enable no-magic-numbers */
  }

  /**
   * Get the value of a given state for a given value.
   *
   * Useful for using this for mappings. Will cause an exception if out of bounds.
   *
   * @param value The byte value to lookup.
   * @param state The state to get the value for.
   * @return {number} The table value given a state and input byte
   */
  protected get( value: number, state: number ): number {

    /* eslint-disable no-magic-numbers */
    return (
      this.table_[ ( ( state - 1 ) << 5 ) + ( value >>> 3 ) ] >>> ( ( value & 7 ) << 2 ) ) & 15
    /* eslint-enable no-magic-numbers */
  }

  /**
   * Match a byte run against the DFA.
   *
   * @param buffer The buffer to read from.
   * @param validTerminusFlags What states are terminus (as flags)
   * @param cursor The position in the buffer to start the match from.
   * @param endCursor The last possible position in the buffer to find the match.
   * @param state The initial state to start on.
   * @return {number | undefined} The position in the buffer of the end of the match,
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

      /* eslint-disable no-magic-numbers */
      const nextState =
        ( table[ ( ( state - 1 ) << 5 ) + ( value >>> 3 ) ] >>> ( ( value & 7 ) << 2 ) ) & 15

      if ( nextState === 0 ) {
        break
      }
      /* eslint-enable no-magic-numbers */

      state = nextState
      ++cursor
    }

    if ( ( ( 1 << state ) & validTerminusFlags ) > 0 ) {
      return cursor
    }
  }
}
