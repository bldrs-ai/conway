
import { IfcFlowTerminalType } from "./index"
import { IfcMedicalDeviceTypeEnum, IfcMedicalDeviceTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcmedicaldevicetype.htm */
export  class IfcMedicalDeviceType extends IfcFlowTerminalType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCMEDICALDEVICETYPE
  }
  private PredefinedType_? : IfcMedicalDeviceTypeEnum

  public get PredefinedType() : IfcMedicalDeviceTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, IfcMedicalDeviceTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcMedicalDeviceTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCMEDICALDEVICETYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCMEDICALDEVICETYPE
}
