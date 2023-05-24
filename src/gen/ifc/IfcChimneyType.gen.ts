
import { IfcBuildingElementType } from "./index"
import { IfcChimneyTypeEnum, IfcChimneyTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../core/step_entity_internal_reference'
import StepEntityBase from '../../core/step_entity_base'
import StepModelBase from '../../core/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcchimneytype.htm */
export  class IfcChimneyType extends IfcBuildingElementType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCHIMNEYTYPE
  }
  private PredefinedType_? : IfcChimneyTypeEnum

  public get PredefinedType() : IfcChimneyTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, IfcChimneyTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcChimneyTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCHIMNEYTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCHIMNEYTYPE
}
