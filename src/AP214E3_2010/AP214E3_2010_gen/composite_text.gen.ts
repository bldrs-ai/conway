
import { geometric_representation_item } from "./index"
import { annotation_text } from "./index"
import { annotation_text_character } from "./index"
import { defined_character_glyph } from "./index"
import { text_literal } from "./index"
import {
  stepExtractOptional,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class composite_text extends geometric_representation_item {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.COMPOSITE_TEXT
  }
  private collected_text_? : Array<annotation_text | annotation_text_character | defined_character_glyph | composite_text | text_literal>

  public get collected_text() : Array<annotation_text | annotation_text_character | defined_character_glyph | composite_text | text_literal> {
    if ( this.collected_text_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 1, 1, 2 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<annotation_text | annotation_text_character | defined_character_glyph | composite_text | text_literal> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesAP214 > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof annotation_text ) && !( value1Untyped instanceof annotation_text_character ) && !( value1Untyped instanceof defined_character_glyph ) && !( value1Untyped instanceof composite_text ) && !( value1Untyped instanceof text_literal ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (annotation_text | annotation_text_character | defined_character_glyph | composite_text | text_literal)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.collected_text_ = value
    }

    return this.collected_text_ as Array<annotation_text | annotation_text_character | defined_character_glyph | composite_text | text_literal>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === composite_text.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for composite_text" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.COMPOSITE_TEXT ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.COMPOSITE_TEXT
}
