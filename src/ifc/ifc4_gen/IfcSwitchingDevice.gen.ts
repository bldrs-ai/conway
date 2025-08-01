
import { IfcFlowController } from "./index"
import { IfcSwitchingDeviceTypeEnum, IfcSwitchingDeviceTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcswitchingdevice.htm */
export  class IfcSwitchingDevice extends IfcFlowController {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSWITCHINGDEVICE
  }
  private PredefinedType_? : IfcSwitchingDeviceTypeEnum | null

  public get PredefinedType() : IfcSwitchingDeviceTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 8, IfcSwitchingDeviceTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcSwitchingDeviceTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSWITCHINGDEVICE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSWITCHINGDEVICE
}
