
import { IfcFlowStorageDeviceType } from "./index"
import { IfcTankTypeEnum, IfcTankTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifctanktype.htm */
export  class IfcTankType extends IfcFlowStorageDeviceType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCTANKTYPE
  }
  private PredefinedType_? : IfcTankTypeEnum

  public get PredefinedType() : IfcTankTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 8, IfcTankTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcTankTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCTANKTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCTANKTYPE
}
