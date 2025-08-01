
import { IfcEnergyConversionDevice } from "./index"
import { IfcHeatExchangerTypeEnum, IfcHeatExchangerTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcheatexchanger.htm */
export  class IfcHeatExchanger extends IfcEnergyConversionDevice {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCHEATEXCHANGER
  }
  private PredefinedType_? : IfcHeatExchangerTypeEnum | null

  public get PredefinedType() : IfcHeatExchangerTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 8, IfcHeatExchangerTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcHeatExchangerTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCHEATEXCHANGER ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCHEATEXCHANGER
}
