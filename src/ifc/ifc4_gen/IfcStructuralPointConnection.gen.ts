
import { IfcStructuralConnection } from "./index"
import { IfcAxis2Placement3D } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcstructuralpointconnection.htm */
export  class IfcStructuralPointConnection extends IfcStructuralConnection {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSTRUCTURALPOINTCONNECTION
  }
  private ConditionCoordinateSystem_? : IfcAxis2Placement3D | null

  public get ConditionCoordinateSystem() : IfcAxis2Placement3D | null {
    if ( this.ConditionCoordinateSystem_ === void 0 ) {
      this.ConditionCoordinateSystem_ = this.extractElement( 8, 8, 6, true, IfcAxis2Placement3D )
    }

    return this.ConditionCoordinateSystem_ as IfcAxis2Placement3D | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSTRUCTURALPOINTCONNECTION ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSTRUCTURALPOINTCONNECTION
}
