
import { IfcGroup } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcsystem.htm */
export  class IfcSystem extends IfcGroup {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSYSTEM
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSYSTEM, EntityTypesIfc.IFCBUILDINGSYSTEM, EntityTypesIfc.IFCDISTRIBUTIONSYSTEM, EntityTypesIfc.IFCSTRUCTURALANALYSISMODEL, EntityTypesIfc.IFCZONE, EntityTypesIfc.IFCDISTRIBUTIONCIRCUIT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSYSTEM
}
