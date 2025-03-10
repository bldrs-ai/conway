import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'
import ParsingConstants from '../../parsing/parsing_constants'
import ParsingDfa4Table from '../../parsing/parsing_dfa_4table'

/**
 * DFA State machine states for parsing an enum.
 */
 
enum ENUM_PARSER_STATE {
    TERMINUS         = 0,
    AFTER_DOT        = 1,
    MUST_UPPER_CASE  = 2,
    MAYBE_UPPER_CASE = 3
}
 

const ENUM_PARSER_TERMINUS_FLAGS = ( 1 << ENUM_PARSER_STATE.AFTER_DOT )

const ENUM_MINIMUM_SIZE = 3

/**
 * Efficient DFA based parser for parsing a STEP enum.
 */
export default class StepEnumParser extends ParsingDfa4Table {

  /**
   * Construct the parsing DFA
   */
  constructor() {
    super()

    this.range( ENUM_PARSER_STATE.MUST_UPPER_CASE, 'A', 'Z', ENUM_PARSER_STATE.MAYBE_UPPER_CASE )

    this.range( ENUM_PARSER_STATE.MAYBE_UPPER_CASE, 'A', 'Z', ENUM_PARSER_STATE.MAYBE_UPPER_CASE )
    this.range( ENUM_PARSER_STATE.MAYBE_UPPER_CASE, '0', '9', ENUM_PARSER_STATE.MAYBE_UPPER_CASE )
    this.set( ENUM_PARSER_STATE.MAYBE_UPPER_CASE, '_', ENUM_PARSER_STATE.MAYBE_UPPER_CASE )

    this.set( ENUM_PARSER_STATE.MAYBE_UPPER_CASE, '.', ENUM_PARSER_STATE.AFTER_DOT )
  }

  /**
   * Parse a generated enum that is based on a minimal perfect hash.
   * @param typeMap The map to the enum type using a minimal perfect hash that doesn't
   * require string extraction.
   * @param input The input buffer.
   * @param cursor The offset in the input buffer where the enum may be.
   * @param endCursor The end point of the parse which should not be overflowed.
   * @returns The matching enum value or undefined if none matches
   * or the parse fails.
   */
  public extract = < T extends number >(
    typeMap: MinimalPerfectHash< T >,
    input: Uint8Array,
    cursor: number,
    endCursor: number ): T | undefined => {

    const parsed = this.match( input, cursor, endCursor )

    if ( parsed === void 0 ) {
      return
    }

    return typeMap.get( input, cursor, parsed )
  }

  /**
   * Match a step enum
   * @param input The input buffer to match against.
   * @param cursor The cursor to test the match against.
   * @param endCursor The end point to look at in the buffer.
   * @returns The end of the match.
   */
  public match = ( input: Uint8Array, cursor: number, endCursor: number ) : number | undefined => {
    if ( ( endCursor - cursor ) < ENUM_MINIMUM_SIZE ) {
      return
    }

    if ( input[ cursor ] !== ParsingConstants.DOT ) {
      return
    }

    return super.match(
        input,
        ENUM_PARSER_TERMINUS_FLAGS,
        cursor + 1,
        endCursor,
        ENUM_PARSER_STATE.MUST_UPPER_CASE )
  }

  public static readonly Instance = new StepEnumParser()
}
