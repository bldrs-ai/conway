
import { geometric_tolerance_with_datum_reference } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class circular_runout_tolerance extends geometric_tolerance_with_datum_reference {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.CIRCULAR_RUNOUT_TOLERANCE
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.CIRCULAR_RUNOUT_TOLERANCE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.CIRCULAR_RUNOUT_TOLERANCE
}
