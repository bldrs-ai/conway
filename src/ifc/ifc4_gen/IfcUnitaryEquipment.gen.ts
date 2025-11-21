
import { IfcEnergyConversionDevice } from "./index"
import { IfcUnitaryEquipmentTypeEnum, IfcUnitaryEquipmentTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcunitaryequipment.htm */
export  class IfcUnitaryEquipment extends IfcEnergyConversionDevice {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCUNITARYEQUIPMENT
  }
  private PredefinedType_? : IfcUnitaryEquipmentTypeEnum | null

  public get PredefinedType() : IfcUnitaryEquipmentTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 8, IfcUnitaryEquipmentTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcUnitaryEquipmentTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCUNITARYEQUIPMENT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCUNITARYEQUIPMENT
}
