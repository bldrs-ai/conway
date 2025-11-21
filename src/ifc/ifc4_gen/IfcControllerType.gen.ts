
import { IfcDistributionControlElementType } from "./index"
import { IfcControllerTypeEnum, IfcControllerTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccontrollertype.htm */
export  class IfcControllerType extends IfcDistributionControlElementType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCONTROLLERTYPE
  }
  private PredefinedType_? : IfcControllerTypeEnum

  public get PredefinedType() : IfcControllerTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 7, IfcControllerTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcControllerTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCONTROLLERTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCONTROLLERTYPE
}
