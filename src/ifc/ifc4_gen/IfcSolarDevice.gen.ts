
import { IfcEnergyConversionDevice } from "./index"
import { IfcSolarDeviceTypeEnum, IfcSolarDeviceTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcsolardevice.htm */
export  class IfcSolarDevice extends IfcEnergyConversionDevice {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSOLARDEVICE
  }
  private PredefinedType_? : IfcSolarDeviceTypeEnum | null

  public get PredefinedType() : IfcSolarDeviceTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 8, IfcSolarDeviceTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcSolarDeviceTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSOLARDEVICE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSOLARDEVICE
}
