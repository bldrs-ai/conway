
import { pair_value } from "./index"
import { rack_and_pinion_pair } from "./index"
import { length_measure } from "./index"
import { plane_angle_measure } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class rack_and_pinion_pair_value extends pair_value {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.RACK_AND_PINION_PAIR_VALUE
  }
  private actual_displacement_? : number


  public get actual_displacement() : number {
    if ( this.actual_displacement_ === void 0 ) {
      this.actual_displacement_ = this.extractNumber( 2, false )
    }

    return this.actual_displacement_ as number
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.RACK_AND_PINION_PAIR_VALUE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.RACK_AND_PINION_PAIR_VALUE
}
