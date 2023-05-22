
import { IfcFlowSegmentType } from "./index"
import { IfcCableSegmentTypeEnum, IfcCableSegmentTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../core/step_entity_internal_reference'
import StepEntityBase from '../../core/step_entity_base'
import StepModelBase from '../../core/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccablesegmenttype.htm */
export  class IfcCableSegmentType extends IfcFlowSegmentType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCABLESEGMENTTYPE
  }
  private PredefinedType_? : IfcCableSegmentTypeEnum

  public get PredefinedType() : IfcCableSegmentTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, IfcCableSegmentTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcCableSegmentTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCABLESEGMENTTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCABLESEGMENTTYPE
}
