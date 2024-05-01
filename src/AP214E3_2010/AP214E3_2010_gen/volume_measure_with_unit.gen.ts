
import { measure_with_unit } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class volume_measure_with_unit extends measure_with_unit {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.VOLUME_MEASURE_WITH_UNIT
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.VOLUME_MEASURE_WITH_UNIT ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.VOLUME_MEASURE_WITH_UNIT
}