
import { IfcFlowSegmentType } from "./index"
import { IfcCableCarrierSegmentTypeEnum, IfcCableCarrierSegmentTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccablecarriersegmenttype.htm */
export  class IfcCableCarrierSegmentType extends IfcFlowSegmentType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCABLECARRIERSEGMENTTYPE
  }
  private PredefinedType_? : IfcCableCarrierSegmentTypeEnum

  public get PredefinedType() : IfcCableCarrierSegmentTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, IfcCableCarrierSegmentTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcCableCarrierSegmentTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCABLECARRIERSEGMENTTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCABLECARRIERSEGMENTTYPE
}
