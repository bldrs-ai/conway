
import { IfcFlowSegment } from "./index"
import { IfcCableSegmentTypeEnum, IfcCableSegmentTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccablesegment.htm */
export  class IfcCableSegment extends IfcFlowSegment {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCABLESEGMENT
  }
  private PredefinedType_? : IfcCableSegmentTypeEnum | null

  public get PredefinedType() : IfcCableSegmentTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 8, IfcCableSegmentTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcCableSegmentTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCABLESEGMENT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCABLESEGMENT
}
