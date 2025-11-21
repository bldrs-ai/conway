
import { IfcConstructionResource } from "./index"
import { IfcSubContractResourceTypeEnum, IfcSubContractResourceTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcsubcontractresource.htm */
export  class IfcSubContractResource extends IfcConstructionResource {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSUBCONTRACTRESOURCE
  }
  private PredefinedType_? : IfcSubContractResourceTypeEnum | null

  public get PredefinedType() : IfcSubContractResourceTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 10, 10, 5, IfcSubContractResourceTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcSubContractResourceTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSUBCONTRACTRESOURCE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSUBCONTRACTRESOURCE
}
