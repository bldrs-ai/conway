
import { IfcFlowController } from "./index"
import { IfcElectricDistributionBoardTypeEnum, IfcElectricDistributionBoardTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcelectricdistributionboard.htm */
export  class IfcElectricDistributionBoard extends IfcFlowController {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCELECTRICDISTRIBUTIONBOARD
  }
  private PredefinedType_? : IfcElectricDistributionBoardTypeEnum | null

  public get PredefinedType() : IfcElectricDistributionBoardTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 8, IfcElectricDistributionBoardTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcElectricDistributionBoardTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCELECTRICDISTRIBUTIONBOARD ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCELECTRICDISTRIBUTIONBOARD
}
