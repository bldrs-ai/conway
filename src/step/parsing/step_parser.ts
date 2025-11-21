import TypeIndex from '../../indexing/type_index'
import HexParser from '../../parsing/hex_parser'
import ParsingBuffer from '../../parsing/parsing_buffer'
import ParsingConstants from '../../parsing/parsing_constants'
import {
  EncodedToken,
  EncodedUnicodeCharacter as EncodedAsciiCharacter,
  encodeToken,
} from '../../parsing/token_parsing'
import StepAttributeMap, { ATTRIBUTE_PARSE_TYPE } from './step_attribute_map'
import StepCommentParser from './step_comment_parser'
import { stepExtractString } from './step_deserialization_functions'
import StepEntityIdentifierParser from './step_entity_identifier_parser'
import StepEnumParser from './step_enum_parser'
import StepStringParser from './step_string_parser'
import StepVtableBuilder, { IndexMark } from './step_vtable_builder'

export interface StepIndexEntryBase<TypeIDType> {

  address: number
  length: number
  typeID?: TypeIDType
  expressID?: number
  multiMapping?: StepIndexEntryBase<TypeIDType>[]

  inlineEntities?: StepInlineIndexEntry<TypeIDType>[]
}

export interface StepInlineIndexEntry<TypeIDType> extends StepIndexEntryBase<TypeIDType> {

  expressID?: undefined
}

export interface StepIndexEntry<TypeIDType> extends StepIndexEntryBase<TypeIDType> {

  expressID: number
}

export interface StepIndex<TypeIDType> {

  elements: StepIndexEntry<TypeIDType>[]

}

export interface Argument {
  type: number
  value: any
}

// https://github.com/stepcode/stepcode/blob/develop/src/cleditor/STEPfile.cc (REFERENCE)

/**
 *
 */
 
// -- eslint doesn't understand enums properly.
export enum ParseResult {

  COMPLETE = 0,
  INCOMPLETE = 1,
  SYNTAX_ERROR = 2,
  MISSING_TYPE = 3,
  INVALID_STEP = 4,
}
 

const BYTE_ORDER_MARK = encodeToken(decodeURIComponent('%EF%BB%BF'))
const ISO_10303_21 = encodeToken('ISO-10303-21')
const HEADER = encodeToken('HEADER')
const DATA = encodeToken('DATA')
const END_SECTION = encodeToken('ENDSEC')
const INF = encodeToken( 'INF' )
const HASH = ParsingConstants.HASH
const EQUALS = ParsingConstants.EQUALS
const COMMA = ParsingConstants.COMMA
const OPEN_PAREN = ParsingConstants.OPEN_PAREN
const CLOSE_PAREN = ParsingConstants.CLOSE_PAREN
const SEMICOLON = ParsingConstants.SEMICOLON
const WHITESPACE = ParsingConstants.WHITE_SPACE_SET
const QUOTE = ParsingConstants.QUOTE

const enumParser = StepEnumParser.Instance.match
const identifierParser = StepEntityIdentifierParser.Instance.match
const binaryParser = HexParser.Instance.step
const attributeMap = StepAttributeMap.Instance.get
const commentParser = StepCommentParser.Instance.match
const stringParser = StepStringParser.Instance.match

export type BlockParseResult<TypeIDType> = [StepIndex<TypeIDType>, ParseResult]
export type LineArgumentParseResult<TypeIDType> = [StepIndex<TypeIDType>, ParseResult]

export interface StepHeader {
  headers: Map<string, string>
}

export type HeaderParseResult = [StepHeader, ParseResult]

const textDecoder = new TextDecoder()

/**
 * Parser base for header parsing.
 */
export class StepHeaderParser {

  private static instance_?: StepHeaderParser

  /**
   * Get the singleton static instance of this.
   *
   * @return {StepHeaderParser} The singleton instance of this.
   */
  public static get instance(): StepHeaderParser {

    if ( this.instance_ === void 0 ) {

      this.instance_ = new StepHeaderParser()
    }

    return this.instance_
  }

