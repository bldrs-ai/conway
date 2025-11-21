
import { IfcReinforcingElement } from "./index"
import { IfcTendonAnchorTypeEnum, IfcTendonAnchorTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifctendonanchor.htm */
export  class IfcTendonAnchor extends IfcReinforcingElement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCTENDONANCHOR
  }
  private PredefinedType_? : IfcTendonAnchorTypeEnum | null

  public get PredefinedType() : IfcTendonAnchorTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 7, IfcTendonAnchorTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcTendonAnchorTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCTENDONANCHOR ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCTENDONANCHOR
}
