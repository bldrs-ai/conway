
import { IfcFlowStorageDeviceType } from "./index"
import { IfcElectricFlowStorageDeviceTypeEnum, IfcElectricFlowStorageDeviceTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcelectricflowstoragedevicetype.htm */
export  class IfcElectricFlowStorageDeviceType extends IfcFlowStorageDeviceType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCELECTRICFLOWSTORAGEDEVICETYPE
  }
  private PredefinedType_? : IfcElectricFlowStorageDeviceTypeEnum

  public get PredefinedType() : IfcElectricFlowStorageDeviceTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 8, IfcElectricFlowStorageDeviceTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcElectricFlowStorageDeviceTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCELECTRICFLOWSTORAGEDEVICETYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCELECTRICFLOWSTORAGEDEVICETYPE
}
