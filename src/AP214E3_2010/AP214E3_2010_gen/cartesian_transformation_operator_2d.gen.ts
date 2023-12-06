
import { cartesian_transformation_operator } from "./index"
import { direction } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/cartesian_transformation_operator_2d.htm */
export  class cartesian_transformation_operator_2d extends cartesian_transformation_operator {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.CARTESIAN_TRANSFORMATION_OPERATOR_2D
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.CARTESIAN_TRANSFORMATION_OPERATOR_2D ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.CARTESIAN_TRANSFORMATION_OPERATOR_2D
}