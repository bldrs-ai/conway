
import { IfcEnergyConversionDeviceType } from "./index"
import { IfcHumidifierTypeEnum, IfcHumidifierTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifchumidifiertype.htm */
export  class IfcHumidifierType extends IfcEnergyConversionDeviceType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCHUMIDIFIERTYPE
  }
  private PredefinedType_? : IfcHumidifierTypeEnum

  public get PredefinedType() : IfcHumidifierTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 8, IfcHumidifierTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcHumidifierTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCHUMIDIFIERTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCHUMIDIFIERTYPE
}
