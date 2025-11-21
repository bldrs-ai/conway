
import { IfcConstructionResourceType } from "./index"
import { IfcConstructionMaterialResourceTypeEnum, IfcConstructionMaterialResourceTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcconstructionmaterialresourcetype.htm */
export  class IfcConstructionMaterialResourceType extends IfcConstructionResourceType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCONSTRUCTIONMATERIALRESOURCETYPE
  }
  private PredefinedType_? : IfcConstructionMaterialResourceTypeEnum

  public get PredefinedType() : IfcConstructionMaterialResourceTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 11, 11, 5, IfcConstructionMaterialResourceTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcConstructionMaterialResourceTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCONSTRUCTIONMATERIALRESOURCETYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCONSTRUCTIONMATERIALRESOURCETYPE
}
