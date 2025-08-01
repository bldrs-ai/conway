
import { geometric_tolerance } from "./index"
import { limit_condition, limit_conditionDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class modified_geometric_tolerance extends geometric_tolerance {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.MODIFIED_GEOMETRIC_TOLERANCE
  }
  private modifier_? : limit_condition

  public get modifier() : limit_condition {
    if ( this.modifier_ === void 0 ) {
      this.modifier_ = this.extractLambda( 4, 4, 1, limit_conditionDeserializeStep, false )
    }

    return this.modifier_ as limit_condition
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === modified_geometric_tolerance.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for modified_geometric_tolerance" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.MODIFIED_GEOMETRIC_TOLERANCE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.MODIFIED_GEOMETRIC_TOLERANCE
}
