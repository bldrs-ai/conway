
import { IfcRelAssigns } from "./index"
import { IfcGroup } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrelassignstogroup.htm */
export  class IfcRelAssignsToGroup extends IfcRelAssigns {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRELASSIGNSTOGROUP
  }
  private RelatingGroup_? : IfcGroup

  public get RelatingGroup() : IfcGroup {
    if ( this.RelatingGroup_ === void 0 ) {
      this.RelatingGroup_ = this.extractElement( 6, 6, 3, false, IfcGroup )
    }

    return this.RelatingGroup_ as IfcGroup
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELASSIGNSTOGROUP, EntityTypesIfc.IFCRELASSIGNSTOGROUPBYFACTOR ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELASSIGNSTOGROUP
}
