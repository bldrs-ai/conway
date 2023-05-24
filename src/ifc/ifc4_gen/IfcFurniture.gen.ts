
import { IfcFurnishingElement } from "./index"
import { IfcFurnitureTypeEnum, IfcFurnitureTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcfurniture.htm */
export  class IfcFurniture extends IfcFurnishingElement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCFURNITURE
  }
  private PredefinedType_? : IfcFurnitureTypeEnum | null

  public get PredefinedType() : IfcFurnitureTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, IfcFurnitureTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcFurnitureTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCFURNITURE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCFURNITURE
}
