
import { IfcDistributionControlElementType } from "./index"
import { IfcActuatorTypeEnum, IfcActuatorTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcactuatortype.htm */
export  class IfcActuatorType extends IfcDistributionControlElementType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCACTUATORTYPE
  }
  private PredefinedType_? : IfcActuatorTypeEnum

  public get PredefinedType() : IfcActuatorTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, IfcActuatorTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcActuatorTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCACTUATORTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCACTUATORTYPE
}
