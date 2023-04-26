
import { IfcStructuralItem } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../core/step_entity_internal_reference'
import StepEntityBase from '../../core/step_entity_base'
import StepModelBase from '../../core/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcstructuralmember.htm */
export abstract class IfcStructuralMember extends IfcStructuralItem {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSTRUCTURALMEMBER
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSTRUCTURALCURVEMEMBER, EntityTypesIfc.IFCSTRUCTURALSURFACEMEMBER, EntityTypesIfc.IFCSTRUCTURALCURVEMEMBERVARYING, EntityTypesIfc.IFCSTRUCTURALSURFACEMEMBERVARYING ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSTRUCTURALMEMBER
}
