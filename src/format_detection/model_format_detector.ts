
/**
 * The type of the detected model, or no format if one is not found.
 */

import ParsingBuffer from '../parsing/parsing_buffer'
import { ParseResult, StepHeaderParser } from '../step/parsing/step_parser'

 
export enum ModelFormatType {
   
  IFC = 0,
   
  AP214 = 1,
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


    console.log( ParseResult[errorCode] )

    if ( errorCode === ParseResult.COMPLETE || errorCode === ParseResult.INCOMPLETE ) {

      const schema = stepHeader.headers.get( 'FILE_SCHEMA' )?.toLocaleUpperCase()

      if ( schema !== void 0 ) {

        const schemaNoSpaces = schema.replaceAll( ' ', '' )

        if ( schemaNoSpaces.startsWith( '((\'IFC' ) ) {
          return ModelFormatType.IFC
        }

        
        if ( schemaNoSpaces.startsWith( '((\'AUTOMOTIVE_DESIGN\'))' ) ) {
        
          return ModelFormatType.AP214
        }

        if ( schemaNoSpaces.startsWith( '((\'AUTOMOTIVE_DESIGN{') ) {

          const afterBrace = schema.substring( schema.indexOf( '{' ) + 1 ).trimStart()

          if ( afterBrace.startsWith( '1 0 10303 214' ) ) {
            return ModelFormatType.AP214
          }
        }
      }
    }

    return (void 0)
  }
}

