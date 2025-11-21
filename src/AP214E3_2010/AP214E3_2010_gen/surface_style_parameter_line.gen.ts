
import { founded_item } from "./index"
import { curve_style } from "./index"
import { curve_style_rendering } from "./index"
import { u_direction_count } from "./index"
import { v_direction_count } from "./index"
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
export  class surface_style_parameter_line extends founded_item {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.SURFACE_STYLE_PARAMETER_LINE
  }
  private style_of_parameter_lines_? : curve_style | curve_style_rendering
  private direction_counts_? : Array<u_direction_count | v_direction_count>

  public get style_of_parameter_lines() : curve_style | curve_style_rendering {
    if ( this.style_of_parameter_lines_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 0, 0, 1, false )

      if ( !( value instanceof curve_style ) && !( value instanceof curve_style_rendering ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.style_of_parameter_lines_ = value as (curve_style | curve_style_rendering)

    }

    return this.style_of_parameter_lines_ as curve_style | curve_style_rendering
  }

  public get direction_counts() : Array<u_direction_count | v_direction_count> {
    if ( this.direction_counts_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 1, 0, 1 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<u_direction_count | v_direction_count> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesAP214 > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof u_direction_count ) && !( value1Untyped instanceof v_direction_count ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (u_direction_count | v_direction_count)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.direction_counts_ = value
    }

    return this.direction_counts_ as Array<u_direction_count | v_direction_count>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === surface_style_parameter_line.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for surface_style_parameter_line" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.SURFACE_STYLE_PARAMETER_LINE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.SURFACE_STYLE_PARAMETER_LINE
}
