
import { IfcReinforcingElementType } from "./index"
import { IfcTendonAnchorTypeEnum, IfcTendonAnchorTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifctendonanchortype.htm */
export  class IfcTendonAnchorType extends IfcReinforcingElementType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCTENDONANCHORTYPE
  }
  private PredefinedType_? : IfcTendonAnchorTypeEnum

  public get PredefinedType() : IfcTendonAnchorTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 7, IfcTendonAnchorTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcTendonAnchorTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCTENDONANCHORTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCTENDONANCHORTYPE
}
