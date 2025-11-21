
import { IfcBuildingElement } from "./index"
import { IfcRailingTypeEnum, IfcRailingTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrailing.htm */
export  class IfcRailing extends IfcBuildingElement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRAILING
  }
  private PredefinedType_? : IfcRailingTypeEnum | null

  public get PredefinedType() : IfcRailingTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 6, IfcRailingTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcRailingTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRAILING ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRAILING
}
