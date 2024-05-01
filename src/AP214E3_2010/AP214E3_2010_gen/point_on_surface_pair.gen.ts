
import { kinematic_pair } from "./index"
import { surface } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class point_on_surface_pair extends kinematic_pair {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.POINT_ON_SURFACE_PAIR
  }
  private pair_surface_? : surface

  public get pair_surface() : surface {
    if ( this.pair_surface_ === void 0 ) {
      this.pair_surface_ = this.extractElement( 5, false, surface )
    }

    return this.pair_surface_ as surface
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.POINT_ON_SURFACE_PAIR ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.POINT_ON_SURFACE_PAIR
}