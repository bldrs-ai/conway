
import { IfcRelAssociates } from "./index"
import { IfcApproval } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrelassociatesapproval.htm */
export  class IfcRelAssociatesApproval extends IfcRelAssociates {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRELASSOCIATESAPPROVAL
  }
  private RelatingApproval_? : IfcApproval

  public get RelatingApproval() : IfcApproval {
    if ( this.RelatingApproval_ === void 0 ) {
      this.RelatingApproval_ = this.extractElement( 5, 5, 3, false, IfcApproval )
    }

    return this.RelatingApproval_ as IfcApproval
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELASSOCIATESAPPROVAL ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELASSOCIATESAPPROVAL
}