  /**
   * Will parse the input up to data block (including the DATA token).
   *
   * @param input The input buffer to parse the header from.
   * @return {HeaderParseResult} The parse result for the header, plus the header values.
   */
  public parseHeader(input: ParsingBuffer): HeaderParseResult {
    const match = input.match
    const comment = () => match(commentParser)
    const whitespace = () => {
      do {
        input.whitespace()
      } while (comment())
    }
    const char = input.char
    const charws = (encoded: EncodedAsciiCharacter) => {
      whitespace(); return char(encoded)
    }
    const token = input.token
    const tokenws = (encoded: EncodedToken) => {
      whitespace(); return token(encoded)
    }

    const stringMatch = () => match(stringParser)
    const binaryHex = () => match(binaryParser)
    const real = input.real
    const unsigned = input.unsigned
    const unsignedws = () => {
      whitespace(); return unsigned()
    }
    const enumeration = () => match(enumParser)
    const identifier = () => match(identifierParser)

    const headers: StepHeader = { headers: new Map<string, string>() }

    const parseResult = (value: ParseResult): HeaderParseResult => [headers, value]
    const syntaxError = (): HeaderParseResult => [headers, ParseResult.SYNTAX_ERROR]

    token( BYTE_ORDER_MARK )

    if (!tokenws(ISO_10303_21)) {
      return parseResult(ParseResult.INVALID_STEP)
    }

    if (!charws(SEMICOLON)) {
      return parseResult(ParseResult.SYNTAX_ERROR)
    }

    if (!tokenws(HEADER)) {
      return parseResult(ParseResult.INVALID_STEP)
    }

    if (!charws(SEMICOLON)) {
      return parseResult(ParseResult.SYNTAX_ERROR)
    }

    while (input.unfinished && !tokenws(END_SECTION)) {
      const startIdentifier = input.cursor

      whitespace()

      if (!identifier()) {
        return syntaxError()
      }

      const headerID = textDecoder.decode(input.buffer.subarray(startIdentifier, input.cursor))

      let firstAttribute = true

      whitespace()

      const startBlock = input.cursor

      if (!char(OPEN_PAREN)) {
        return syntaxError()
      }

      let stackDepth = 1

      while (stackDepth > 0) {
        if (charws(CLOSE_PAREN)) {
          firstAttribute = false
          --stackDepth
          continue
        }

        if (!firstAttribute) {
          if (!char(COMMA)) {
            return syntaxError()
          }
        }

        firstAttribute = false

        whitespace()

        const nextChar = input.peek()

        if (nextChar === (void 0)) {
          return syntaxError()
        }

        switch (attributeMap(nextChar)) {
          case ATTRIBUTE_PARSE_TYPE.INVALID:

            return syntaxError()

          case ATTRIBUTE_PARSE_TYPE.NUMBER:

            if (!real()) {
              return syntaxError()
            }
            break

          case ATTRIBUTE_PARSE_TYPE.ENUM:

            if (!enumeration()) {
              return syntaxError()
            }
            break

          case ATTRIBUTE_PARSE_TYPE.STRING:

            if (!stringMatch()) {
              return syntaxError()
            }
            break

          case ATTRIBUTE_PARSE_TYPE.REFERENCE:

            input.step()

            if (!unsignedws()) {
              return syntaxError()
            }
            break

          case ATTRIBUTE_PARSE_TYPE.CONTAINER:

            firstAttribute = true
            input.step()
            ++stackDepth
            break

          case ATTRIBUTE_PARSE_TYPE.HEXBITS:

            if (!binaryHex()) {
              return syntaxError()
            }
            break

          case ATTRIBUTE_PARSE_TYPE.NULL:

            input.step()
            break

          case ATTRIBUTE_PARSE_TYPE.DERIVED:

            input.step()
            break

          default:

        }
      }

      whitespace()

      const headerBlock = textDecoder.decode(input.buffer.subarray(startBlock, input.cursor))

      headers.headers.set(headerID, headerBlock)

      if (!charws(SEMICOLON)) {
        return syntaxError()
      }
    }

    if (!charws(SEMICOLON)) {
      return syntaxError()
    }

    if (!tokenws(DATA)) {
      return syntaxError()
    }

    if (!charws(SEMICOLON)) {
      return syntaxError()
    }

    return parseResult(ParseResult.COMPLETE)
  }

}
/**
 * Parses out STEP files to allow indexing and deserialization.
 */
