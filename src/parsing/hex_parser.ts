import ParsingConstants from './parsing_constants'
import ParsingDfa4Table from './parsing_dfa_4table'

/**
 * DFA State machine states for parsing a hex number.
 */
 
enum HEX_STATES {
    TERMINUS        = 0,
    MUST_DIGIT      = 1,
    MAYBE_DIGIT     = 2,
    EXPONENT_PREFIX = 3
}
 

const DOUBLEQUOTE        = ParsingConstants.DOUBLEQUOTE
const HEX_TERMINUS_FLAGS = 1 << HEX_STATES.MAYBE_DIGIT // only maybe digit.
const ZERO               = ParsingConstants.ZERO
const A                  = ParsingConstants.A
const a                  = ParsingConstants.a

/**
 * DFA based parser to match an hex number, plain, C or STEP.
 */
export default class HexParser extends ParsingDfa4Table {
  /**
   * Construct the DFA table for the parser.
   */
  constructor() {
    super( HEX_STATES.EXPONENT_PREFIX )

    // This state is only used for step style parsing,
    this.range( HEX_STATES.EXPONENT_PREFIX, '0', '3', HEX_STATES.MUST_DIGIT )

    this.range( HEX_STATES.MUST_DIGIT, '0', '9', HEX_STATES.MAYBE_DIGIT )
    this.range( HEX_STATES.MUST_DIGIT, 'A', 'F', HEX_STATES.MAYBE_DIGIT )
    this.range( HEX_STATES.MUST_DIGIT, 'a', 'f', HEX_STATES.MAYBE_DIGIT )
    this.range( HEX_STATES.MAYBE_DIGIT, '0', '9', HEX_STATES.MAYBE_DIGIT )
    this.range( HEX_STATES.MAYBE_DIGIT, 'A', 'F', HEX_STATES.MAYBE_DIGIT )
    this.range( HEX_STATES.MAYBE_DIGIT, 'a', 'f', HEX_STATES.MAYBE_DIGIT )
  }

  /**
   * Match unprefixed hex data.
   *
   * @param input The input buffer to match against.
   * @param cursor The cursor to test the match against.
   * @param endCursor The end point to look at in the buffer.
   * @return {number | undefined} The end of the match or undefined if none found.
   */
  public unprefixed = (
      input: Uint8Array,
      cursor: number,
      endCursor: number ) : number | undefined => {
    return this.match( input, HEX_TERMINUS_FLAGS, cursor, endCursor, HEX_STATES.MUST_DIGIT )
  }

  /**
   * Match hex data, with a C style prefix of 0x or 0X.
   *
   * @param input The input buffer to match against.
   * @param cursor The cursor to test the match against.
   * @param endCursor The end point to look at in the buffer.
   * @return {number | undefined} The end of the match or undefined if none found.
   */
  public prefixed = (
      input: Uint8Array,
      cursor: number,
      endCursor: number ) : number | undefined => {
     
    if ( ( endCursor - cursor ) < 3 ) {
      return
    }

    if ( input[ cursor ] !== ParsingConstants.ZERO ) {
      return
    }

    const nextValue = input[ cursor + 1 ]

    if ( nextValue !== ParsingConstants.CAPITAL_X && nextValue !== ParsingConstants.LOWER_CASE_X ) {
      return
    }

     
    return this.match( input, HEX_TERMINUS_FLAGS, cursor + 2, endCursor, HEX_STATES.MUST_DIGIT )
  }

  /**
   * Match hex data, with a STEP style
   *
   * @param input The input buffer to match against.
   * @param cursor The cursor to test the match against.
   * @param endCursor The end point to look at in the buffer.
   * @return {number | undefined} The end of the match or undefined if none found.
   */
  public step = ( input: Uint8Array, cursor: number, endCursor: number ) : number | undefined => {
     
    if ( ( endCursor - cursor ) < 4 ) {
      return
    }

    if ( input[ cursor ] !== DOUBLEQUOTE ) {
      return
    }

    const exponentCursor = cursor + 1
    const prefixResult   =
      this.match( input, HEX_TERMINUS_FLAGS, exponentCursor, endCursor, HEX_STATES.EXPONENT_PREFIX )

    if ( prefixResult === undefined || prefixResult >= endCursor ) {
      return
    }

    return input[ prefixResult ] === DOUBLEQUOTE ? prefixResult + 1 : (void 0)
  }

  /**
   * Parse a step hex value out to a binary value with the number of bits.
   *
   * @param input The input buffer to match against.
   * @param cursor The cursor to test the match against.
   * @param endCursor The end point to look at in the buffer.
   * @return {[Uint8Array, number] | undefined} The extracted value or undefined.
   */
  public extractStep = (
      input: Uint8Array,
      cursor: number,
      endCursor: number ) : [Uint8Array, number] | undefined => {
     
    if ( ( endCursor - cursor ) < 4 ) {
      return
    }

    if ( input[ cursor ] !== DOUBLEQUOTE ) {
      return
    }

    const exponentCursor = cursor + 1
    const prefixResult   =
      this.match( input, HEX_TERMINUS_FLAGS, exponentCursor, endCursor, HEX_STATES.EXPONENT_PREFIX )

    if ( prefixResult === undefined || prefixResult >= endCursor ) {
      return
    }

    if ( input[ prefixResult ] !== DOUBLEQUOTE ) {
      return
    }

    const hexExponent = input[ exponentCursor ] - ZERO
    const startHex    = exponentCursor + 1
     
    const bitCount    = ( ( prefixResult - startHex ) * 4 ) - hexExponent
    const hexBuffer   = new Uint8Array( ( prefixResult - exponentCursor ) >>> 1 )

    for ( let where = startHex; where < prefixResult; ++where ) {
      const currentChar = input[ ( 1 + prefixResult ) - where ]

       
      hexBuffer[ ( where - startHex ) >>> 1 ] |=
        ( currentChar >= a ?
          ( 10 + ( currentChar - a ) ) :
          ( currentChar >= A ? 10 + ( currentChar - A ) : currentChar - ZERO ) ) <<
            ( ( ~where & 1 ) << 2 )
       
    }

    return [hexBuffer, bitCount]
  }

  public static readonly Instance = new HexParser()
}
