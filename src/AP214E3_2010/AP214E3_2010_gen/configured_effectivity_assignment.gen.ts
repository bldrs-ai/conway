
import { effectivity_assignment } from "./index"
import { action_relationship } from "./index"
import { process_plan } from "./index"
import { product_definition } from "./index"
import { product_process_plan } from "./index"
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
export  class configured_effectivity_assignment extends effectivity_assignment {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.CONFIGURED_EFFECTIVITY_ASSIGNMENT
  }
  private items_? : Array<action_relationship | process_plan | product_definition | product_process_plan>

  public get items() : Array<action_relationship | process_plan | product_definition | product_process_plan> {
    if ( this.items_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 1, 1, 1 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<action_relationship | process_plan | product_definition | product_process_plan> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesAP214 > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof action_relationship ) && !( value1Untyped instanceof process_plan ) && !( value1Untyped instanceof product_definition ) && !( value1Untyped instanceof product_process_plan ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (action_relationship | process_plan | product_definition | product_process_plan)
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

    return this.items_ as Array<action_relationship | process_plan | product_definition | product_process_plan>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === configured_effectivity_assignment.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for configured_effectivity_assignment" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.CONFIGURED_EFFECTIVITY_ASSIGNMENT ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.CONFIGURED_EFFECTIVITY_ASSIGNMENT
}
