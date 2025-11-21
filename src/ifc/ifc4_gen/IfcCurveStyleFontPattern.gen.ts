
import { IfcPresentationItem } from "./index"
import { IfcLengthMeasure } from "./index"
import { IfcPositiveLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccurvestylefontpattern.htm */
export  class IfcCurveStyleFontPattern extends IfcPresentationItem {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCURVESTYLEFONTPATTERN
  }
  private VisibleSegmentLength_? : number
  private InvisibleSegmentLength_? : number

  public get VisibleSegmentLength() : number {
    if ( this.VisibleSegmentLength_ === void 0 ) {
      this.VisibleSegmentLength_ = this.extractNumber( 0, 0, 1, false )
    }

    return this.VisibleSegmentLength_ as number
  }

  public get InvisibleSegmentLength() : number {
    if ( this.InvisibleSegmentLength_ === void 0 ) {
      this.InvisibleSegmentLength_ = this.extractNumber( 1, 0, 1, false )
    }

    return this.InvisibleSegmentLength_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCURVESTYLEFONTPATTERN ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCURVESTYLEFONTPATTERN
}
