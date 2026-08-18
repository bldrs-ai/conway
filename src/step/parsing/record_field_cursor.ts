import StepVtableBuilder from './step_vtable_builder'
import StepParser from './step_parser'
import { stepExtractString } from './step_deserialization_functions'


/** ASCII '#', which introduces an express reference. */
const HASH = 0x23

/** ASCII '0' and '9', bounding the digits of a reference. */
const DIGIT_0 = 0x30
const DIGIT_9 = 0x39

/** Everything at or below this code point is STEP whitespace. */
const LAST_WHITESPACE = 0x20

/** Base of the decimal express IDs. */
const DECIMAL = 10


/**
 * Reads individual attributes out of a record's raw bytes, without a model and
 * without materialising an entity (M2, issue #393).
 *
 * This is what makes a parse-path consumer viable at all: the streaming
 * parse's record event hands over the record's attribute list as a window
 * range, and a consumer that wants two strings out of it should not have to
 * wait for the model, page the record back in, and construct an entity to get
 * them. Field positions come from the production tokenizer
 * ({@link StepParser.extractDataEntry}), so a record this reads and a record
 * the model reads agree by construction — including on the awkward cases
 * (quoted commas, nested parens, escaped quotes) a hand-rolled splitter gets
 * wrong.
 *
 * One instance is reused across records: {@link open} clears and refills a
 * single vtable buffer, so a consumer running over millions of records
 * allocates nothing per record. Attribute indices are the same ones the
 * generated accessors use (`extractString( 2, … )` for `IfcRoot.Name`, and so
 * on), read against the *record's own* attribute list — inherited attributes
 * included, since STEP serialises the flattened list.
 */
export class RecordFieldCursor<TypeIDType> {

  private readonly vtable_ = new StepVtableBuilder()

  private buffer_: Uint8Array | undefined = void 0

  private indexMark_ = 0

  private fieldCount_ = 0

  private endCursor_ = 0

  /**
   * @param parser_ The schema's parser — used only for its record tokenizer.
   */
  constructor( private readonly parser_: StepParser<TypeIDType> ) {}

  /**
   * Point this at one record's attribute list.
   *
   * @param buffer The buffer holding the record (the live parse window, for an
   * event consumer — so everything read here must be read before returning).
   * @param byteOffset Offset of the record's first attribute byte.
   * @param byteLength Length of the attribute list in bytes.
   * @return {number} The number of top-level attributes found; 0 if the record
   * could not be tokenized (a truncated or malformed record — the caller
   * should skip it rather than guess).
   */
  public open( buffer: Uint8Array, byteOffset: number, byteLength: number ): number {
    this.vtable_.clear()

    const end = byteOffset + byteLength
    const extracted =
      this.parser_.extractDataEntry( buffer, byteOffset, end, this.vtable_ )

    if ( extracted === void 0 ) {
      this.buffer_ = void 0
      this.fieldCount_ = 0

      return 0
    }

    this.buffer_ = buffer
    this.indexMark_ = extracted[ 0 ]
    this.fieldCount_ = extracted[ 1 ]
    this.endCursor_ = extracted[ 2 ]

    return this.fieldCount_
  }

  /**
   * The byte range of one attribute, as `[start, end)`.
   *
   * @param index The attribute index.
   * @return {[number, number] | undefined} The range, or undefined when the
   * record has no such attribute.
   */
  private range( index: number ): [ number, number ] | undefined {
    if ( this.buffer_ === void 0 || index < 0 || index >= this.fieldCount_ ) {
      return void 0
    }

    const table = this.vtable_.buffer
    const start = table[ this.indexMark_ + index ]

    // Each entry marks an attribute's first byte, so an attribute runs to the
    // next entry's separator; the last runs to the record's end cursor.
    const end = index + 1 < this.fieldCount_ ?
      table[ this.indexMark_ + index + 1 ] - 1 :
      this.endCursor_

    return [ start, end ]
  }

  /**
   * Read a string attribute.
   *
   * @param index The attribute index.
   * @return {string | undefined} The decoded string, or undefined when the
   * attribute is absent, `$`, or not a string.
   */
  public string( index: number ): string | undefined {
    const range = this.range( index )

    if ( range === void 0 ) {
      return void 0
    }

    return stepExtractString( this.buffer_!, range[ 0 ], range[ 1 ] )
  }

  /**
   * Read a single express reference attribute (`#123`).
   *
   * @param index The attribute index.
   * @return {number | undefined} The express ID, or undefined when the
   * attribute is absent or is not a reference.
   */
  public reference( index: number ): number | undefined {
    const range = this.range( index )

    if ( range === void 0 ) {
      return void 0
    }

    const buffer = this.buffer_!

    let cursor = range[ 0 ]

    while ( cursor < range[ 1 ] && buffer[ cursor ] !== HASH ) {
      // Only whitespace may precede the '#'; anything else means this
      // attribute is not a reference (`$`, an inline value, a typed value).
      if ( buffer[ cursor ] > LAST_WHITESPACE ) {
        return void 0
      }

      ++cursor
    }

    return this.readReferenceAt( cursor, range[ 1 ] )
  }

  /**
   * Visit every express reference in an attribute, which is how a reference
   * list (`(#1,#2,#3)`) is read — the enclosing parens and separators need no
   * interpretation, since a reference is the only thing a `#` can start.
   *
   * @param index The attribute index.
   * @param visit Called with each express ID, in order.
   */
  public forEachReference( index: number, visit: ( expressID: number ) => void ): void {
    const range = this.range( index )

    if ( range === void 0 ) {
      return
    }

    const buffer = this.buffer_!
    const end = range[ 1 ]

    for ( let cursor = range[ 0 ]; cursor < end; ++cursor ) {
      if ( buffer[ cursor ] !== HASH ) {
        continue
      }

      const expressID = this.readReferenceAt( cursor, end )

      if ( expressID === void 0 ) {
        continue
      }

      visit( expressID )

      // Skip the digits just consumed; the loop's ++ steps off the last one.
      while ( cursor + 1 < end && this.isDigit( buffer[ cursor + 1 ] ) ) {
        ++cursor
      }
    }
  }

  /**
   * Read the digits of a reference whose `#` sits at `cursor`.
   *
   * @param cursor Offset of the `#`.
   * @param end Exclusive end of the attribute.
   * @return {number | undefined} The express ID, or undefined if `cursor` is
   * not a `#` followed by at least one digit.
   */
  private readReferenceAt( cursor: number, end: number ): number | undefined {
    const buffer = this.buffer_!

    if ( cursor >= end || buffer[ cursor ] !== HASH ) {
      return void 0
    }

    let at = cursor + 1
    let value = 0
    let digits = 0

    while ( at < end && this.isDigit( buffer[ at ] ) ) {
      value = value * DECIMAL + ( buffer[ at ] - DIGIT_0 )
      ++at
      ++digits
    }

    return digits === 0 ? void 0 : value
  }

  /**
   * @param code A byte.
   * @return {boolean} Whether it is an ASCII digit.
   */
  private isDigit( code: number ): boolean {
    return code >= DIGIT_0 && code <= DIGIT_9
  }
}
