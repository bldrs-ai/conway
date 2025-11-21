
import { IfcObject } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcgroup.htm */
export  class IfcGroup extends IfcObject {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCGROUP
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCGROUP, EntityTypesIfc.IFCASSET, EntityTypesIfc.IFCINVENTORY, EntityTypesIfc.IFCSTRUCTURALLOADGROUP, EntityTypesIfc.IFCSTRUCTURALRESULTGROUP, EntityTypesIfc.IFCSYSTEM, EntityTypesIfc.IFCSTRUCTURALLOADCASE, EntityTypesIfc.IFCBUILDINGSYSTEM, EntityTypesIfc.IFCDISTRIBUTIONSYSTEM, EntityTypesIfc.IFCSTRUCTURALANALYSISMODEL, EntityTypesIfc.IFCZONE, EntityTypesIfc.IFCDISTRIBUTIONCIRCUIT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCGROUP
}
