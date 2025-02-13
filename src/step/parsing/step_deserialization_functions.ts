import HexParser from '../../parsing/hex_parser'
import ParsingBuffer from '../../parsing/parsing_buffer'
import ParsingConstants from '../../parsing/parsing_constants'
import TokenMatch from '../../parsing/token_parsing'
import StepCommentParser from './step_comment_parser'
import StepEntityIdentifierParser from './step_entity_identifier_parser'
import StepEnumParser from './step_enum_parser'
import StepStringParser from './step_string_parser'


const trueMatch         = new TokenMatch( '.TRUE.' )
const falseMatch        = new TokenMatch( '.FALSE.' )
const unknownMatch      = new TokenMatch( '.UNKNOWN.' )
const unknownUMatch     = new TokenMatch( '.U.' )
const trueTMatch        = new TokenMatch( '.T.' )
const falseFMatch       = new TokenMatch( '.F.' )
const DOLLAR           = ParsingConstants.DOLLAR
const identifierParser = StepEntityIdentifierParser.Instance
const commentParser    = StepCommentParser.Instance.match

const WHITESPACE   = ParsingConstants.WHITE_SPACE_SET
const OPEN_PAREN   = ParsingConstants.OPEN_PAREN
const CLOSE_PAREN  = ParsingConstants.CLOSE_PAREN
const QUOTE        = ParsingConstants.QUOTE
const COMMA        = ParsingConstants.COMMA
const stringParser = StepStringParser.Instance.match
const HASH         = ParsingConstants.HASH
const ZERO         = ParsingConstants.ZERO
const SLASH        = ParsingConstants.SLASH

const parsingBufferReusable = new ParsingBuffer( new Uint8Array( 1 ), 0, 1 )


/**
 * NVL is a null coalescing function required for STEP.
 *
 * @param testValue The value to test.
 * @param replaceValue The value to replace it with if the test fails.
 * @return {any | null | undefined} Test value if it's not nullish, replaceValue otherwise.
 */
export function NVL< T >( testValue: T | null | undefined, replaceValue: T ): T {
  return testValue ?? replaceValue
}


/**
 * Return the Hi Index of an array (Express expects 1 based here, so it's length).
 *
 * @param testValue The value try and get a length from.
 * @return {number} The length if this is a valid array, or 0 otherwise.
 */
export function HIINDEX< T >( testValue: T[] | null | undefined ): number {
  return testValue?.length ?? 0
}

/**
 * Return the size of an array
 *
 * @param testValue The value try and get a length from.
 * @return {number} The length if this is a valid array, or 0 otherwise.
 */
export function SIZEOF< T >( testValue: T[] | null | undefined ): number {
  return testValue?.length ?? 0
}


/**
 * Step try and extract an optional value (null).
 *
 * @param buffer The buffer to extract it from.
 * @param cursor The position in the buffer to try and extract it from.
 * @param endCursor The last position accessible for this read in the buffer.
 * @return {null | undefined} Null if this is optional, undefined otherwise.
 */
export function stepExtractOptional(
    buffer: Uint8Array,
    cursor: number,
    endCursor: number): null | undefined {
  if ( endCursor - cursor === 0 ) {
    return
  }

  if ( buffer[ cursor ] === DOLLAR ) {
    return null
  }

  return undefined
}

/**
 * Extract a STEP number
 *
 * @param buffer The buffer to extract it from.
 * @param cursor The position in the buffer to try and extract it from.
 * @param endCursor The last position accessible for this read in the buffer.
 * @return {number | undefined} The number if it can be extracted, undefined otherwise.
 */
export function stepExtractNumber(
    buffer: Uint8Array,
    cursor: number,
    endCursor: number ): number | undefined {
  // We only use these in parsing here and with JavaScript we don't
  // need to worry about thread re-entrancy.
  parsingBufferReusable.reinit( buffer, cursor, endCursor )

  return parsingBufferReusable.readReal()
}


/**
 * Extract a STEP logical value (which can be true, false or unknown)
 *
 * @param buffer The buffer to extract it from.
 * @param cursor The position in the buffer to try and extract it from.
 * @param endCursor The last position accessible for this read in the buffer.
 * @return {boolean | null | undefined} The boolean if it can be extracted, null for unknown
 * and undefined if the value can't be extracted.
 */
