
import { b_spline_surface } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/uniform_surface.htm */
export  class uniform_surface extends b_spline_surface {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.UNIFORM_SURFACE
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.UNIFORM_SURFACE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.UNIFORM_SURFACE
}