
import { IfcStructuralConnection } from "./index"
import { IfcDirection } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcstructuralcurveconnection.htm */
export  class IfcStructuralCurveConnection extends IfcStructuralConnection {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSTRUCTURALCURVECONNECTION
  }
  private Axis_? : IfcDirection

  public get Axis() : IfcDirection {
    if ( this.Axis_ === void 0 ) {
      this.Axis_ = this.extractElement( 8, 8, 6, false, IfcDirection )
    }

    return this.Axis_ as IfcDirection
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSTRUCTURALCURVECONNECTION ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSTRUCTURALCURVECONNECTION
}
