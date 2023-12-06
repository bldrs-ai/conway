
import { shape_representation } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/geometrically_bounded_2d_wireframe_representation.htm */
export  class geometrically_bounded_2d_wireframe_representation extends shape_representation {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.GEOMETRICALLY_BOUNDED_2D_WIREFRAME_REPRESENTATION
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.GEOMETRICALLY_BOUNDED_2D_WIREFRAME_REPRESENTATION ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.GEOMETRICALLY_BOUNDED_2D_WIREFRAME_REPRESENTATION
}