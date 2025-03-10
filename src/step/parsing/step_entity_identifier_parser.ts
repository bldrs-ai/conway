import ParsingDfa4Table from '../../parsing/parsing_dfa_4table'


/**
 * DFA State machine states for parsing an identifier.
 */
 
enum IDENTIFIER_PARSER_STATE
{
    TERMINUS             = 0,
    MUST_UPPER_CASE      = 1,
    FOLLOW_ON_UPPER_CASE = 2
}

const IDENTIFIER_TERMINUS_FLAGS = ( 1 << IDENTIFIER_PARSER_STATE.FOLLOW_ON_UPPER_CASE )

/**
 * Parse a step entity identifier - expecting this token to be [A-Z]([A-Z,0-9,_]*),
 * as they are parsed in upper case.
 */
export default class StepEntityIdentifierParser extends ParsingDfa4Table {

  /**
   * Construct the DFA parser state.
   */
  constructor() {
    super()

    this.range(
        IDENTIFIER_PARSER_STATE.MUST_UPPER_CASE,
        'A',
        'Z',
        IDENTIFIER_PARSER_STATE.FOLLOW_ON_UPPER_CASE )

    this.range(
        IDENTIFIER_PARSER_STATE.FOLLOW_ON_UPPER_CASE,
        'A',
        'Z',
        IDENTIFIER_PARSER_STATE.FOLLOW_ON_UPPER_CASE )

    this.range(
        IDENTIFIER_PARSER_STATE.FOLLOW_ON_UPPER_CASE,
        '0',
        '9',
        IDENTIFIER_PARSER_STATE.FOLLOW_ON_UPPER_CASE )

    this.set(
        IDENTIFIER_PARSER_STATE.FOLLOW_ON_UPPER_CASE,
        '_',
        IDENTIFIER_PARSER_STATE.FOLLOW_ON_UPPER_CASE )
  }

  /**
   * Match a step enum
   * @param input The input buffer
   * @param cursor The position in the buffer to test for the match.
   * @param endCursor The end position in the buffer by which the match must terminate.
   * @returns The length of the match or undefined.
   */
  public match = ( input: Uint8Array, cursor: number, endCursor: number ) : number | undefined => {
    return super.match(
        input,
        IDENTIFIER_TERMINUS_FLAGS,
        cursor,
        endCursor,
        IDENTIFIER_PARSER_STATE.MUST_UPPER_CASE )
  }

  public static readonly Instance = new StepEntityIdentifierParser()
}
