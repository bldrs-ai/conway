
import { IfcCartesianTransformationOperator } from "./index"
import { IfcDirection } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccartesiantransformationoperator2d.htm */
export  class IfcCartesianTransformationOperator2D extends IfcCartesianTransformationOperator {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCARTESIANTRANSFORMATIONOPERATOR2D
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCARTESIANTRANSFORMATIONOPERATOR2D, EntityTypesIfc.IFCCARTESIANTRANSFORMATIONOPERATOR2DNONUNIFORM ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCARTESIANTRANSFORMATIONOPERATOR2D
}
