
import { IfcPropertySetDefinition } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcpredefinedpropertyset.htm */
export abstract class IfcPreDefinedPropertySet extends IfcPropertySetDefinition {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCPREDEFINEDPROPERTYSET
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCDOORLININGPROPERTIES, EntityTypesIfc.IFCDOORPANELPROPERTIES, EntityTypesIfc.IFCPERMEABLECOVERINGPROPERTIES, EntityTypesIfc.IFCREINFORCEMENTDEFINITIONPROPERTIES, EntityTypesIfc.IFCWINDOWLININGPROPERTIES, EntityTypesIfc.IFCWINDOWPANELPROPERTIES ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCPREDEFINEDPROPERTYSET
}
