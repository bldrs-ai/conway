
import { IfcDistributionControlElement } from "./index"
import { IfcActuatorTypeEnum, IfcActuatorTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../core/step_entity_internal_reference'
import StepEntityBase from '../../core/step_entity_base'
import StepModelBase from '../../core/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcactuator.htm */
export  class IfcActuator extends IfcDistributionControlElement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCACTUATOR
  }
  private PredefinedType_? : IfcActuatorTypeEnum | null

  public get PredefinedType() : IfcActuatorTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, IfcActuatorTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcActuatorTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCACTUATOR ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCACTUATOR
}
