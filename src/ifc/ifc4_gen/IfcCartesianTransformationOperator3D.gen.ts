
import { IfcCartesianTransformationOperator } from "./index"
import { IfcDirection } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccartesiantransformationoperator3d.htm */
export  class IfcCartesianTransformationOperator3D extends IfcCartesianTransformationOperator {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCARTESIANTRANSFORMATIONOPERATOR3D
  }
  private Axis3_? : IfcDirection | null

  public get Axis3() : IfcDirection | null {
    if ( this.Axis3_ === void 0 ) {
      this.Axis3_ = this.extractElement( 4, 4, 3, true, IfcDirection )
    }

    return this.Axis3_ as IfcDirection | null
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCARTESIANTRANSFORMATIONOPERATOR3D, EntityTypesIfc.IFCCARTESIANTRANSFORMATIONOPERATOR3DNONUNIFORM ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCARTESIANTRANSFORMATIONOPERATOR3D
}