export function stepExtractLogical(
    buffer: Uint8Array,
    cursor: number,
    endCursor: number ): boolean | null | undefined {
  if ( trueTMatch.match( buffer, cursor, endCursor ) !== void 0 ) {
    return true
  }

  if ( falseFMatch.match( buffer, cursor, endCursor ) !== void 0 ) {
    return false
  }

  if ( unknownUMatch.match( buffer, cursor, endCursor ) !== void 0 ) {
    return null
  }

  if ( trueMatch.match( buffer, cursor, endCursor ) !== void 0 ) {
    return true
  }

  if ( falseMatch.match( buffer, cursor, endCursor ) !== void 0 ) {
    return false
  }

  if ( unknownMatch.match( buffer, cursor, endCursor ) !== void 0 ) {
    return null
  }
}


/**
 * Extract a STEP boolean value (which can be true or false)
 *
 * @param buffer The buffer to extract it from.
 * @param cursor The position in the buffer to try and extract it from.
 * @param endCursor The last position accessible for this read in the buffer.
 * @return {boolean | undefined} The boolean if it can be extracted
 * and undefined if the value can't be extracted.
 */
export function stepExtractBoolean(
    buffer: Uint8Array,
    cursor: number,
    endCursor: number ): boolean | undefined {
  if ( trueTMatch.match( buffer, cursor, endCursor ) !== void 0 ) {
    return true
  }

  if ( falseFMatch.match( buffer, cursor, endCursor ) !== void 0 ) {
    return false
  }

  if ( trueMatch.match( buffer, cursor, endCursor ) !== void 0 ) {
    return true
  }

  if ( falseMatch.match( buffer, cursor, endCursor ) !== void 0 ) {
    return false
  }
}

/**
 * Skip a value in the parse (doesn't apply to arrays, just flat),
 * either til the next array end (close bracket) or the next comma.
 *
 * @param buffer The buffer to read from.
 * @param cursor The current read cursor.
 * @param endCursor The highest possible cursor to read from.
 * @throws {Error} When the parse syntax is incorrect.
 * @return {number} The new cursor.
 */
export function skipValue(
    buffer: Uint8Array,
    cursor: number,
    endCursor: number ) : number {

  let stackDepth = 0

  // Eat characters until we get to a comma or close paren.
  while ( cursor < endCursor ) {

    let previousCursor: number

    // Skip commment and whitespace.
    do {
      previousCursor = cursor

      while ( cursor < endCursor && WHITESPACE.has( buffer[ cursor ]) ) {
        ++cursor
      }

      cursor = commentParser( buffer, cursor, endCursor ) ?? cursor
    }
    while ( previousCursor !== cursor )

    const readChar = buffer[ cursor ]

    switch ( readChar ) {

      case SLASH:

        cursor = commentParser( buffer, cursor, endCursor ) ?? ( cursor + 1 )
        break

      case QUOTE: {

        const parsedStringOffset = stringParser( buffer, cursor, endCursor )

        // Couldn't parse a string, something's wrong.
        if ( parsedStringOffset === void 0 ) {
          throw new Error( 'Couldn\'t parse string' )
        }

        cursor = parsedStringOffset
        break
      }

      case OPEN_PAREN:

        ++stackDepth
        ++cursor
        break

      case COMMA:

        if ( stackDepth < 1 ) {
          return cursor
        }

        ++cursor
        break

      case CLOSE_PAREN:

        if ( stackDepth < 1 ) {
          return cursor
        }

        --stackDepth
        ++cursor
        break

      default:

        ++cursor
    }
  }

  throw new Error( 'Unterminated value' )
}

/**
 * Extract a STEP an array (iterable set of indices to array values to extract)
 *
 * @param buffer The buffer to extract it from.
 * @param cursor The position in the buffer to try and extract it from.
 * @param endCursor The last position accessible for this read in the buffer.
 * @return {number} Returns a negative number on termination/error
 * matching the values in IncermentalParseEndState, or the new cursor
 * if there is a value in .
 */