export default class StepParser<TypeIDType> extends StepHeaderParser {

  /**
   * Construct this with the type-index that will be used to map element types
   * to tokens.
   *
   * @param index_ The index.
   */
  constructor(private readonly index_: Readonly<TypeIndex<TypeIDType>>) {
    super()
  }


  /**
   * This uses a much lighter non correctness verifying parse to extract the locations of
   * the fields for an entry, using the v-table builder to
   * append the top level entries.
   *
   * In this case, the cursor should represent the start of the
   *
   * @param input
   * @param cursor
   * @param endCursor
   * @param vtableBuilder
   * @return {[IndexMark, number] | undefined} The vtable slice or undefined if it's not
   * defined due to an error.
   */
  public extractDataEntry(
      input: Uint8Array,
      cursor: number,
      endCursor: number,
      vtableBuilder: StepVtableBuilder): [IndexMark, number, number] | undefined {
    let stackDepth = 1

    while (cursor < endCursor && stackDepth > 0) {
      // skip whitespace.
      while (cursor < endCursor && WHITESPACE.has(input[cursor])) {
        ++cursor
      }

      if (cursor === endCursor) {
        if (stackDepth === 1) {
          return vtableBuilder.complete( cursor )
        } else {
          return
        }
      }

      if (stackDepth === 1) {
        vtableBuilder.push(cursor)
      }

      // Eat characters until we get to a comma or close paren.
      while (cursor < endCursor) {
        const readChar = input[cursor]

        // String is a special case because it might contain control characters,
        // we will run the string parsing DFA to skip over it.
        if (readChar === QUOTE) {
          const parsedStringOffset = stringParser(input, cursor, endCursor)

          // Couldn't parse a string, something's wrong.
          if (parsedStringOffset === void 0) {
            return
          }

          cursor = parsedStringOffset
          continue
        }

        ++cursor

        // Comma starts a new param entry
        if (readChar === COMMA) {
          break
        } else if (readChar === SEMICOLON) {
          return vtableBuilder.complete( cursor - 1 )

          // Will effectively terminate if this is the end of the entity,
          // or simply end the inline entity/container case otherwise.
        } else if (readChar === CLOSE_PAREN) {
          --stackDepth

          // Handles inline entity case and container cases.
        } else if (readChar === OPEN_PAREN) {
          ++stackDepth
          break
        }
      }
    }

    return vtableBuilder.complete( cursor )
  }

