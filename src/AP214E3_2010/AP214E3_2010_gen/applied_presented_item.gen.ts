
import { presented_item } from "./index"
import { action } from "./index"
import { action_method } from "./index"
import { action_relationship } from "./index"
import { product_concept } from "./index"
import { product_concept_feature } from "./index"
import { product_concept_feature_category } from "./index"
import { product_definition } from "./index"
import { product_definition_formation } from "./index"
import { product_definition_relationship } from "./index"
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
export  class applied_presented_item extends presented_item {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.APPLIED_PRESENTED_ITEM
  }
  private items_? : Array<action | action_method | action_relationship | product_concept | product_concept_feature | product_concept_feature_category | product_definition | product_definition_formation | product_definition_relationship>

  public get items() : Array<action | action_method | action_relationship | product_concept | product_concept_feature | product_concept_feature_category | product_definition | product_definition_formation | product_definition_relationship> {
    if ( this.items_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 0, 0, 1 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<action | action_method | action_relationship | product_concept | product_concept_feature | product_concept_feature_category | product_definition | product_definition_formation | product_definition_relationship> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesAP214 > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof action ) && !( value1Untyped instanceof action_method ) && !( value1Untyped instanceof action_relationship ) && !( value1Untyped instanceof product_concept ) && !( value1Untyped instanceof product_concept_feature ) && !( value1Untyped instanceof product_concept_feature_category ) && !( value1Untyped instanceof product_definition ) && !( value1Untyped instanceof product_definition_formation ) && !( value1Untyped instanceof product_definition_relationship ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (action | action_method | action_relationship | product_concept | product_concept_feature | product_concept_feature_category | product_definition | product_definition_formation | product_definition_relationship)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.items_ = value
    }

    return this.items_ as Array<action | action_method | action_relationship | product_concept | product_concept_feature | product_concept_feature_category | product_definition | product_definition_formation | product_definition_relationship>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === applied_presented_item.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for applied_presented_item" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.APPLIED_PRESENTED_ITEM ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.APPLIED_PRESENTED_ITEM
}
