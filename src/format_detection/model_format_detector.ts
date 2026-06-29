
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

      const schema = stepHeader.headers.get( 'FILE_SCHEMA' )?.toLocaleUpperCase()

      if ( schema !== void 0 ) {

        const quotedEntries = Array.from( schema.matchAll( /'([^']+)'/g ) ).map( (match) => match[1] )
        const schemaEntries = quotedEntries.length > 0 ? quotedEntries : [schema]

        for ( const rawEntry of schemaEntries ) {
          const entryNoSpaces = rawEntry.replaceAll( ' ', '' )

          if ( entryNoSpaces.startsWith( 'IFC' ) ) {
            return ModelFormatType.IFC
          }

          if ( entryNoSpaces.startsWith( 'AUTOMOTIVE_DESIGN' ) ) {
            return ModelFormatType.AP214
          }

          if ( entryNoSpaces.startsWith( 'CONFIG_CONTROL_DESIGN' ) ) {
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

