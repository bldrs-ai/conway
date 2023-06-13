
import { IfcDistributionControlElement } from "./index"
import { IfcSensorTypeEnum, IfcSensorTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcsensor.htm */
export  class IfcSensor extends IfcDistributionControlElement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSENSOR
  }
  private PredefinedType_? : IfcSensorTypeEnum | null

  public get PredefinedType() : IfcSensorTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, IfcSensorTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcSensorTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSENSOR ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSENSOR
}
