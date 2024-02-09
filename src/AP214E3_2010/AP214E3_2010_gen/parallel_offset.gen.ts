
import { derived_shape_aspect } from "./index"
import { measure_with_unit } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class parallel_offset extends derived_shape_aspect {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.PARALLEL_OFFSET
  }
  private offset_? : measure_with_unit

  public get offset() : measure_with_unit {
    if ( this.offset_ === void 0 ) {
      this.offset_ = this.extractElement( 4, false, measure_with_unit )
    }

    return this.offset_ as measure_with_unit
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.PARALLEL_OFFSET ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.PARALLEL_OFFSET
}
