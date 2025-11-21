
import { IfcDistributionFlowElement } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcflowtreatmentdevice.htm */
export  class IfcFlowTreatmentDevice extends IfcDistributionFlowElement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCFLOWTREATMENTDEVICE
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCFLOWTREATMENTDEVICE, EntityTypesIfc.IFCDUCTSILENCER, EntityTypesIfc.IFCFILTER, EntityTypesIfc.IFCINTERCEPTOR ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCFLOWTREATMENTDEVICE
}
