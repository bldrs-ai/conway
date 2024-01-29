
import { swept_surface } from "./index"
import { vector } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class surface_of_linear_extrusion extends swept_surface {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.SURFACE_OF_LINEAR_EXTRUSION
  }
  private extrusion_axis_? : vector

  public get extrusion_axis() : vector {
    if ( this.extrusion_axis_ === void 0 ) {
      this.extrusion_axis_ = this.extractElement( 2, false, vector )
    }

    return this.extrusion_axis_ as vector
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.SURFACE_OF_LINEAR_EXTRUSION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.SURFACE_OF_LINEAR_EXTRUSION
}
