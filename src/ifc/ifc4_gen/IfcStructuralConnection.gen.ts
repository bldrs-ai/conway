
import { IfcStructuralItem } from "./index"
import { IfcBoundaryCondition } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcstructuralconnection.htm */
export abstract class IfcStructuralConnection extends IfcStructuralItem {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSTRUCTURALCONNECTION
  }
  private AppliedCondition_? : IfcBoundaryCondition | null

  public get AppliedCondition() : IfcBoundaryCondition | null {
    if ( this.AppliedCondition_ === void 0 ) {
      this.AppliedCondition_ = this.extractElement( 7, 7, 5, true, IfcBoundaryCondition )
    }

    return this.AppliedCondition_ as IfcBoundaryCondition | null
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSTRUCTURALCURVECONNECTION, EntityTypesIfc.IFCSTRUCTURALPOINTCONNECTION, EntityTypesIfc.IFCSTRUCTURALSURFACECONNECTION ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSTRUCTURALCONNECTION
}
