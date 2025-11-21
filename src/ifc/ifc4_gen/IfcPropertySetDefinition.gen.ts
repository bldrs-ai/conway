
import { IfcPropertyDefinition } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcpropertysetdefinition.htm */
export abstract class IfcPropertySetDefinition extends IfcPropertyDefinition {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCPROPERTYSETDEFINITION
  }




  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCPROPERTYSET, EntityTypesIfc.IFCDOORLININGPROPERTIES, EntityTypesIfc.IFCDOORPANELPROPERTIES, EntityTypesIfc.IFCPERMEABLECOVERINGPROPERTIES, EntityTypesIfc.IFCREINFORCEMENTDEFINITIONPROPERTIES, EntityTypesIfc.IFCWINDOWLININGPROPERTIES, EntityTypesIfc.IFCWINDOWPANELPROPERTIES, EntityTypesIfc.IFCELEMENTQUANTITY ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCPROPERTYSETDEFINITION
}
