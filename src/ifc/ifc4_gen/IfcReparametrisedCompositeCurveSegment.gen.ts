
import { IfcCompositeCurveSegment } from "./index"
import { IfcParameterValue } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcreparametrisedcompositecurvesegment.htm */
export  class IfcReparametrisedCompositeCurveSegment extends IfcCompositeCurveSegment {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCREPARAMETRISEDCOMPOSITECURVESEGMENT
  }
  private ParamLength_? : number

  public get ParamLength() : number {
    if ( this.ParamLength_ === void 0 ) {
      this.ParamLength_ = this.extractNumber( 3, 3, 3, false )
    }

    return this.ParamLength_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCREPARAMETRISEDCOMPOSITECURVESEGMENT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCREPARAMETRISEDCOMPOSITECURVESEGMENT
}
