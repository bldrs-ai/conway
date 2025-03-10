import ParsingDfa4Table from './parsing_dfa_4table'

/**
 * DFA State machine states for parsing an integer.
 */
 
enum INTEGER_STATES {
    TERMINUS       = 0,
    SIGN_OR_DIGIT  = 1,
    MUST_DIGIT     = 2,
    MAYBE_DIGIT    = 3
}
 

const INTEGER_TERMINUS_FLAGS = 1 << INTEGER_STATES.MAYBE_DIGIT // only maybe digit.

/**
 * DFA based parser to match an integer, or an unsigned integer.
 */
export default class IntegerParser extends ParsingDfa4Table {
  /**
   * Construct the DFA table.
   */
  constructor() {
    super()

    this.range( INTEGER_STATES.SIGN_OR_DIGIT, '0', '9', INTEGER_STATES.MAYBE_DIGIT )
    this.range( INTEGER_STATES.MUST_DIGIT, '0', '9', INTEGER_STATES.MAYBE_DIGIT )
    this.range( INTEGER_STATES.MAYBE_DIGIT, '0', '9', INTEGER_STATES.MAYBE_DIGIT )

    this.set( INTEGER_STATES.SIGN_OR_DIGIT, '-+', INTEGER_STATES.MUST_DIGIT )
  }

  /**
   * Match a signed integer and returned the updated cursor position
   * or undefined if no match is found
   * @param input The input buffer to match against.
   * @param cursor The cursor to test the match against.
   * @param endCursor The end point to look at in the buffer.
   * @returns The end of the match or undefined if none found.
   */
  public signed = ( input: Uint8Array, cursor: number, endCursor: number ) : number | undefined => {
    return this.match(
        input,
        INTEGER_TERMINUS_FLAGS,
        cursor,
        endCursor,
        INTEGER_STATES.SIGN_OR_DIGIT )
  }

  /**
   * Match an unsigned integer and return the updated cursor position
   * or undefined if no match is found
   * @param input The input buffer to match against.
   * @param cursor The cursor to test the match against.
   * @param endCursor The end point to look at in the buffer.
   * @returns The end of the match or undefined if none found.
   */
  public unsigned = (
      input: Uint8Array,
      cursor: number,
      endCursor: number ) : number | undefined => {
    return this.match( input, INTEGER_TERMINUS_FLAGS, cursor, endCursor, INTEGER_STATES.MUST_DIGIT )
  }

  public static readonly Instance = new IntegerParser()
}
