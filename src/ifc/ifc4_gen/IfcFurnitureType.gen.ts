
import { IfcFurnishingElementType } from "./index"
import { IfcAssemblyPlaceEnum, IfcAssemblyPlaceEnumDeserializeStep } from "./index"
import { IfcFurnitureTypeEnum, IfcFurnitureTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcfurnituretype.htm */
export  class IfcFurnitureType extends IfcFurnishingElementType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCFURNITURETYPE
  }
  private AssemblyPlace_? : IfcAssemblyPlaceEnum
  private PredefinedType_? : IfcFurnitureTypeEnum | null

  public get AssemblyPlace() : IfcAssemblyPlaceEnum {
    if ( this.AssemblyPlace_ === void 0 ) {
      this.AssemblyPlace_ = this.extractLambda( 9, 9, 6, IfcAssemblyPlaceEnumDeserializeStep, false )
    }

    return this.AssemblyPlace_ as IfcAssemblyPlaceEnum
  }

  public get PredefinedType() : IfcFurnitureTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 10, 9, 6, IfcFurnitureTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcFurnitureTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCFURNITURETYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCFURNITURETYPE
}
