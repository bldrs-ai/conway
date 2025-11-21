
import { IfcCartesianTransformationOperator2D } from "./index"
import { IfcReal } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccartesiantransformationoperator2dnonuniform.htm */
export  class IfcCartesianTransformationOperator2DnonUniform extends IfcCartesianTransformationOperator2D {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCARTESIANTRANSFORMATIONOPERATOR2DNONUNIFORM
  }
  private Scale2_? : number | null

  public get Scale2() : number | null {
    if ( this.Scale2_ === void 0 ) {
      this.Scale2_ = this.extractNumber( 4, 4, 4, true )
    }

    return this.Scale2_ as number | null
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCARTESIANTRANSFORMATIONOPERATOR2DNONUNIFORM ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCARTESIANTRANSFORMATIONOPERATOR2DNONUNIFORM
}
