import ParsingDfa16Table from './parsing_dfa_16table'

/**
 * DFA State machine states for parsing a real.
 */
 
enum REAL_STATES {
  TERMINUS          = 0,
  SIGN_OR_DIGIT_I   = 1,
  MUST_DIGIT_I      = 2,
  MAYBE_DIGIT_I     = 3,
  MUST_DIGIT_E_EXIT = 4,
  MAYBE_DIGIT_F     = 5,
  SIGN_OR_DIGIT_E   = 6,
  MUST_DIGIT_E      = 7,
  MAYBE_DIGIT_E     = 8
}
 

const REAL_TERMINUS_FLAGS =
  ( 1 << REAL_STATES.MAYBE_DIGIT_E ) |
  ( 1 << REAL_STATES.MAYBE_DIGIT_I ) |
  ( 1 << REAL_STATES.MAYBE_DIGIT_F ) |
  ( 1 << REAL_STATES.MUST_DIGIT_E_EXIT ) // only maybe digit.

/**
 * DFA based parser to match a real number, including scientific.
 */
export default class RealParser extends ParsingDfa16Table {
  /**
   * Construct the DFA table.
   */
  constructor() {
    super( REAL_STATES.MAYBE_DIGIT_E )

    this.range( REAL_STATES.SIGN_OR_DIGIT_I, '0', '9', REAL_STATES.MAYBE_DIGIT_I )
    this.range( REAL_STATES.MUST_DIGIT_I, '0', '9', REAL_STATES.MAYBE_DIGIT_I )
    this.range( REAL_STATES.MAYBE_DIGIT_I, '0', '9', REAL_STATES.MAYBE_DIGIT_I )

    this.range( REAL_STATES.MUST_DIGIT_E_EXIT, '0', '9', REAL_STATES.MAYBE_DIGIT_F )
    this.set( REAL_STATES.MUST_DIGIT_E_EXIT, 'E', REAL_STATES.SIGN_OR_DIGIT_E )
    this.set( REAL_STATES.MUST_DIGIT_E_EXIT, 'e', REAL_STATES.SIGN_OR_DIGIT_E )

    this.range( REAL_STATES.MAYBE_DIGIT_F, '0', '9', REAL_STATES.MAYBE_DIGIT_F )

    this.range( REAL_STATES.SIGN_OR_DIGIT_E, '0', '9', REAL_STATES.MAYBE_DIGIT_E )
    this.range( REAL_STATES.MUST_DIGIT_E, '0', '9', REAL_STATES.MAYBE_DIGIT_E )
    this.range( REAL_STATES.MAYBE_DIGIT_E, '0', '9', REAL_STATES.MAYBE_DIGIT_E )

    this.set( REAL_STATES.SIGN_OR_DIGIT_I, '+-', REAL_STATES.MUST_DIGIT_I )
    this.set( REAL_STATES.SIGN_OR_DIGIT_E, '+-', REAL_STATES.MUST_DIGIT_E )
    this.set( REAL_STATES.MAYBE_DIGIT_I, '.', REAL_STATES.MUST_DIGIT_E_EXIT )
    this.set( REAL_STATES.MAYBE_DIGIT_I, 'eE', REAL_STATES.SIGN_OR_DIGIT_E )
    this.set( REAL_STATES.MAYBE_DIGIT_F, 'eE', REAL_STATES.SIGN_OR_DIGIT_E )
  }

  /**
   * Match a signed real and returned the updated cursor position or undefined if no match is found
   *
   * @param input The input buffer to match against.
   * @param cursor The cursor to test the match against.
   * @param endCursor The end point to look at in the buffer.
   * @return {number | undefined} The end of the match or undefined if none found.
   */
  public signed = ( input: Uint8Array, cursor: number, endCursor: number ) : number | undefined => {
    return this.match( input, REAL_TERMINUS_FLAGS, cursor, endCursor, REAL_STATES.SIGN_OR_DIGIT_I )
  }

  /**
   * Match an unsigned real and return the updated cursor position or undefined if no match is found
   *
   * @param input The input buffer to match against.
   * @param cursor The cursor to test the match against.
   * @param endCursor The end point to look at in the buffer.
   * @return {number | undefined} The end of the match or undefined if none found.
   */
  public unsigned = (
      input: Uint8Array,
      cursor: number,
      endCursor: number ) : number | undefined => {
    return this.match( input, REAL_TERMINUS_FLAGS, cursor, endCursor, REAL_STATES.MUST_DIGIT_I )
  }

  public static readonly Instance = new RealParser()
}
