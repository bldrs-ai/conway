
/**
 * The type of the detected model, or no format if one is not found.
 */

import ParsingBuffer from '../parsing/parsing_buffer'
import { ParseResult, StepHeaderParser } from '../step/parsing/step_parser'

 
export enum ModelFormatType {
   
  IFC = 0,
   
  AP214 = 1,

  AP203 = 2,

  AP242 = 3,
}

/**
 * Split a raw `FILE_SCHEMA` header value into its individual (uppercased)
 * identifiers. A header can carry more than one quoted entry, e.g.
 * `FILE_SCHEMA(('IFC4','IFC4X3_ADD2'))` — codex review of bldrs-ai/conway#713
 * (P2) flagged that IFC4X3 schema routing (ifc_schema_selection.ts) must
 * inspect this same complete list rather than re-parsing the header a
 * second time, or a mixed header silently loses everything after the first
 * entry. Exported so ifc_schema_selection.ts can reuse it instead of
 * writing a third parse of the same header.
 *
 * @param schemaRaw The raw FILE_SCHEMA header value, as
 * `stepHeader.headers.get('FILE_SCHEMA')` returns it (undefined if absent).
 * @return {string[]} Each quoted identifier, uppercased; a single-entry
 * array of the whole (uppercased) value if no quoted entries were found;
 * or an empty array when `schemaRaw` is undefined.
 */
export function extractFileSchemaEntries( schemaRaw: string | undefined ): string[] {

  if ( schemaRaw === void 0 ) {

    return []
  }

  const schema = schemaRaw.toLocaleUpperCase()
  const quotedEntries = Array.from( schema.matchAll( /'([^']+)'/g ) ).map( (match) => match[1] )

  return quotedEntries.length > 0 ? quotedEntries : [schema]
}

// How far into the input describeUnrecognizedModel looks for a first
// non-whitespace byte. A real file's first token sits well inside this.
const DESCRIBE_SCAN_BYTES = 4096
// Cap on how much of an unrecognised FILE_SCHEMA value is echoed back, since
// it is file content and lands in logs and statistics.
const DESCRIBE_SCHEMA_CHARS = 64

/**
 * Say, in a short phrase, why {@link ModelFormatDetector.detect} returned
 * undefined for these bytes.
 *
 * Before conway#741 every one of these cases reached the embedder as the
 * same bare `-1` from OpenModel*, with "No type detected when constructing
 * model" in the log, so a renamed `.ifczip`, a UTF-16 re-save, a header
 * with one unescaped apostrophe and a file conway does not know the schema
 * of could not be told apart in production. Each branch below is a byte
 * shape that detect() was observed to reject; none of them changes what
 * detect() accepts.
 *
 * The phrase names the shape, never the file's text, except a capped
 * FILE_SCHEMA value (a schema identifier, which the embedder already shows).
 *
 * @param data The model bytes (or a prefix of them) detect() rejected.
 * @return {string} A short reason, e.g. "zip archive, not STEP text".
 */
