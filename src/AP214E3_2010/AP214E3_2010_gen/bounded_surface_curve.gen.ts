
import { surface_curve } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/bounded_surface_curve.htm */
export  class bounded_surface_curve extends surface_curve {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.BOUNDED_SURFACE_CURVE
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.BOUNDED_SURFACE_CURVE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.BOUNDED_SURFACE_CURVE
}