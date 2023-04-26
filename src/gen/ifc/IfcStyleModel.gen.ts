
import { IfcRepresentation } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../core/step_entity_internal_reference'
import StepEntityBase from '../../core/step_entity_base'
import StepModelBase from '../../core/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcstylemodel.htm */
export abstract class IfcStyleModel extends IfcRepresentation {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSTYLEMODEL
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSTYLEDREPRESENTATION ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSTYLEMODEL
}
