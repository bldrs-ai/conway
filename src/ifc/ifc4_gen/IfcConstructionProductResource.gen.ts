
import { IfcConstructionResource } from "./index"
import { IfcConstructionProductResourceTypeEnum, IfcConstructionProductResourceTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcconstructionproductresource.htm */
export  class IfcConstructionProductResource extends IfcConstructionResource {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCONSTRUCTIONPRODUCTRESOURCE
  }
  private PredefinedType_? : IfcConstructionProductResourceTypeEnum | null

  public get PredefinedType() : IfcConstructionProductResourceTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 10, 10, 5, IfcConstructionProductResourceTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcConstructionProductResourceTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCONSTRUCTIONPRODUCTRESOURCE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCONSTRUCTIONPRODUCTRESOURCE
}
