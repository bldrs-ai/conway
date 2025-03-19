import ByteBitSet from './char_bit_set'
import HexParser from './hex_parser'
import IntegerParser from './integer_parser'
import ParsingConstants from './parsing_constants'
import RealParser from './real_parser'
import {
  EncodedToken,
  EncodedUnicodeCharacter as EncodedAsciiCharacter,
} from './token_parsing'


const WHITESPACE = ParsingConstants.WHITE_SPACE_SET
const NEWLINE    = ParsingConstants.NEWLINE
const ZERO       = ParsingConstants.ZERO
const DOT        = ParsingConstants.DOT
const E          = ParsingConstants.E
const LOWER_E    = ParsingConstants.LOWER_E


const integerParser = IntegerParser.Instance
const realParser    = RealParser.Instance
const hexParser     = HexParser.Instance

const RADIX_LUT_SIZE = 64

const radixLUT  = new Float64Array( RADIX_LUT_SIZE )

{
  let radixMultiplier = 1

  for ( let where = 0; where < RADIX_LUT_SIZE; ++where ) {

    radixLUT[ where ] = radixMultiplier

     
    radixMultiplier *= 10
  }
}

 
const MAX_SAFE_FACTOR_INT = Math.trunc( Number.MAX_SAFE_INTEGER / 10 )

/**
 * Inteface encoding a function that matches a parse.
 */
export interface IParsingMatcher
{
    match( buffer: Uint8Array, cursor: number, endCursor: number ): number | undefined;
}

/**
 * A parsing buffer class, note for convenience and brevity, a lot of the
 * functions here are pre-bound using public fields, this means they can
 * be used like C# style delegates, which is handy for constructive parsing,
 * as well as providing easy access to nested parsing/parsing combinator style
 * constructs.
 */
export default class ParsingBuffer {
  // TODO - make this state machine/async capable

  private cursor_: number
  private lineCount_: number = 0
  private initialOffset_: number

  private rewindStack_: number[] = []

  public readonly end: number

  /**
   * Get the current linecount for this parser.
   *
   * @return {number} The line count.
   */
  public get lineCount(): number {
    return this.lineCount_
  }

  /**
   * Get the current position in the buffer this parser is at.
   *
   * @return {number} The cursor position in bytes.
   */
  public get cursor(): number {
    return this.cursor_
  }

  /**
   * Has this parsing buffer hit or parsed its end mark?
   *
   * @return {boolean} True if the parsing buffer is not passed its end mark.
   */
  public get unfinished(): boolean {

    return this.cursor_ < this.end

  }

  /**
   * Has this parsing buffer hit or parsed its end mark?
   *
   * @return {boolean} True if the parsing buffer has passed its end mark.
   */
  public get finished(): boolean {

    return this.cursor_ >= this.end

  }

  /**
   * Get the current cursor address of the stream, relative the initial offset.
   *
   * @return {number} The cursor relative the initial offset,
   * instead of absolute the start of the buffer.
   */
  public get address(): number {

    return this.cursor_ - this.initialOffset_
  }

  /**
   * Reinitialize this with a new buffer, initial offset and end offset.
   *
   * @param buffer The buffer to initialize this with.
   * @param initialOffset The initial offset in bytes to start the cursor at in
   * the buffer.
   * @param endOffset The end offset of the buffer in bytes, relative to the start
   * of the buffer.
   */
  public reinit( buffer: Uint8Array, initialOffset: number, endOffset: number ) {
    this.rewindStack_.length = 0

    this.cursor_                = initialOffset
    this.lineCount_             = 0;
    (this.buffer as Uint8Array) = buffer;

    (this.end as number) = endOffset
  }

  /**
   * Construct this with a buffer, initial offset into the buffer and an end offset.
   *
   * @param buffer Input datasource.
   * @param initialOffset The initial offset in the buffer to start parsing from (will default to 0)
   * @param endOffset The (exclusive) offset to stop parsing/treat as the end of the buffer
   * (will default to the buffer's length)
   */
  constructor( public readonly buffer: Uint8Array, initialOffset?: number, endOffset?: number ) {
    this.initialOffset_ = initialOffset ?? 0

    this.cursor_ = this.initialOffset_
    this.end    = endOffset ?? buffer.length
  }

  /**
   * Begin a parsing cursor transaction, that allows us to rollback to a parse point.
   */
  public begin = (): void => {

    this.rewindStack_.push( this.cursor_ )
  }

