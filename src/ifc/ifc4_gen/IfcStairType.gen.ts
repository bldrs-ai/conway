
import { IfcBuildingElementType } from "./index"
import { IfcStairTypeEnum, IfcStairTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcstairtype.htm */
export  class IfcStairType extends IfcBuildingElementType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSTAIRTYPE
  }
  private PredefinedType_? : IfcStairTypeEnum

  public get PredefinedType() : IfcStairTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 6, IfcStairTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcStairTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSTAIRTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSTAIRTYPE
}
