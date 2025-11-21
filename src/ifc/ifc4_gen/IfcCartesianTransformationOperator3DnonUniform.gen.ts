
import { IfcCartesianTransformationOperator3D } from "./index"
import { IfcReal } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccartesiantransformationoperator3dnonuniform.htm */
export  class IfcCartesianTransformationOperator3DnonUniform extends IfcCartesianTransformationOperator3D {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCARTESIANTRANSFORMATIONOPERATOR3DNONUNIFORM
  }
  private Scale2_? : number | null
  private Scale3_? : number | null

  public get Scale2() : number | null {
    if ( this.Scale2_ === void 0 ) {
      this.Scale2_ = this.extractNumber( 5, 5, 4, true )
    }

    return this.Scale2_ as number | null
  }

  public get Scale3() : number | null {
    if ( this.Scale3_ === void 0 ) {
      this.Scale3_ = this.extractNumber( 6, 5, 4, true )
    }

    return this.Scale3_ as number | null
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCARTESIANTRANSFORMATIONOPERATOR3DNONUNIFORM ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCARTESIANTRANSFORMATIONOPERATOR3DNONUNIFORM
}