  /**
   * Parse the data block of a step file, indexing it.,
   *
   * @param input The input parsing buffer, in the data section.
   * @return {BlockParseResult} The parsing result, including the index and result enum.
   */
  public parseDataBlock(input: ParsingBuffer): BlockParseResult<TypeIDType> {

    const indexResult: StepIndex<TypeIDType> = { elements: [] }

    const match = input.match
    const comment = () => match(commentParser)
    const whitespace = () => {
      do {
        input.whitespace()
      } while (comment())
    }
    const char = input.char
    const charws = (encoded: EncodedAsciiCharacter) => {
      whitespace(); return char(encoded)
    }
    const token = input.token
    const tokenws = (encoded: EncodedToken) => {
      whitespace(); return token(encoded)
    }

    const stringMatch = () => match(stringParser)
    const whileNotCommaBracket = () => input.whileNot( ParsingConstants.COMMA_END_SET )
    const readUnsigned = input.readUnsigned
    const readUnsignedws = () => {
      whitespace(); return readUnsigned()
    }
    const identifier = () => match(identifierParser)
    const parseResult = (value: ParseResult): BlockParseResult<TypeIDType> => {
      /* console.trace();*/ return [indexResult, value]
    }
    const syntaxError = (): BlockParseResult<TypeIDType> => {
      /* console.trace();*/ return [indexResult, ParseResult.SYNTAX_ERROR]
    }

    let inlineElements: StepInlineIndexEntry<TypeIDType>[] | undefined
    let multiElements: StepIndexEntry<TypeIDType>[] | undefined

    const parseInlineElement = ( expressID?: number ): BlockParseResult<TypeIDType> | undefined => {

      whitespace()

      const startIdentifier = input.cursor

      if (!identifier()) {
        return syntaxError()
      }

      const foundItem = this.index_.get(input.buffer, startIdentifier, input.cursor)

      let firstAttribute = true

      if (!charws(OPEN_PAREN)) {
        return syntaxError()
      }

      whitespace()

      const startElement = input.cursor
      let stackDepth = 1

      const savedInlineElements = inlineElements

      inlineElements = void 0

      while (stackDepth > 0) {
        if (charws(CLOSE_PAREN)) {
          firstAttribute = false
          --stackDepth
          continue
        }

        if (!firstAttribute) {
          if (!char(COMMA)) {
            return syntaxError()
          }
        }

        firstAttribute = false

        whitespace()

        const nextChar = input.peek()

        if (nextChar === (void 0)) {
          return syntaxError()
        }

        switch (attributeMap(nextChar)) {
          case ATTRIBUTE_PARSE_TYPE.INVALID:

            return syntaxError()

          case ATTRIBUTE_PARSE_TYPE.INLINE_INSTANCE: {

            // The semi-colon above is needed for an unambiguous
            // typescript parse.

            input.begin()
            const elementResult = parseInlineElement()

            if (elementResult !== (void 0)) {

              input.rollback()

              if ( tokenws( INF ) ) {
                break
              }

              return elementResult
            }

            input.commit()
            break
          }

          case ATTRIBUTE_PARSE_TYPE.NUMBER:
            whileNotCommaBracket()
            break

          case ATTRIBUTE_PARSE_TYPE.ENUM:
            whileNotCommaBracket()
            break

          case ATTRIBUTE_PARSE_TYPE.STRING:

            if (!stringMatch()) {
              return syntaxError()
            }
            break

          case ATTRIBUTE_PARSE_TYPE.REFERENCE:

            whileNotCommaBracket()
            break

          case ATTRIBUTE_PARSE_TYPE.CONTAINER:

            firstAttribute = true
            input.step()
            ++stackDepth
            break

          case ATTRIBUTE_PARSE_TYPE.HEXBITS:

            whileNotCommaBracket()
            break

          case ATTRIBUTE_PARSE_TYPE.NULL:

            input.step()
            break

          case ATTRIBUTE_PARSE_TYPE.DERIVED:

            input.step()
            break

          default:

        }
      }

      const nestedInlineElements = inlineElements

      inlineElements = savedInlineElements

      if ( expressID === void 0 ) {
        inlineElements ??= []

        inlineElements.push(
            {
              address: startElement,
              length: input.address - startElement,
              typeID: foundItem,
              inlineEntities: nestedInlineElements,
            })
      } else {

        multiElements ??= []
                
        multiElements.push(
            {
              address: startElement,
              length: input.address - startElement,
              typeID: foundItem,
              inlineEntities: nestedInlineElements,
              expressID: expressID,
            })
      }
    }

    while (input.unfinished) {

      if (!charws(HASH)) {
        if (tokenws(END_SECTION)) {
          return parseResult(ParseResult.COMPLETE)

        } else {
          return parseResult(ParseResult.INCOMPLETE)
        }
      }

      // TODO! work out range check - CS
      const expressID = readUnsignedws()

      if (expressID === undefined) {
        return syntaxError()
      }

      if (!charws(EQUALS)) {
        return syntaxError()
      }

      whitespace()

      const startIdentifier = input.cursor

      if (!identifier()) {

        if ( !char( OPEN_PAREN ) ) {
          return syntaxError()
        }

        whitespace()

        inlineElements = void 0

        const startElement = input.cursor

        // todo, loop and read inline then add them to a special "External Mapping" node.
        while ( !charws( CLOSE_PAREN ) ) {

          input.begin()

          const elementResult = parseInlineElement( expressID )

          if (elementResult !== (void 0)) {

            input.rollback()

            return elementResult
          }

          input.commit()
        }

        if (!charws(SEMICOLON)) {
          return syntaxError()
        }

        indexResult.elements.push(
            {
              address: startElement,
              length: input.address - startElement,
              typeID: 0 as TypeIDType, // external mapping special case.
              expressID: expressID,
              inlineEntities: inlineElements,
              multiMapping: multiElements
            })

        multiElements = void 0
        continue
      }

      const foundItem = this.index_.get(input.buffer, startIdentifier, input.cursor)

      let firstAttribute = true

      if (!charws(OPEN_PAREN)) {
        return syntaxError()
      }

      whitespace()

      const startElement = input.cursor
      let stackDepth = 1

      inlineElements = void 0

      while (stackDepth > 0) {
        if (charws(CLOSE_PAREN)) {
          firstAttribute = false
          --stackDepth
          continue
        }

        if (!firstAttribute) {
          if (!char(COMMA)) {
            return syntaxError()
          }
        }

        firstAttribute = false

        whitespace()

        const nextChar = input.peek()

        if (nextChar === (void 0)) {
          return syntaxError()
        }

        switch (attributeMap(nextChar)) {
          case ATTRIBUTE_PARSE_TYPE.INVALID:

            return syntaxError()

          case ATTRIBUTE_PARSE_TYPE.INLINE_INSTANCE: {

            input.begin()
            const elementResult = parseInlineElement()

            if (elementResult !== (void 0)) {

              for ( const element of elementResult[0].elements ) {
              
                element.expressID = expressID
              }

              input.rollback()

              if ( tokenws( INF ) ) {
                break
              }

              return elementResult
            }

            input.commit()
            break
          }

          case ATTRIBUTE_PARSE_TYPE.NUMBER:

            whileNotCommaBracket()

            break

          case ATTRIBUTE_PARSE_TYPE.ENUM:

            whileNotCommaBracket()
            break

          case ATTRIBUTE_PARSE_TYPE.STRING:

            if (!stringMatch()) {
              return syntaxError()
            }
            break

          case ATTRIBUTE_PARSE_TYPE.REFERENCE:


            whileNotCommaBracket()
            break

          case ATTRIBUTE_PARSE_TYPE.CONTAINER:

            firstAttribute = true
            input.step()
            ++stackDepth
            break

          case ATTRIBUTE_PARSE_TYPE.HEXBITS:

            whileNotCommaBracket()
            break

          case ATTRIBUTE_PARSE_TYPE.NULL:

            input.step()
            break

          case ATTRIBUTE_PARSE_TYPE.DERIVED:

            input.step()
            break

          default:

        }
      }

      if (!charws(SEMICOLON)) {
        return syntaxError()
      }

      indexResult.elements.push(
          {
            address: startElement,
            length: input.address - startElement,
            typeID: foundItem,
            expressID: expressID,
            inlineEntities: inlineElements,
          })
    }

    // Got here without finding an end of the section.
    return parseResult(ParseResult.INCOMPLETE)
  }

