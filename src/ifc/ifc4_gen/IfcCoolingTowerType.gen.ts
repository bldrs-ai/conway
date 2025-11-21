
import { IfcEnergyConversionDeviceType } from "./index"
import { IfcCoolingTowerTypeEnum, IfcCoolingTowerTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccoolingtowertype.htm */
export  class IfcCoolingTowerType extends IfcEnergyConversionDeviceType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCOOLINGTOWERTYPE
  }
  private PredefinedType_? : IfcCoolingTowerTypeEnum

  public get PredefinedType() : IfcCoolingTowerTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 8, IfcCoolingTowerTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcCoolingTowerTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCOOLINGTOWERTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCOOLINGTOWERTYPE
}
