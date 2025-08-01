
import { IfcBuildingElementType } from "./index"
import { IfcStairFlightTypeEnum, IfcStairFlightTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcstairflighttype.htm */
export  class IfcStairFlightType extends IfcBuildingElementType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSTAIRFLIGHTTYPE
  }
  private PredefinedType_? : IfcStairFlightTypeEnum

  public get PredefinedType() : IfcStairFlightTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 6, IfcStairFlightTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcStairFlightTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSTAIRFLIGHTTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSTAIRFLIGHTTYPE
}
