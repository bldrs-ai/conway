
import { founded_item } from "./index"
import { label } from "./index"
import { curve_style_font_pattern } from "./index"
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
export  class curve_style_font extends founded_item {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.CURVE_STYLE_FONT
  }
  private name_? : string
  private pattern_list_? : Array<curve_style_font_pattern>

  public get name() : string {
    if ( this.name_ === void 0 ) {
      this.name_ = this.extractString( 0, 0, 1, false )
    }

    return this.name_ as string
  }

  public get pattern_list() : Array<curve_style_font_pattern> {
    if ( this.pattern_list_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 1, 0, 1 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<curve_style_font_pattern> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, curve_style_font_pattern )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.pattern_list_ = value
    }

    return this.pattern_list_ as Array<curve_style_font_pattern>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === curve_style_font.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for curve_style_font" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.CURVE_STYLE_FONT ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.CURVE_STYLE_FONT
}
