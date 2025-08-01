
import { IfcEnergyConversionDevice } from "./index"
import { IfcHumidifierTypeEnum, IfcHumidifierTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifchumidifier.htm */
export  class IfcHumidifier extends IfcEnergyConversionDevice {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCHUMIDIFIER
  }
  private PredefinedType_? : IfcHumidifierTypeEnum | null

  public get PredefinedType() : IfcHumidifierTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 8, IfcHumidifierTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcHumidifierTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCHUMIDIFIER ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCHUMIDIFIER
}
