
import { IfcFlowSegment } from "./index"
import { IfcPipeSegmentTypeEnum, IfcPipeSegmentTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcpipesegment.htm */
export  class IfcPipeSegment extends IfcFlowSegment {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCPIPESEGMENT
  }
  private PredefinedType_? : IfcPipeSegmentTypeEnum | null

  public get PredefinedType() : IfcPipeSegmentTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 8, IfcPipeSegmentTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcPipeSegmentTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCPIPESEGMENT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCPIPESEGMENT
}
