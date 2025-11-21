
import { IfcFurnishingElementType } from "./index"
import { IfcSystemFurnitureElementTypeEnum, IfcSystemFurnitureElementTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcsystemfurnitureelementtype.htm */
export  class IfcSystemFurnitureElementType extends IfcFurnishingElementType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSYSTEMFURNITUREELEMENTTYPE
  }
  private PredefinedType_? : IfcSystemFurnitureElementTypeEnum | null

  public get PredefinedType() : IfcSystemFurnitureElementTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 6, IfcSystemFurnitureElementTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcSystemFurnitureElementTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSYSTEMFURNITUREELEMENTTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSYSTEMFURNITUREELEMENTTYPE
}
