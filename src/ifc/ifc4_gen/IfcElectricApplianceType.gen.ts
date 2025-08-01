
import { IfcFlowTerminalType } from "./index"
import { IfcElectricApplianceTypeEnum, IfcElectricApplianceTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcelectricappliancetype.htm */
export  class IfcElectricApplianceType extends IfcFlowTerminalType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCELECTRICAPPLIANCETYPE
  }
  private PredefinedType_? : IfcElectricApplianceTypeEnum

  public get PredefinedType() : IfcElectricApplianceTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 8, IfcElectricApplianceTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcElectricApplianceTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCELECTRICAPPLIANCETYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCELECTRICAPPLIANCETYPE
}
