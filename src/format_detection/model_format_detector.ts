
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

