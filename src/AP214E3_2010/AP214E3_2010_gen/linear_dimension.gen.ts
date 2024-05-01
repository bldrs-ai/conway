
import { dimension_curve_directed_callout } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class linear_dimension extends dimension_curve_directed_callout {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.LINEAR_DIMENSION
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.LINEAR_DIMENSION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.LINEAR_DIMENSION
}