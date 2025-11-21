
import { IfcRelationship } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcreldecomposes.htm */
export abstract class IfcRelDecomposes extends IfcRelationship {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRELDECOMPOSES
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELAGGREGATES, EntityTypesIfc.IFCRELNESTS, EntityTypesIfc.IFCRELPROJECTSELEMENT, EntityTypesIfc.IFCRELVOIDSELEMENT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELDECOMPOSES
}
