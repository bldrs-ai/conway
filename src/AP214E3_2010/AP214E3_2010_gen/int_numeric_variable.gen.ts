
import { numeric_variable } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/int_numeric_variable.htm */
export  class int_numeric_variable extends numeric_variable {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.INT_NUMERIC_VARIABLE
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.INT_NUMERIC_VARIABLE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.INT_NUMERIC_VARIABLE
}