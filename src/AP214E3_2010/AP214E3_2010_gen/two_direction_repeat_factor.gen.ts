
import { one_direction_repeat_factor } from "./index"
import { vector } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class two_direction_repeat_factor extends one_direction_repeat_factor {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.TWO_DIRECTION_REPEAT_FACTOR
  }
  private second_repeat_factor_? : vector

  public get second_repeat_factor() : vector {
    if ( this.second_repeat_factor_ === void 0 ) {
      this.second_repeat_factor_ = this.extractElement( 2, 2, 3, false, vector )
    }

    return this.second_repeat_factor_ as vector
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === two_direction_repeat_factor.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for two_direction_repeat_factor" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.TWO_DIRECTION_REPEAT_FACTOR ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.TWO_DIRECTION_REPEAT_FACTOR
}
