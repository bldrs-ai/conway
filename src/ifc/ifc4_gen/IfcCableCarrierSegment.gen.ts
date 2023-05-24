
import { IfcFlowSegment } from "./index"
import { IfcCableCarrierSegmentTypeEnum, IfcCableCarrierSegmentTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccablecarriersegment.htm */
export  class IfcCableCarrierSegment extends IfcFlowSegment {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCABLECARRIERSEGMENT
  }
  private PredefinedType_? : IfcCableCarrierSegmentTypeEnum | null

  public get PredefinedType() : IfcCableCarrierSegmentTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, IfcCableCarrierSegmentTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcCableCarrierSegmentTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCABLECARRIERSEGMENT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCABLECARRIERSEGMENT
}
