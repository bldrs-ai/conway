
import { IfcFlowControllerType } from "./index"
import { IfcFlowMeterTypeEnum, IfcFlowMeterTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcflowmetertype.htm */
export  class IfcFlowMeterType extends IfcFlowControllerType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCFLOWMETERTYPE
  }
  private PredefinedType_? : IfcFlowMeterTypeEnum

  public get PredefinedType() : IfcFlowMeterTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 8, IfcFlowMeterTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcFlowMeterTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCFLOWMETERTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCFLOWMETERTYPE
}
