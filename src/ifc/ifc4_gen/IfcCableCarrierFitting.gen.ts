
import { IfcFlowFitting } from "./index"
import { IfcCableCarrierFittingTypeEnum, IfcCableCarrierFittingTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccablecarrierfitting.htm */
export  class IfcCableCarrierFitting extends IfcFlowFitting {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCABLECARRIERFITTING
  }
  private PredefinedType_? : IfcCableCarrierFittingTypeEnum | null

  public get PredefinedType() : IfcCableCarrierFittingTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 8, IfcCableCarrierFittingTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcCableCarrierFittingTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCABLECARRIERFITTING ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCABLECARRIERFITTING
}