  /**
   * Move the cursor forwards while a particular char isn't found.
   *
   * @param chars
   */
  public whileNot = ( chars: ByteBitSet ): void => {
    let   localCursor  = this.cursor_
    const end          = this.end
    const input        = this.buffer

    while ( localCursor < end ) {

      const currentChar = input[ localCursor ]

      if ( chars.has( currentChar ) ) {
        break
      }

      ++localCursor
    }

    this.cursor_ = localCursor
  }

  /**
   * Commit a parsing cursor transaction, ending the
   * transaction at the current cursor and accepting it.
   *
   * @return {void}
   */
  public commit = (): void => {

    if ( this.rewindStack_.pop() === void 0 ) {
      throw Error( 'Parsing commit without matching begin' )
    }
  }

  /**
   * Rollback a parsing transaction, moving the cursor
   * back to its value at the beginning of a transaction.
   *
   * @return {void}
   */
  public rollback = (): void => {

    const rollbackPoint = this.rewindStack_.pop()

    if ( rollbackPoint === void 0 ) {
      throw Error( 'Parsing rollback without matching begin' )
    }

    this.cursor_ = rollbackPoint
  }

  /**
   * Eat whitespace from the stream.
   *
   * @return {boolean} Always true, but this allows this to be used as a matcher
   */
  public whitespace = (): boolean => {
    let   localCursor  = this.cursor_
    const end          = this.end
    const input        = this.buffer

    while ( localCursor < end ) {

      const currentChar = input[ localCursor ]

      this.lineCount_ += ( currentChar === NEWLINE ) ? 1 : 0

      if ( !WHITESPACE.has( currentChar ) ) {

        break
      }

      ++localCursor
    }

    this.cursor_ = localCursor

    return true
  }

  /**
   * Match an encoded token at the current cursor,
   * and rewind if it's not matched.
   *
   * @param encoded The encoded token.
   * @return {boolean} True if the token is matched.
   */
  public token = ( encoded: EncodedToken ): boolean => {
    const tokenLength = encoded.length

    let tokenCursor = 0
    let cursor      = this.cursor_

    const end       = this.end
    const buffer    = this.buffer

    while ( cursor < end && tokenCursor < tokenLength ) {
      if ( buffer[ cursor ] !== encoded[ tokenCursor ] ) {
        break
      }

      ++cursor
      ++tokenCursor
    }

    const result = tokenCursor === tokenLength

    if ( result ) {
      this.cursor_ = cursor
    }

    return result
  }

  /**
   * Match an integer
   *
   * @return {boolean} True if an integer has been parsed at the current location,
   * false if no integer has been found and the cursor has been rewound
   */
  public integer = (): boolean => {
    const parseResult = integerParser.signed( this.buffer, this.cursor, this.end )

    if ( parseResult !== undefined ) {
      this.cursor_ = parseResult

      return true
    }

    return false
  }

  /**
   * Try and match a single matching function, with rewind semantics.
   * (i.e. return to the initial cursor on failure).
   *
   * @param against The matching function to run.
   * @return {boolean} True if a match is found. False otherwise.
   */
  public match = (
      against: (
        buffer: Uint8Array,
        cursor: number,
        end: number ) => number | undefined ): boolean => {
    const parseResult = against( this.buffer, this.cursor, this.end )

    if ( parseResult !== undefined ) {
      this.cursor_ = parseResult

      return true
    }

    return false
  }

  /**
   * Try and run a sequence of parsing operations, with rewind semantics
   * (i.e. return to the initial cursor on failure).
   *
   * @param against The sequence to run.
   * @return {boolean} True if all operations in the sequence return true in order. False otherwise.
   */
  public sequence = ( ...against : (() => boolean)[] ): boolean => {
    const initialCursor = this.cursor_

    for ( const matcher of against ) {
      if ( !matcher() ) {
        this.cursor_ = initialCursor

        return false
      }
    }

    return true
  }
  /**
   * Try and run a sequence of parsing operations, with rewind semantics
   * (i.e. return to the initial cursor on failure).
   *
   * Also eats whitespace before each match.
   *
   * @param against The sequence to run.
   * @return {boolean} True if all operations in the sequence return true in order. False otherwise.
   */
  public sequencews = ( ...against : (() => boolean)[] ): boolean => {
    const initialCursor = this.cursor_

    const whitespace = this.whitespace

    for ( const matcher of against ) {
      whitespace()

      if ( !matcher() ) {
        this.cursor_ = initialCursor

        return false
      }
    }

    return true
  }

