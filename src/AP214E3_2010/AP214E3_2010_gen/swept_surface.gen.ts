
import { surface } from "./index"
import { curve } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class swept_surface extends surface {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.SWEPT_SURFACE
  }
  private swept_curve_? : curve

  public get swept_curve() : curve {
    if ( this.swept_curve_ === void 0 ) {
      this.swept_curve_ = this.extractElement( 1, false, curve )
    }

    return this.swept_curve_ as curve
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.SWEPT_SURFACE, EntityTypesAP214.SURFACE_OF_LINEAR_EXTRUSION, EntityTypesAP214.SURFACE_OF_REVOLUTION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.SWEPT_SURFACE
}
