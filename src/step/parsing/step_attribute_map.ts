import ParsingDfa16Table from '../../parsing/parsing_dfa_16table'

/**
 * DFA State machine states for parsing a comment.
 */
 
export enum ATTRIBUTE_PARSE_TYPE {
  INVALID         = 0, // TERMINUS TYPE
  NUMBER          = 1, // 0-9 or -
  ENUM            = 2, // .
  STRING          = 3, // '
  REFERENCE       = 4, // #
  CONTAINER       = 5, // (
  HEXBITS         = 6, // "
  NULL            = 7, // $
  DERIVED         = 8,  // *
  INLINE_INSTANCE = 9
}
 

/**
 * Maps characters to attributes for discriminators in STEP.
 */
export default class StepAttributeMap extends ParsingDfa16Table {
  /**
   * Construct the table.
   */
  constructor() {
    super( ATTRIBUTE_PARSE_TYPE.NUMBER )

    this.range( ATTRIBUTE_PARSE_TYPE.NUMBER, '0', '9', ATTRIBUTE_PARSE_TYPE.NUMBER )
    this.set( ATTRIBUTE_PARSE_TYPE.NUMBER, '-+', ATTRIBUTE_PARSE_TYPE.NUMBER )

    this.set( ATTRIBUTE_PARSE_TYPE.NUMBER, '.', ATTRIBUTE_PARSE_TYPE.ENUM )
    this.set( ATTRIBUTE_PARSE_TYPE.NUMBER, '\'', ATTRIBUTE_PARSE_TYPE.STRING )
    this.set( ATTRIBUTE_PARSE_TYPE.NUMBER, '#', ATTRIBUTE_PARSE_TYPE.REFERENCE )
    this.set( ATTRIBUTE_PARSE_TYPE.NUMBER, '(', ATTRIBUTE_PARSE_TYPE.CONTAINER )
    this.set( ATTRIBUTE_PARSE_TYPE.NUMBER, '"', ATTRIBUTE_PARSE_TYPE.HEXBITS )
    this.set( ATTRIBUTE_PARSE_TYPE.NUMBER, '$', ATTRIBUTE_PARSE_TYPE.NULL )
    this.set( ATTRIBUTE_PARSE_TYPE.NUMBER, '*', ATTRIBUTE_PARSE_TYPE.DERIVED )
    this.range( ATTRIBUTE_PARSE_TYPE.NUMBER, 'A', 'Z', ATTRIBUTE_PARSE_TYPE.INLINE_INSTANCE )
  }

  /**
   * Get the attribute for a character.
   *
   * @param char The character to match.
   * @return {ATTRIBUTE_PARSE_TYPE} The matching type.
   */
  public get = ( char: number ) : ATTRIBUTE_PARSE_TYPE => {
    return super.get( char, ATTRIBUTE_PARSE_TYPE.NUMBER ) as ATTRIBUTE_PARSE_TYPE
  }

  public static readonly Instance = new StepAttributeMap()
}
