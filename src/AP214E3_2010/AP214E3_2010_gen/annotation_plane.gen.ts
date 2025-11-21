
import { annotation_occurrence } from "./index"
import { dimension_count } from "./index"
import { draughting_callout } from "./index"
import { styled_item } from "./index"
import { plane } from "./index"
import { planar_box } from "./index"
import {
  stepExtractOptional,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
} from '../../step/parsing/step_deserialization_functions'
import {
  dimension_of,
} from '../ap214_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class annotation_plane extends annotation_occurrence {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.ANNOTATION_PLANE
  }
  private elements_? : Array<draughting_callout | styled_item> | null

  public get dim() : number {
    return dimension_of(this);
  }

  public get elements() : Array<draughting_callout | styled_item> | null {
    if ( this.elements_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 3, 3, 3 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return null
      }

      const value : Array<draughting_callout | styled_item> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesAP214 > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof draughting_callout ) && !( value1Untyped instanceof styled_item ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (draughting_callout | styled_item)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.elements_ = value
    }

    return this.elements_ as Array<draughting_callout | styled_item> | null
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === annotation_plane.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for annotation_plane" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.ANNOTATION_PLANE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.ANNOTATION_PLANE
}
