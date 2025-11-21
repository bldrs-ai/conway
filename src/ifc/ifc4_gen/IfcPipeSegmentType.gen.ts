
import { IfcFlowSegmentType } from "./index"
import { IfcPipeSegmentTypeEnum, IfcPipeSegmentTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcpipesegmenttype.htm */
export  class IfcPipeSegmentType extends IfcFlowSegmentType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCPIPESEGMENTTYPE
  }
  private PredefinedType_? : IfcPipeSegmentTypeEnum

  public get PredefinedType() : IfcPipeSegmentTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 8, IfcPipeSegmentTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcPipeSegmentTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCPIPESEGMENTTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCPIPESEGMENTTYPE
}