export function describeUnrecognizedModel( data: Uint8Array ): string {

  /* eslint-disable no-magic-numbers */ // byte signatures
  if ( data.length === 0 ) {
    return 'empty file'
  }

  if ( data.length >= 4 &&
       data[0] === 0x50 && data[1] === 0x4b && data[2] === 0x03 && data[3] === 0x04 ) {
    return 'zip archive (such as .ifczip), not STEP text'
  }

  if ( data.length >= 2 && data[0] === 0x1f && data[1] === 0x8b ) {
    return 'gzip-compressed, not STEP text'
  }

  // A UTF-16 BOM, or an ASCII first character followed by a NUL byte (a
  // BOM-less UTF-16LE save). ISO 10303-21 text is 8-bit.
  if ( data.length >= 2 &&
       ( ( data[0] === 0xff && data[1] === 0xfe ) ||
         ( data[0] === 0xfe && data[1] === 0xff ) ||
         ( data[0] !== 0 && data[1] === 0 ) ) ) {
    return 'UTF-16 text; STEP files must be 8-bit text'
  }
  /* eslint-enable no-magic-numbers */

  let first = -1

  for ( let where = 0; where < Math.min( data.length, DESCRIBE_SCAN_BYTES ); ++where ) {

    const byte = data[where]

    // space, tab, CR, LF
    // eslint-disable-next-line no-magic-numbers
    if ( byte !== 0x20 && byte !== 0x09 && byte !== 0x0d && byte !== 0x0a ) {
      first = byte
      break
    }
  }

  if ( first === -1 ) {
    return 'empty file'
  }

  // '<': ifcXML, or an HTML error page saved under a model's name.
  // eslint-disable-next-line no-magic-numbers
  if ( first === 0x3c ) {
    return 'XML or HTML, not STEP text'
  }

  const input = new ParsingBuffer( data )
  const [stepHeader, result] = StepHeaderParser.instance.parseHeader( input )
  const schemaEntries =
    extractFileSchemaEntries( stepHeader.headers.get( 'FILE_SCHEMA' ) )
  const schemaText = schemaEntries.join( ',' ).slice( 0, DESCRIBE_SCHEMA_CHARS )

  switch ( result ) {

    case ParseResult.INVALID_STEP:

      return 'no ISO-10303-21 header'

    case ParseResult.SYNTAX_ERROR:

      return schemaEntries.length > 0 ?
        `STEP header syntax error at byte ${input.cursor} (FILE_SCHEMA ${schemaText})` :
        `STEP header syntax error at byte ${input.cursor}`

    case ParseResult.COMPLETE:
    case ParseResult.INCOMPLETE:

      return schemaEntries.length > 0 ?
        `unrecognized FILE_SCHEMA ${schemaText}` :
        'no FILE_SCHEMA in header'

    default:

      return `STEP header parse result ${ParseResult[result]}`
  }
}

/**
 * Format detector for finding the format of a model from a buffer in conway.
 */
export default class ModelFormatDetector {

  /**
   * Detect the model format
   *
   * @param input
   * @return {ModelFormatType | undefined} The type of the model, or undefined
   * if none can be found.
   */
  public static detect( input: ParsingBuffer ): ModelFormatType | undefined {

    const [stepHeader, errorCode] = StepHeaderParser.instance.parseHeader( input )

    if ( errorCode === ParseResult.COMPLETE || errorCode === ParseResult.INCOMPLETE ) {

      const schema = stepHeader.headers.get( 'FILE_SCHEMA' )

      if ( schema !== void 0 ) {

        const schemaEntries = extractFileSchemaEntries( schema )

        for ( const rawEntry of schemaEntries ) {
          const entryNoSpaces = rawEntry.replaceAll( ' ', '' )

          if ( entryNoSpaces.startsWith( 'IFC' ) ) {
            return ModelFormatType.IFC
          }

          if ( entryNoSpaces.startsWith( 'AUTOMOTIVE_DESIGN' ) ) {
            return ModelFormatType.AP214
          }

          // AP203 ships under two schema names: the legacy CONFIG_CONTROL_DESIGN
          // and the explicit AP203_CONFIGURATION_CONTROLLED_3D_DESIGN_*_MIM_LF
          // form the NIST "AP203 geometry only" exports use. Match both.
          if ( entryNoSpaces.startsWith( 'CONFIG_CONTROL_DESIGN' ) ||
               entryNoSpaces.startsWith( 'AP203' ) ) {
            return ModelFormatType.AP203
          }

          // AP242 (ISO 10303-242, e.g. AP242_MANAGED_MODEL_BASED_3D_ENGINEERING_*)
          // is detected so it can be routed; for the metadata-1.0 interim it
          // reuses the AP214 engine (their MIM product-structure/property
          // entities overlap). Full AP242-only entity support is a follow-up —
          // see design/new/step-metadata-nist.md §"The AP242 wrinkle" and
          // step-support.md Phase 5.
          if ( entryNoSpaces.startsWith( 'AP242' ) ) {
            return ModelFormatType.AP242
          }
        }
      }
    }

    return (void 0)
  }
}