export function stepExtractArrayBegin(
    buffer: Uint8Array,
    cursor: number,
    endCursor: number ): number {

  if ( ( cursor + 1 ) >= endCursor || buffer[ cursor ] !== OPEN_PAREN ) {
    throw new Error( 'Couldn\'t extract array due to lack of opening parenthesis' )
  }

  ++cursor

  let previousCursor

  do {
    previousCursor = cursor

    while ( cursor < endCursor && WHITESPACE.has( buffer[ cursor ]) ) {
      ++cursor
    }

    cursor = commentParser( buffer, cursor, endCursor ) ?? cursor
  }
  while ( previousCursor !== cursor )

  if ( buffer[ cursor ] === CLOSE_PAREN ) {
    return -( cursor + 1 )
  }

  return cursor
}

/**
 * Extract a STEP an array (iterable set of indices to array values to extract)
 *
 * @param isInitial Is this the initial element?
 * @param buffer The buffer to extract it from.
 * @param cursor The position in the buffer to try and extract it from.
 * @param endCursor The last position accessible for this read in the buffer.
 * @return {number} Returns a negative number on termination/error
 * matching the values in IncermentalParseEndState, or the new cursor
 * if there is a value in the token.
 */
export function stepExtractArrayToken(
    buffer: Uint8Array,
    cursor: number,
    endCursor: number ): number {

  let previousCursor: number

  do {
    previousCursor = cursor

    while ( cursor < endCursor && WHITESPACE.has( buffer[ cursor ]) ) {
      ++cursor
    }

    cursor = commentParser( buffer, cursor, endCursor ) ?? cursor
  }
  while ( previousCursor !== cursor )

  if ( cursor >= endCursor ) {
    throw new Error( 'Unterminated array' )
  }

  if ( buffer[ cursor ] === CLOSE_PAREN ) {
    return -( cursor + 1 )
  }

  if ( buffer[ cursor ] !== COMMA ) {

    throw new Error( 'Unterminated array' )
  }

  cursor += 1

  do {
    previousCursor = cursor

    while ( cursor < endCursor && WHITESPACE.has( buffer[ cursor ]) ) {
      ++cursor
    }

    cursor = commentParser( buffer, cursor, endCursor ) ?? cursor
  }
  while ( previousCursor !== cursor )

  return cursor
}

/**
 * Extract a STEP an array (iterable set of indices to array values to extract)
 *
 * @param buffer The buffer to extract it from.
 * @param cursor The position in the buffer to try and extract it from.
 * @param endCursor The last position accessible for this read in the buffer.
 * @throws {Error} If there is a syntax error, an error is thrown.
 * @yields {number} The index for each entry.
 * @return {IterableIterator} Lazy iterator to extract value.
 */
export function* stepExtractArray(
    buffer: Uint8Array,
    cursor: number,
    endCursor: number ): IterableIterator< number > {
  if ( ( cursor + 1 ) >= endCursor || buffer[ cursor ] !== OPEN_PAREN ) {
    throw new Error( 'Couldn\'t extract array' )
  }

  ++cursor

  let stackDepth = 1

  while ( cursor < endCursor && stackDepth > 0 ) {
    let previousCursor: number

    do {
      previousCursor = cursor

      while ( cursor < endCursor && WHITESPACE.has( buffer[ cursor ]) ) {
        ++cursor
      }

      cursor = commentParser( buffer, cursor, endCursor ) ?? cursor
    }
    while ( previousCursor !== cursor )

    if ( cursor >= endCursor ) {
      throw new Error( 'Unterminated array' )
    }

    if ( buffer[ cursor ] === CLOSE_PAREN ) {
      return
    }

    yield cursor

    let readChar = 0

    while ( cursor < endCursor && stackDepth > 0 && readChar !== COMMA ) {
      // skip whitespace.
      do {
        previousCursor = cursor

        while ( cursor < endCursor && WHITESPACE.has( buffer[ cursor ]) ) {
          ++cursor
        }

        cursor = commentParser( buffer, cursor, endCursor ) ?? cursor
      }
      while ( previousCursor !== cursor )

      if ( cursor === endCursor ) {
        break
      }

      // Eat characters until we get to a comma or close paren.
      while ( cursor < endCursor ) {
        readChar = buffer[ cursor ]

        // String is a special case because it might contain control characters,
        // we will run the string parsing DFA to skip over it.
        if ( readChar === QUOTE ) {
          const parsedStringOffset = stringParser( buffer, cursor, endCursor )

          // Couldn't parse a string, something's wrong.
          if ( parsedStringOffset === void 0 ) {
            throw new Error( 'Unparsable string in array' )
          }

          cursor = parsedStringOffset
          continue
        }

        ++cursor

        // Comma starts a new param entry
        if ( readChar === COMMA ) {
          if ( stackDepth <= 1 ) {
            break
          }

        // Will effectively terminate if this is the end of the entity, or
        // simply end the inline entity/container case otherwise.
        } else if ( readChar === CLOSE_PAREN ) {
          --stackDepth

          if ( stackDepth === 0 ) {
            break
          }
        // Handles inline entity case and container cases.
        } else if ( readChar === OPEN_PAREN ) {
          ++stackDepth
          break
        }
      }
    }
  }

  if ( cursor >= endCursor ) {
    throw new Error( 'Unterminated array' )
  }
}


