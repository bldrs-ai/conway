
import { IfcPropertyDefinition } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcpropertytemplatedefinition.htm */
export abstract class IfcPropertyTemplateDefinition extends IfcPropertyDefinition {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCPROPERTYTEMPLATEDEFINITION
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCPROPERTYSETTEMPLATE, EntityTypesIfc.IFCCOMPLEXPROPERTYTEMPLATE, EntityTypesIfc.IFCSIMPLEPROPERTYTEMPLATE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCPROPERTYTEMPLATEDEFINITION
}
