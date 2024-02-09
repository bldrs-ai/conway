
import { assembly_component_usage } from "./index"
import { measure_with_unit } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class quantified_assembly_component_usage extends assembly_component_usage {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.QUANTIFIED_ASSEMBLY_COMPONENT_USAGE
  }
  private quantity_? : measure_with_unit

  public get quantity() : measure_with_unit {
    if ( this.quantity_ === void 0 ) {
      this.quantity_ = this.extractElement( 6, false, measure_with_unit )
    }

    return this.quantity_ as measure_with_unit
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.QUANTIFIED_ASSEMBLY_COMPONENT_USAGE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.QUANTIFIED_ASSEMBLY_COMPONENT_USAGE
}
