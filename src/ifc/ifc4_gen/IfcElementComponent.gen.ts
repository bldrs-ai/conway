
import { IfcElement } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcelementcomponent.htm */
export abstract class IfcElementComponent extends IfcElement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCELEMENTCOMPONENT
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCBUILDINGELEMENTPART, EntityTypesIfc.IFCDISCRETEACCESSORY, EntityTypesIfc.IFCFASTENER, EntityTypesIfc.IFCMECHANICALFASTENER, EntityTypesIfc.IFCVIBRATIONISOLATOR, EntityTypesIfc.IFCREINFORCINGBAR, EntityTypesIfc.IFCREINFORCINGMESH, EntityTypesIfc.IFCTENDON, EntityTypesIfc.IFCTENDONANCHOR ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCELEMENTCOMPONENT
}
