import {
  skipValue,
  stepExtractArrayBegin,
  stepExtractArrayToken,
  stepExtractNumber,
  stepExtractOptional,
} from './step_deserialization_functions'
import ParsingConstants from '../../parsing/parsing_constants'


const OPEN_PAREN  = ParsingConstants.OPEN_PAREN
const CLOSE_PAREN = ParsingConstants.CLOSE_PAREN
const COMMA       = ParsingConstants.COMMA
const ZERO        = ParsingConstants.ZERO
const WHITESPACE  = ParsingConstants.WHITE_SPACE_SET

/**
 * Growable Uint32Array append sink.
 *
 * Exists so hot extraction loops can parse integer list fields straight
 * out of the STEP buffer into one reusable typed array, instead of
 * allocating (and caching) a boxed `Array< number >` per record. On
 * tessellated IFC4 models that difference is structural: a large
 * polygonal-faceset model carries millions of IfcIndexedPolygonalFace
 * records, and a per-record array for each is the dominant source of
 * both GC time and retained heap during geometry extraction.
 */
export class Uint32Sink {

  private data_: Uint32Array
  private length_: number = 0

  /**
   * @param initialCapacity Initial element capacity.
   */
  constructor( initialCapacity: number = 1024 ) {
    this.data_ = new Uint32Array( Math.max( 1, initialCapacity ) )
  }

  /** @return {number} Element count appended since the last reset. */
  public get length(): number {
    return this.length_
  }

  /**
   * A view of exactly the appended elements. Only valid until the next
   * append (which may reallocate) — copy it if it must outlive that.
   *
   * @return {Uint32Array} View over [0, length).
   */
  public get view(): Uint32Array {
    return this.data_.subarray( 0, this.length_ )
  }

  /** Drop all appended elements, keeping the allocated capacity. */
  public reset(): void {
    this.length_ = 0
  }

  /**
   * Keep the first `length` elements. Used to unwind a failed fast path.
   *
   * @param length New length, ≤ current length.
   */
  public truncate( length: number ): void {
    this.length_ = length
  }

  /**
   * Append one value, growing geometrically when full.
   *
   * @param value The value to append.
   */
  public push( value: number ): void {

    if ( this.length_ === this.data_.length ) {

      const grown = new Uint32Array( this.data_.length * 2 )

      grown.set( this.data_ )

      this.data_ = grown
    }

    this.data_[ this.length_++ ] = value
  }
}


/**
 * Parse a STEP integer list at `cursor` into `sink`, appending in order.
 *
 * The single implementation shared by the entity-level and
 * reference-level fast paths, so they cannot drift from each other or
 * from the generated array getters they stand in for (same optional
 * handling, same element extraction, same "incorrectly typed" error).
 *
 * @param buffer The record's buffer window.
 * @param cursor Start of the field.
 * @param endCursor End bound for extraction.
 * @param sink Receives the appended values.
 * @return {number} How many values were appended (0 when unset/optional-null).
 */
export function extractIntegerArrayAt(
    buffer: Uint8Array,
    cursor: number,
    endCursor: number,
    sink: Uint32Sink ): number {

  const marked = sink.length
  const fast   = extractUnsignedIntegerListAt( buffer, cursor, endCursor, sink )

  if ( fast !== void 0 ) {
    return fast
  }

  sink.truncate( marked )

  if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
    return 0
  }

  let count         = 0
  let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
  let readCursor    = Math.abs( signedCursor0 )

  while ( signedCursor0 >= 0 ) {

    const value = stepExtractNumber( buffer, readCursor, endCursor )

    if ( value === void 0 ) {
      throw new Error( 'Value in STEP was incorrectly typed' )
    }

    readCursor = skipValue( buffer, readCursor, endCursor )

    sink.push( value )
    ++count

    signedCursor0 = stepExtractArrayToken( buffer, readCursor, endCursor )
    readCursor    = Math.abs( signedCursor0 )
  }

  return count
}


/**
 * Fast path for `(1,2,3,4)` / `(1, 2, 3, 4)` — the CoordIndex shape.
 * Digits only, no comments, no reals. Returns undefined when the field
 * is not that shape so the caller can use the general parser.
 *
 * @param buffer Record window.
 * @param cursor Start of the field.
 * @param endCursor End bound.
 * @param sink Receives values.
 * @return {number | undefined} Count appended, or undefined if this
 * is not an unsigned-integer list.
 */
export function extractUnsignedIntegerListAt(
    buffer: Uint8Array,
    cursor: number,
    endCursor: number,
    sink: Uint32Sink ): number | undefined {

  while ( cursor < endCursor && WHITESPACE.has( buffer[ cursor ] ) ) {
    ++cursor
  }

  if ( cursor >= endCursor ) {
    return void 0
  }

  if ( buffer[ cursor ] === ParsingConstants.DOLLAR ) {
    return 0
  }

  if ( buffer[ cursor ] !== OPEN_PAREN ) {
    return void 0
  }

  ++cursor

  let count = 0

  while ( cursor < endCursor ) {

    while ( cursor < endCursor && WHITESPACE.has( buffer[ cursor ] ) ) {
      ++cursor
    }

    if ( cursor >= endCursor ) {
      return void 0
    }

    if ( buffer[ cursor ] === CLOSE_PAREN ) {
      return count
    }

    if ( count > 0 ) {

      if ( buffer[ cursor ] !== COMMA ) {
        return void 0
      }

      ++cursor

      while ( cursor < endCursor && WHITESPACE.has( buffer[ cursor ] ) ) {
        ++cursor
      }

      if ( cursor >= endCursor ) {
        return void 0
      }
    }

    const digit = buffer[ cursor ] - ZERO

    if ( digit < 0 || digit > 9 ) {
      return void 0
    }

    let value = digit
    ++cursor

    while ( cursor < endCursor ) {

      const next = buffer[ cursor ] - ZERO

      if ( next < 0 || next > 9 ) {
        break
      }

      value = value * 10 + next
      ++cursor
    }

    sink.push( value )
    ++count
  }

  return void 0
}
