
import { founded_item } from "./index"
import { pre_defined_presentation_style } from "./index"
import { point_style } from "./index"
import { curve_style } from "./index"
import { surface_style_usage } from "./index"
import { symbol_style } from "./index"
import { fill_area_style } from "./index"
import { text_style } from "./index"
import { approximation_tolerance } from "./index"
import { externally_defined_style } from "./index"
import { null_style, null_styleDeserializeStep } from "./index"
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
export  class presentation_style_assignment extends founded_item {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.PRESENTATION_STYLE_ASSIGNMENT
  }
  private styles_? : Array<pre_defined_presentation_style | point_style | curve_style | surface_style_usage | symbol_style | fill_area_style | text_style | approximation_tolerance | externally_defined_style | null_style>

  public get styles() : Array<pre_defined_presentation_style | point_style | curve_style | surface_style_usage | symbol_style | fill_area_style | text_style | approximation_tolerance | externally_defined_style | null_style> {
    if ( this.styles_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 0, 0, 1 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<pre_defined_presentation_style | point_style | curve_style | surface_style_usage | symbol_style | fill_area_style | text_style | approximation_tolerance | externally_defined_style | null_style> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesAP214 > | null_style | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor ) ?? null_styleDeserializeStep( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof pre_defined_presentation_style ) && !( value1Untyped instanceof point_style ) && !( value1Untyped instanceof curve_style ) && !( value1Untyped instanceof surface_style_usage ) && !( value1Untyped instanceof symbol_style ) && !( value1Untyped instanceof fill_area_style ) && !( value1Untyped instanceof text_style ) && !( value1Untyped instanceof approximation_tolerance ) && !( value1Untyped instanceof externally_defined_style ) && value1Untyped !== null_style.NULL ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (pre_defined_presentation_style | point_style | curve_style | surface_style_usage | symbol_style | fill_area_style | text_style | approximation_tolerance | externally_defined_style | null_style)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.styles_ = value
    }

    return this.styles_ as Array<pre_defined_presentation_style | point_style | curve_style | surface_style_usage | symbol_style | fill_area_style | text_style | approximation_tolerance | externally_defined_style | null_style>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === presentation_style_assignment.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for presentation_style_assignment" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.PRESENTATION_STYLE_ASSIGNMENT ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.PRESENTATION_STYLE_ASSIGNMENT
}
