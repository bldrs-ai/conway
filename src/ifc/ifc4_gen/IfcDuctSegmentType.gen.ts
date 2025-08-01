
import { IfcFlowSegmentType } from "./index"
import { IfcDuctSegmentTypeEnum, IfcDuctSegmentTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcductsegmenttype.htm */
export  class IfcDuctSegmentType extends IfcFlowSegmentType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCDUCTSEGMENTTYPE
  }
  private PredefinedType_? : IfcDuctSegmentTypeEnum

  public get PredefinedType() : IfcDuctSegmentTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 8, IfcDuctSegmentTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcDuctSegmentTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCDUCTSEGMENTTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCDUCTSEGMENTTYPE
}
