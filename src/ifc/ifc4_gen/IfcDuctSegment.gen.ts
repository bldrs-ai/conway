
import { IfcFlowSegment } from "./index"
import { IfcDuctSegmentTypeEnum, IfcDuctSegmentTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcductsegment.htm */
export  class IfcDuctSegment extends IfcFlowSegment {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCDUCTSEGMENT
  }
  private PredefinedType_? : IfcDuctSegmentTypeEnum | null

  public get PredefinedType() : IfcDuctSegmentTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, IfcDuctSegmentTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcDuctSegmentTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCDUCTSEGMENT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCDUCTSEGMENT
}
