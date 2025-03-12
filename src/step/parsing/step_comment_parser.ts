import ParsingConstants from '../../parsing/parsing_constants'
import ParsingDfa4Table from '../../parsing/parsing_dfa_4table'

/**
 * DFA State machine states for parsing a comment.
 */
 
enum COMMENT_STATE
{
    TERMINUS         = 0,
    ANY_BUT_STAR     = 1,
    STAR_CASE        = 2,
    SLASH_CASE       = 3
}
 

const COMMENT_PARSER_TERMINUS_FLAGS = ( 1 << COMMENT_STATE.SLASH_CASE )

const SLASH = ParsingConstants.SLASH
const STAR  = ParsingConstants.STAR

const COMMENT_MINIMUM_LENGTH = 4
const COMMENT_STAR_LENGTH = 2

/**
 * DFA based parser for parsing a STEP comment.
 */
export default class StepCommentParser extends ParsingDfa4Table {

  /**
   * Construct the DFA
   */
  constructor() {
    super()

    /* eslint-disable no-magic-numbers */
    this.range( COMMENT_STATE.ANY_BUT_STAR, 0, 0xFF, COMMENT_STATE.ANY_BUT_STAR )
    this.set( COMMENT_STATE.ANY_BUT_STAR, '*', COMMENT_STATE.STAR_CASE )
    this.range( COMMENT_STATE.STAR_CASE, 0, 0xFF, COMMENT_STATE.ANY_BUT_STAR )
    this.set( COMMENT_STATE.STAR_CASE, '*', COMMENT_STATE.STAR_CASE )
    this.set( COMMENT_STATE.STAR_CASE, '/', COMMENT_STATE.SLASH_CASE )
    /* eslint-enable no-magic-numbers */

    // Slash case is all terminus, to consume
  }

  /**
   * Match a STEP comment.
   *
   * @param input The input buffer to match against.
   * @param cursor The cursor to test the match against.
   * @param endCursor The end point to look at in the buffer.
   * @return {number | undefined} The end of the match.
   */
  public match = ( input: Uint8Array, cursor: number, endCursor: number ) : number | undefined => {
    if ( ( endCursor - cursor ) < COMMENT_MINIMUM_LENGTH ) {
      return
    }

    if ( input[ cursor ] !== SLASH || input[ cursor + 1 ] !== STAR ) {
      return
    }

    return super.match(
        input,
        COMMENT_PARSER_TERMINUS_FLAGS,
        cursor + COMMENT_STAR_LENGTH,
        endCursor, COMMENT_STATE.ANY_BUT_STAR )
  }

  public static readonly Instance = new StepCommentParser()
}
