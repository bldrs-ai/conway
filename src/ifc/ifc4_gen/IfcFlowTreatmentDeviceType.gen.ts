
import { IfcDistributionFlowElementType } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcflowtreatmentdevicetype.htm */
export abstract class IfcFlowTreatmentDeviceType extends IfcDistributionFlowElementType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCFLOWTREATMENTDEVICETYPE
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCDUCTSILENCERTYPE, EntityTypesIfc.IFCFILTERTYPE, EntityTypesIfc.IFCINTERCEPTORTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCFLOWTREATMENTDEVICETYPE
}
