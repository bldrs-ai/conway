
import { IfcRoot } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcpropertydefinition.htm */
export abstract class IfcPropertyDefinition extends IfcRoot {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCPROPERTYDEFINITION
  }



  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCPROPERTYSET, EntityTypesIfc.IFCDOORLININGPROPERTIES, EntityTypesIfc.IFCDOORPANELPROPERTIES, EntityTypesIfc.IFCPERMEABLECOVERINGPROPERTIES, EntityTypesIfc.IFCREINFORCEMENTDEFINITIONPROPERTIES, EntityTypesIfc.IFCWINDOWLININGPROPERTIES, EntityTypesIfc.IFCWINDOWPANELPROPERTIES, EntityTypesIfc.IFCELEMENTQUANTITY, EntityTypesIfc.IFCPROPERTYSETTEMPLATE, EntityTypesIfc.IFCCOMPLEXPROPERTYTEMPLATE, EntityTypesIfc.IFCSIMPLEPROPERTYTEMPLATE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCPROPERTYDEFINITION
}
