
import { IfcConstructionResource } from "./index"
import { IfcLaborResourceTypeEnum, IfcLaborResourceTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifclaborresource.htm */
export  class IfcLaborResource extends IfcConstructionResource {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCLABORRESOURCE
  }
  private PredefinedType_? : IfcLaborResourceTypeEnum | null

  public get PredefinedType() : IfcLaborResourceTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 10, 10, 5, IfcLaborResourceTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcLaborResourceTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCLABORRESOURCE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCLABORRESOURCE
}
