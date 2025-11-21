
import { IfcDistributionFlowElement } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcflowcontroller.htm */
export  class IfcFlowController extends IfcDistributionFlowElement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCFLOWCONTROLLER
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCFLOWCONTROLLER, EntityTypesIfc.IFCAIRTERMINALBOX, EntityTypesIfc.IFCDAMPER, EntityTypesIfc.IFCELECTRICDISTRIBUTIONBOARD, EntityTypesIfc.IFCELECTRICTIMECONTROL, EntityTypesIfc.IFCFLOWMETER, EntityTypesIfc.IFCPROTECTIVEDEVICE, EntityTypesIfc.IFCSWITCHINGDEVICE, EntityTypesIfc.IFCVALVE, EntityTypesIfc.IFCELECTRICDISTRIBUTIONPOINT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCFLOWCONTROLLER
}