  /**
   * In order of specification, try each operation in turn until one succeeds,
   * rewinding the cursor on each failure.
   *
   * @param choices The sequence to run.
   * @return {boolean} True if any operations in the sequence return true. False otherwise.
   */
  public choice = ( ...choices : (() => boolean)[] ): boolean => {
    const initialCursor = this.cursor_

    for ( const matcher of choices ) {
      if ( matcher() ) {
        return true
      }

      this.cursor_ = initialCursor
    }

    return false
  }

  /**
   * Match an unsigned number.
   *
   * @return {boolean} True if an integer has been parsed at the current location, false if
   * no integer has been found and the cursor has been rewound
   */
  public unsigned = (): boolean => {
    const parseResult = integerParser.unsigned( this.buffer, this.cursor, this.end )

    if ( parseResult !== undefined ) {
      this.cursor_ = parseResult

      return true
    }

    return false
  }

  /**
   * Match against a single char and move the cursor forwards if so.
   *
   * @param value A char in the ascii range that's been encoded into a number.
   * @return {boolean} True if the match was successful.
   */
  public char = ( value: EncodedAsciiCharacter ): boolean => {
    const cursor = this.cursor_
    const result = ( cursor < this.end ) && this.buffer[ cursor ] === value

    if ( result ) {
      this.cursor_ = cursor + 1
    }

    return result
  }

  /**
   * Match against any one of the chars in a token and return the index in the token.
   *
   * @param encoded The encoded token to match against
   * @return {number | undefined} True if the match was successful.
   */
  public indexof = ( encoded: EncodedToken ): number | undefined => {

    const cursor      = this.cursor_

    if ( cursor >= this.end ) {
      return
    }

    const tokenLength = encoded.length

    const currentChar   = this.buffer[cursor]
    let tokenCursor   = 0

    while ( tokenCursor < tokenLength ) {
      if ( currentChar !== encoded[ tokenCursor ] ) {
        break
      }

      ++tokenCursor
    }

    const result = tokenCursor !== tokenLength ? tokenCursor : (void 0)

    if ( result ) {
      this.cursor_ = cursor + 1
    }

    return result
  }

  /**
   * Match an unsigned hex number
   *
   * @return {boolean} True if a hex number has been parsed at the current location,
   * false if none has been found and the cursor has been rewound
   */
  public hex = (): boolean => {
    return this.match( hexParser.unprefixed )
  }

  /**
   * Match an unsigned hex number with a C style prefix (0x 0X)
   *
   * @return {boolean} True if a hex number has been parsed at the current location,
   * false if none has been found and the cursor has been rewound
   */
  public hexc = (): boolean => {
    return this.match( hexParser.prefixed )
  }

  /**
   * Match a real
   *
   * @return {boolean} True if an integer has been parsed at the current location,
   * false if no integer has been found and the cursor has been rewound
   */
  public real = (): boolean => {
    const parseResult = realParser.signed( this.buffer, this.cursor_, this.end )

    if ( parseResult !== undefined ) {
      this.cursor_ = parseResult

      return true
    }

    return false
  }

  /**
   * Move the cursor forwards 1 byte
   */
  public step(): void {

    ++this.cursor_

  }

  /**
   * Looks at the current cursor value without advancing.
   *
   * @return {number | undefined} the current byte value or undefined if past end of the buffer.
   */
  public peek(): number | undefined {

    if ( this.cursor_ >= this.end ) {
      return (void 0)
    }

    return this.buffer[ this.cursor_ ]
  }

  /**
   * Looks at the current cursor value and advance.
   *
   * @return {number | undefined} the current byte value or undefined if past end of the buffer.
   */
  public get(): number | undefined {

    if ( this.cursor_ >= this.end ) {
      return (void 0)
    }

    return this.buffer[ this.cursor_++ ]
  }