  /**
   * Parse arguments from a single line from a step file, indexing it.,
   *
   * @param input The input parsing buffer, in the data section.
   * @param expressID
   * @return {LineArgumentParseResult} The parsing result, including the
   * arguments array and result enum.
   */
  public extractArguments(input: ParsingBuffer, expressID: number): [any, ParseResult] {

    const indexResult: any[] = []

    const match = input.match
    const comment = () => match(commentParser)
    const whitespace = () => {
      do {
        input.whitespace()
      } while (comment())
    }
    const char = input.char
    const charws = (encoded: EncodedAsciiCharacter) => {
      whitespace(); return char(encoded)
    }

    const stringMatch = () => match(stringParser)
    const binaryHex = () => match(binaryParser)
    const enumeration = () => match(enumParser)
    const identifier = () => match(identifierParser)
    const parseResult = (value: ParseResult): [Argument[], ParseResult] => {
      /* console.trace();*/ return [indexResult, value]
    }
    const syntaxError = (): [Argument[], ParseResult] => {
      /* console.trace();*/ return [indexResult, ParseResult.SYNTAX_ERROR]
    }

    const parseInlineElement = (): [Argument[], ParseResult] | undefined => {

      // const inlineIndexResult: any[] = []
      const inlineContainerStack: any[][] = []

      whitespace()

      if (!identifier()) {
        return syntaxError()
      }

      let firstAttribute = true

      if (!charws(OPEN_PAREN)) {
        return syntaxError()
      }

      whitespace()

      let stackDepth = 1

      let arg_: Argument

      while (stackDepth > 0) {
        if (charws(CLOSE_PAREN)) {
          firstAttribute = false
          --stackDepth
          continue
        }

        if (!firstAttribute) {
          if (!char(COMMA)) {
            return syntaxError()
          }
        }

        firstAttribute = false

        whitespace()

        const nextChar = input.peek()

        if (nextChar === (void 0)) {
          return syntaxError()
        }

        /* eslint-disable no-case-declarations */
        switch (attributeMap(nextChar)) {
          case ATTRIBUTE_PARSE_TYPE.INVALID:

            return syntaxError()

          case ATTRIBUTE_PARSE_TYPE.INLINE_INSTANCE: {

            const elementResult = parseInlineElement()

            if (elementResult !== (void 0)) {
              //     indexResult.push(elementResult[0])
            }
            break
          }

          case ATTRIBUTE_PARSE_TYPE.NUMBER:

            const extractReal = input.readReal()
            if (extractReal !== void 0) {
              arg_ = {
                type: 4,
                value: extractReal,
              }

              if (inlineContainerStack.length > 0) {
                inlineContainerStack[inlineContainerStack.length - 1].push(arg_)
              } else {
                indexResult.push(arg_)
              }
            } else {
              return syntaxError()
            }

            break

          case ATTRIBUTE_PARSE_TYPE.ENUM:

            const startEnum_ = input.cursor

            if (!enumeration()) {
              return syntaxError()
            }

            // do not include the trailing period delimiter
            const subArray = input.buffer.subarray(startEnum_ + 1, input.cursor - 1)
            const enumString = new TextDecoder().decode(subArray)

            arg_ = {
              type: 3,
              value: enumString,
            }

            if (inlineContainerStack.length > 0) {
              inlineContainerStack[inlineContainerStack.length - 1].push(arg_)
            } else {
              indexResult.push(arg_)
            }

            break

          case ATTRIBUTE_PARSE_TYPE.STRING:

            const startString_ = input.cursor

            if (!stringMatch()) {
              return syntaxError()
            }

            const extractString = stepExtractString(input.buffer, startString_, input.cursor)

            if (extractString === void 0) {
              return syntaxError()
            }

            arg_ = {
              type: 1,
              value: extractString,
            }

            if (inlineContainerStack.length > 0) {
              inlineContainerStack[inlineContainerStack.length - 1].push(arg_)
            } else {
              indexResult.push(arg_)
            }
            break


          case ATTRIBUTE_PARSE_TYPE.REFERENCE:

            input.step()

            const expressID_ = input.readUnsigned()

            if (expressID_ !== void 0) {
              arg_ = {
                type: 5,
                value: expressID_,
              }

              if (inlineContainerStack.length > 0) {
                inlineContainerStack[inlineContainerStack.length - 1].push(arg_)
              } else {
                indexResult.push(arg_)
              }

            } else {
              return syntaxError()
            }
            break

          case ATTRIBUTE_PARSE_TYPE.CONTAINER:

            firstAttribute = true
            input.step()
            ++stackDepth

            // Start a new container: push a new empty array onto the stack.
            containerStack.push([])
            break

          case ATTRIBUTE_PARSE_TYPE.HEXBITS:

            if (!binaryHex()) {
              return syntaxError()
            }
            break

          case ATTRIBUTE_PARSE_TYPE.NULL:
            if (inlineContainerStack.length > 0) {
              inlineContainerStack[inlineContainerStack.length - 1].push(null)
            } else {
              indexResult.push(null)
            }

            input.step()
            break

          case ATTRIBUTE_PARSE_TYPE.DERIVED:

            input.step()
            break

          default:
        }
        /* eslint-enable no-case-declarations */
      }

      return [indexResult, ParseResult.COMPLETE]

    }


    whitespace()

    let firstAttribute = true

    // const startElement = input.cursor
    let stackDepth = 1
    const containerStack: any[][] = []

    while (stackDepth > 0) {
      if (charws(CLOSE_PAREN)) {
        firstAttribute = false
        --stackDepth
        if (containerStack.length > 0) {
          indexResult.push(containerStack.pop())
        }
        continue
      }

      if (!firstAttribute) {
        if (!char(COMMA)) {
          return syntaxError()
        }
      }

      firstAttribute = false

      whitespace()

      const nextChar = input.peek()

      if (nextChar === (void 0)) {
        return syntaxError()
      }


      let arg: Argument
      /* eslint-disable no-case-declarations */
      switch (attributeMap(nextChar)) {
        case ATTRIBUTE_PARSE_TYPE.INVALID:

          return syntaxError()

        case ATTRIBUTE_PARSE_TYPE.INLINE_INSTANCE: {

          const elementResult = parseInlineElement()

          if (elementResult !== (void 0)) {
            // indexResult.push(elementResult[0])
          }
          break
        }

        case ATTRIBUTE_PARSE_TYPE.NUMBER:

          const extractReal = input.readReal()
          if (extractReal !== void 0) {
            arg = {
              type: 4,
              value: extractReal,
            }

            if (containerStack.length > 0) {
              containerStack[containerStack.length - 1].push(arg)
            } else {
              indexResult.push(arg)
            }
          } else {
            return syntaxError()
          }

          break

        case ATTRIBUTE_PARSE_TYPE.ENUM:

          const startEnum_ = input.cursor

          if (!enumeration()) {
            return syntaxError()
          }

          // do not include the trailing period delimiter
          const subArray = input.buffer.subarray(startEnum_ + 1, input.cursor - 1)
          const enumString = new TextDecoder().decode(subArray)

          arg = {
            type: 3,
            value: enumString,
          }

          if (containerStack.length > 0) {
            containerStack[containerStack.length - 1].push(arg)
          } else {
            indexResult.push(arg)
          }

          break

        case ATTRIBUTE_PARSE_TYPE.STRING:

          const startString_ = input.cursor

          if (!stringMatch()) {
            return syntaxError()
          }

          const extractString = stepExtractString(input.buffer, startString_, input.cursor)

          if (extractString === void 0) {
            return syntaxError()
          }

          arg = {
            type: 1,
            value: extractString,
          }

          if (containerStack.length > 0) {
            containerStack[containerStack.length - 1].push(arg)
          } else {
            indexResult.push(arg)
          }
          break


        case ATTRIBUTE_PARSE_TYPE.REFERENCE:

          input.step()

          const expressID_ = input.readUnsigned()

          if (expressID_ !== void 0) {
            arg = {
              type: 5,
              value: expressID_,
            }

            if (containerStack.length > 0) {
              containerStack[containerStack.length - 1].push(arg)
            } else {
              indexResult.push(arg)
            }

          } else {
            return syntaxError()
          }
          break

        case ATTRIBUTE_PARSE_TYPE.CONTAINER:

          firstAttribute = true
          input.step()
          ++stackDepth

          // Start a new container: push a new empty array onto the stack.
          containerStack.push([])
          break

        case ATTRIBUTE_PARSE_TYPE.HEXBITS:

          if (!binaryHex()) {
            return syntaxError()
          }
          break

        case ATTRIBUTE_PARSE_TYPE.NULL:
          if (containerStack.length > 0) {
            containerStack[containerStack.length - 1].push(null)
          } else {
            indexResult.push(null)
          }

          input.step()
          break

        case ATTRIBUTE_PARSE_TYPE.DERIVED:

          input.step()
          break

        default:
      }
      /* eslint-enable no-case-declarations */
    }

    if (!charws(SEMICOLON)) {
      return syntaxError()
    }

    return parseResult(ParseResult.COMPLETE)
  }

}
