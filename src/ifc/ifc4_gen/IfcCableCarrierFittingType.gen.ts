
import { IfcFlowFittingType } from "./index"
import { IfcCableCarrierFittingTypeEnum, IfcCableCarrierFittingTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccablecarrierfittingtype.htm */
export  class IfcCableCarrierFittingType extends IfcFlowFittingType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCABLECARRIERFITTINGTYPE
  }
  private PredefinedType_? : IfcCableCarrierFittingTypeEnum

  public get PredefinedType() : IfcCableCarrierFittingTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 8, IfcCableCarrierFittingTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcCableCarrierFittingTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCABLECARRIERFITTINGTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCABLECARRIERFITTINGTYPE
}
