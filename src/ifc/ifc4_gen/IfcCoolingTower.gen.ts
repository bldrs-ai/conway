
import { IfcEnergyConversionDevice } from "./index"
import { IfcCoolingTowerTypeEnum, IfcCoolingTowerTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccoolingtower.htm */
export  class IfcCoolingTower extends IfcEnergyConversionDevice {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCOOLINGTOWER
  }
  private PredefinedType_? : IfcCoolingTowerTypeEnum | null

  public get PredefinedType() : IfcCoolingTowerTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 8, IfcCoolingTowerTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcCoolingTowerTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCOOLINGTOWER ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCOOLINGTOWER
}
