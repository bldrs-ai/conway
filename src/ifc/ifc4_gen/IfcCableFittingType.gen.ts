
import { IfcFlowFittingType } from "./index"
import { IfcCableFittingTypeEnum, IfcCableFittingTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccablefittingtype.htm */
export  class IfcCableFittingType extends IfcFlowFittingType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCABLEFITTINGTYPE
  }
  private PredefinedType_? : IfcCableFittingTypeEnum

  public get PredefinedType() : IfcCableFittingTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 8, IfcCableFittingTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcCableFittingTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCABLEFITTINGTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCABLEFITTINGTYPE
}
