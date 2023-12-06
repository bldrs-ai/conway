
import { shape_representation } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/faceted_brep_shape_representation.htm */
export  class faceted_brep_shape_representation extends shape_representation {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.FACETED_BREP_SHAPE_REPRESENTATION
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.FACETED_BREP_SHAPE_REPRESENTATION ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.FACETED_BREP_SHAPE_REPRESENTATION
}