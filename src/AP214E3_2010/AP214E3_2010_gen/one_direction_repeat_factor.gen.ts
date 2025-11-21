
import { geometric_representation_item } from "./index"
import { vector } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class one_direction_repeat_factor extends geometric_representation_item {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.ONE_DIRECTION_REPEAT_FACTOR
  }
  private repeat_factor_? : vector

  public get repeat_factor() : vector {
    if ( this.repeat_factor_ === void 0 ) {
      this.repeat_factor_ = this.extractElement( 1, 1, 2, false, vector )
    }

    return this.repeat_factor_ as vector
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === one_direction_repeat_factor.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for one_direction_repeat_factor" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.ONE_DIRECTION_REPEAT_FACTOR ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.ONE_DIRECTION_REPEAT_FACTOR
}
