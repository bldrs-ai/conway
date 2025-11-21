
import { over_riding_styled_item } from "./index"
import { group } from "./index"
import { presentation_layer_assignment } from "./index"
import { presentation_set } from "./index"
import { representation } from "./index"
import { representation_item } from "./index"
import { shape_representation_relationship } from "./index"
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
export  class context_dependent_over_riding_styled_item extends over_riding_styled_item {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.CONTEXT_DEPENDENT_OVER_RIDING_STYLED_ITEM
  }
  private style_context_? : Array<group | presentation_layer_assignment | presentation_set | representation | representation_item | shape_representation_relationship>

  public get style_context() : Array<group | presentation_layer_assignment | presentation_set | representation | representation_item | shape_representation_relationship> {
    if ( this.style_context_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 4, 4, 3 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<group | presentation_layer_assignment | presentation_set | representation | representation_item | shape_representation_relationship> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesAP214 > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof group ) && !( value1Untyped instanceof presentation_layer_assignment ) && !( value1Untyped instanceof presentation_set ) && !( value1Untyped instanceof representation ) && !( value1Untyped instanceof representation_item ) && !( value1Untyped instanceof shape_representation_relationship ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (group | presentation_layer_assignment | presentation_set | representation | representation_item | shape_representation_relationship)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.style_context_ = value
    }

    return this.style_context_ as Array<group | presentation_layer_assignment | presentation_set | representation | representation_item | shape_representation_relationship>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === context_dependent_over_riding_styled_item.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for context_dependent_over_riding_styled_item" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.CONTEXT_DEPENDENT_OVER_RIDING_STYLED_ITEM ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.CONTEXT_DEPENDENT_OVER_RIDING_STYLED_ITEM
}
