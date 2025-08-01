
import { IfcElementType } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcelementcomponenttype.htm */
export abstract class IfcElementComponentType extends IfcElementType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCELEMENTCOMPONENTTYPE
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCBUILDINGELEMENTPARTTYPE, EntityTypesIfc.IFCDISCRETEACCESSORYTYPE, EntityTypesIfc.IFCFASTENERTYPE, EntityTypesIfc.IFCMECHANICALFASTENERTYPE, EntityTypesIfc.IFCVIBRATIONISOLATORTYPE, EntityTypesIfc.IFCREINFORCINGBARTYPE, EntityTypesIfc.IFCREINFORCINGMESHTYPE, EntityTypesIfc.IFCTENDONANCHORTYPE, EntityTypesIfc.IFCTENDONTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCELEMENTCOMPONENTTYPE
}
