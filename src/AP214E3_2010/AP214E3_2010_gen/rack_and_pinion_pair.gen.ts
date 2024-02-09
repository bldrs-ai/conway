
import { kinematic_pair } from "./index"
import { length_measure } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class rack_and_pinion_pair extends kinematic_pair {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.RACK_AND_PINION_PAIR
  }
  private pinion_radius_? : number

  public get pinion_radius() : number {
    if ( this.pinion_radius_ === void 0 ) {
      this.pinion_radius_ = this.extractNumber( 5, false )
    }

    return this.pinion_radius_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.RACK_AND_PINION_PAIR ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.RACK_AND_PINION_PAIR
}
