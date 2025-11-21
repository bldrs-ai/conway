
import { IfcDistributionControlElement } from "./index"
import { IfcProtectiveDeviceTrippingUnitTypeEnum, IfcProtectiveDeviceTrippingUnitTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcprotectivedevicetrippingunit.htm */
export  class IfcProtectiveDeviceTrippingUnit extends IfcDistributionControlElement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCPROTECTIVEDEVICETRIPPINGUNIT
  }
  private PredefinedType_? : IfcProtectiveDeviceTrippingUnitTypeEnum | null

  public get PredefinedType() : IfcProtectiveDeviceTrippingUnitTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 7, IfcProtectiveDeviceTrippingUnitTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcProtectiveDeviceTrippingUnitTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCPROTECTIVEDEVICETRIPPINGUNIT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCPROTECTIVEDEVICETRIPPINGUNIT
}
