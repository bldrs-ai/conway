
import { IfcSegment } from "./index"
import { IfcPlacement } from "./index"
import { IfcLengthMeasure } from "./index"
import { IfcParameterValue } from "./index"
import { IfcCurve } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcCurveSegment extends IfcSegment {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCCURVESEGMENT
  }
  private Placement_? : IfcPlacement
  private SegmentStart_? : IfcLengthMeasure | IfcParameterValue
  private SegmentLength_? : IfcLengthMeasure | IfcParameterValue
  private ParentCurve_? : IfcCurve

  public get Placement() : IfcPlacement {
    if ( this.Placement_ === void 0 ) {
      this.Placement_ = this.extractElement( 1, 1, 3, false, IfcPlacement )
    }

    return this.Placement_ as IfcPlacement
  }

  public get SegmentStart() : IfcLengthMeasure | IfcParameterValue {
    if ( this.SegmentStart_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 > = 
        this.extractReference( 2, 1, 3, false )

      if ( !( value instanceof IfcLengthMeasure ) && !( value instanceof IfcParameterValue ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.SegmentStart_ = value as (IfcLengthMeasure | IfcParameterValue)

    }

    return this.SegmentStart_ as IfcLengthMeasure | IfcParameterValue
  }

  public get SegmentLength() : IfcLengthMeasure | IfcParameterValue {
    if ( this.SegmentLength_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 > = 
        this.extractReference( 3, 1, 3, false )

      if ( !( value instanceof IfcLengthMeasure ) && !( value instanceof IfcParameterValue ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.SegmentLength_ = value as (IfcLengthMeasure | IfcParameterValue)

    }

    return this.SegmentLength_ as IfcLengthMeasure | IfcParameterValue
  }

  public get ParentCurve() : IfcCurve {
    if ( this.ParentCurve_ === void 0 ) {
      this.ParentCurve_ = this.extractElement( 4, 1, 3, false, IfcCurve )
    }

    return this.ParentCurve_ as IfcCurve
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcCurveSegment.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcCurveSegment" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCCURVESEGMENT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCCURVESEGMENT
}
