
import { IfcBuildingElementType } from "./index"
import { IfcCurtainWallTypeEnum, IfcCurtainWallTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccurtainwalltype.htm */
export  class IfcCurtainWallType extends IfcBuildingElementType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCURTAINWALLTYPE
  }
  private PredefinedType_? : IfcCurtainWallTypeEnum

  public get PredefinedType() : IfcCurtainWallTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 6, IfcCurtainWallTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcCurtainWallTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCURTAINWALLTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCURTAINWALLTYPE
}
