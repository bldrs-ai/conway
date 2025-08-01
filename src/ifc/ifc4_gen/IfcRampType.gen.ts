
import { IfcBuildingElementType } from "./index"
import { IfcRampTypeEnum, IfcRampTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcramptype.htm */
export  class IfcRampType extends IfcBuildingElementType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRAMPTYPE
  }
  private PredefinedType_? : IfcRampTypeEnum

  public get PredefinedType() : IfcRampTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 6, IfcRampTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcRampTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRAMPTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRAMPTYPE
}
