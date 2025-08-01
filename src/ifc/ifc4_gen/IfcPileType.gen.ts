
import { IfcBuildingElementType } from "./index"
import { IfcPileTypeEnum, IfcPileTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcpiletype.htm */
export  class IfcPileType extends IfcBuildingElementType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCPILETYPE
  }
  private PredefinedType_? : IfcPileTypeEnum

  public get PredefinedType() : IfcPileTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 6, IfcPileTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcPileTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCPILETYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCPILETYPE
}
