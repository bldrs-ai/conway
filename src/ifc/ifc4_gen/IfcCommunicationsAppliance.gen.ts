
import { IfcFlowTerminal } from "./index"
import { IfcCommunicationsApplianceTypeEnum, IfcCommunicationsApplianceTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccommunicationsappliance.htm */
export  class IfcCommunicationsAppliance extends IfcFlowTerminal {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCOMMUNICATIONSAPPLIANCE
  }
  private PredefinedType_? : IfcCommunicationsApplianceTypeEnum | null

  public get PredefinedType() : IfcCommunicationsApplianceTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 8, IfcCommunicationsApplianceTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcCommunicationsApplianceTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCOMMUNICATIONSAPPLIANCE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCOMMUNICATIONSAPPLIANCE
}