/**
 * Extracts an inline element and returns its cursor, or none if it can't be found.
 *
 * @param buffer The buffer to extract it from.
 * @param cursor The position in the buffer to try and extract it from.
 * @param endCursor The last position accessible for this read in the buffer.
 * @return {number | undefined} The index address of the start of the inline element, or
 * undefined if one can't be found.
 */
export function stepExtractInlineElemement(
    buffer: Uint8Array,
    cursor: number,
    endCursor: number ): number | undefined {
  const identifier = identifierParser.match( buffer, cursor, endCursor )

  if ( identifier === void 0 ) {
    return
  }

  cursor = identifier

  let previousCursor: number

  do {
    previousCursor = cursor

    while ( cursor < endCursor && WHITESPACE.has( buffer[ cursor ]) ) {
      ++cursor
    }

    cursor = commentParser( buffer, cursor, endCursor ) ?? cursor
  }
  while ( previousCursor !== cursor )

  if ( cursor >= endCursor ) {
    return
  }

  if ( buffer[ cursor ] !== OPEN_PAREN ) {
    return
  }

  ++cursor

  do {
    previousCursor = cursor

    while ( cursor < endCursor && WHITESPACE.has( buffer[ cursor ]) ) {
      ++cursor
    }

    cursor = commentParser( buffer, cursor, endCursor ) ?? cursor
  }
  while ( previousCursor !== cursor )

  return cursor
}

const MINIMUM_REFERENCE_LENGTH = 2

/**
 * Match an unsigned integer and return the updated cursor position or
 * undefined if no match is found
 *
 * @param buffer The buffer to extract it from.
 * @param cursor The position in the buffer to try and extract it from.
 * @param endCursor The last position accessible for this read in the buffer.
 * @return {number | undefined} The reference express ID of the start of the inline element, or
 * undefined if one can't be found.
 */
export function stepExtractReference(
    input: Uint8Array,
    cursor: number,
    endCursor: number ) : number | undefined {
  if ( ( endCursor - cursor ) < MINIMUM_REFERENCE_LENGTH ) {
    return
  }

  if ( input[ cursor ] !== HASH ) {
    return
  }

  ++cursor

  const firstChar = input[ cursor ] - ZERO

  // eslint-disable-next-line no-magic-numbers
  if ( firstChar < 0 || firstChar > 9 ) {
    return
  }

  let base = firstChar

  ++cursor

  while ( cursor < endCursor ) {
    const currentChar = input[ cursor ] - ZERO

    // eslint-disable-next-line no-magic-numbers
    if ( currentChar < 0 || currentChar > 9 ) {
      return base
    }

    // eslint-disable-next-line no-magic-numbers
    base *= 10
    base += currentChar

    ++cursor
  }

  return base
}

const stepExtractEnum = StepEnumParser.Instance.extract

export { stepExtractEnum }

const stepExtractString = StepStringParser.Instance.extract

export { stepExtractString }

const stepExtractBinary = HexParser.Instance.extractStep

export { stepExtractBinary }

