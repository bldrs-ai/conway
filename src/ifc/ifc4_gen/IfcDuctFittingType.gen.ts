
import { IfcFlowFittingType } from "./index"
import { IfcDuctFittingTypeEnum, IfcDuctFittingTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcductfittingtype.htm */
export  class IfcDuctFittingType extends IfcFlowFittingType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCDUCTFITTINGTYPE
  }
  private PredefinedType_? : IfcDuctFittingTypeEnum

  public get PredefinedType() : IfcDuctFittingTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 8, IfcDuctFittingTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcDuctFittingTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCDUCTFITTINGTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCDUCTFITTINGTYPE
}
