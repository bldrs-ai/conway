
import { IfcFlowControllerType } from "./index"
import { IfcElectricDistributionBoardTypeEnum, IfcElectricDistributionBoardTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcelectricdistributionboardtype.htm */
export  class IfcElectricDistributionBoardType extends IfcFlowControllerType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCELECTRICDISTRIBUTIONBOARDTYPE
  }
  private PredefinedType_? : IfcElectricDistributionBoardTypeEnum

  public get PredefinedType() : IfcElectricDistributionBoardTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 8, IfcElectricDistributionBoardTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcElectricDistributionBoardTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCELECTRICDISTRIBUTIONBOARDTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCELECTRICDISTRIBUTIONBOARDTYPE
}