  /**
   * Read a real valued number from the current stream, supports scientific notation.
   *
   * Rewinds the stream if no match is found.
   *
   * @return {number | undefined} The number, or undefined if no match is found.
   */
  public readReal = (): number | undefined => {
    let   cursor = this.cursor_
    const input  = this.buffer
    const end    = this.end

    if ( cursor >= end  ) {
      return
    }

     
    let primarySign = 1

    if ( input[ cursor ] === ParsingConstants.SIGN ) {

      primarySign = -1
    }

    let primary = this.readInteger()

    if ( primary === void 0 ) {
      return
    }

    cursor = this.cursor

    if ( end - cursor < 2 ) {
      return primary
    }

    let decimals = 0

    let absPrimary = Math.abs( primary )

    if ( input[ cursor ] === DOT ) {
      ++cursor

      const firstReadChar = input[ cursor ]

      if ( firstReadChar !== LOWER_E && firstReadChar !== E ) {

        const firstChar = firstReadChar - ZERO

        if ( firstChar < 0 || firstChar > 9 ) {
          this.cursor_ = cursor
          return primary
        }

        absPrimary = ( 10 * absPrimary ) + firstChar

        ++cursor

        while ( cursor < end ) {
          const currentChar = input[ cursor ] - ZERO

          if ( currentChar < 0 || currentChar > 9 ) {
            break
          }

          if ( absPrimary >= MAX_SAFE_FACTOR_INT ) {
            break
          }

          absPrimary *= 10
          absPrimary += currentChar

          ++cursor
        }

        decimals -= ( ( cursor ) - this.cursor_ ) - 1

        while ( cursor < end ) {
          const currentChar = input[ cursor ] - ZERO

          if ( currentChar < 0 || currentChar > 9 ) {
            break
          }

          ++cursor
        }
      }
    }

     

    if ( absPrimary === 0 ) {
      this.cursor_ = cursor
      return absPrimary
    }

    if ( end - cursor > 1 ) {
      const readChar = input[ cursor ]

      if ( readChar === LOWER_E || readChar === E ) {
        this.cursor_ = cursor + 1

        const exponent = this.readInteger()

        if ( exponent !== void 0 ) {
          cursor = this.cursor_
          decimals += exponent
        } else {
          this.cursor_ = cursor
        }
      }
    }

    primary = primarySign * absPrimary

    this.cursor_ = cursor

    if ( decimals === 0 || primary === 0 ) {
      return primary
    }

    while ( decimals < 0 ) {

      const radixLutEntry = Math.min( -decimals, RADIX_LUT_SIZE )

      decimals += radixLutEntry
      // Note, we need to use division here not a multiply
      // by inverse to get the matching rounding mode behaviour.
      primary  /= radixLUT[ radixLutEntry ]
    }

    while ( decimals > 0 ) {

      const radixLutEntry = Math.min( decimals, RADIX_LUT_SIZE )

      decimals -= radixLutEntry
      primary  *= radixLUT[ radixLutEntry ]
    }

    return primary
  }

  /**
   * Read an unsigned integer from UTF-8 or ASCII.
   *
   * Rewinds the stream if no match is found.
   *
   * @return {number | undefined} The number, or undefined if no match is found.
   */
  public readUnsigned = (): number | undefined => {
    let   cursor = this.cursor_
    const input  = this.buffer
    const end    = this.end

     
    if ( cursor >= end  ) {
      return
    }

    const firstChar    = input[ cursor ] - ZERO

    if ( firstChar < 0 || firstChar > 9 ) {
      return
    }

    let base = firstChar

    ++cursor

    while ( cursor < end ) {
      const currentChar = input[ cursor ] - ZERO

      if ( currentChar < 0 || currentChar > 9 ) {
        this.cursor_ = cursor

        return base
      }

      base *= 10
      base += currentChar

      ++cursor
    }

     

    this.cursor_ = cursor

    return base
  }

  /**
   * Read an unsigned integer from UTF-8 or ASCII.
   *
   * Rewinds the stream if no match is found.
   *
   * @return {number | undefined} The number, or undefined if no match is found.
   */
  public readInteger = (): number | undefined => {
    let   cursor = this.cursor_
    const   input  = this.buffer
    const end    = this.end

    if ( cursor >= end  ) {

      return
    }

    let firstChar    = input[ cursor ] - ZERO
    let sign         = 1

    if ( firstChar === ParsingConstants.SIGN_NUM || firstChar === ParsingConstants.PLUS_NUM ) {

      if ( firstChar === ParsingConstants.SIGN_NUM ) {
        sign = -1
      }

      ++cursor

      if ( cursor >= end ) {

        return
      }

      firstChar = input[ cursor ] - ZERO
    }

     
    if ( firstChar < 0 || firstChar > 9 ) {

      return
    }

    let base = firstChar

    ++cursor

    while ( cursor < end ) {

      const currentChar = input[ cursor ] - ZERO

      if ( currentChar < 0 || currentChar > 9 ) {

        this.cursor_ = cursor

        return base * sign
      }

      base *= 10
      base += currentChar

      ++cursor
    }
     

    this.cursor_ = cursor

    return base * sign
  }

}
