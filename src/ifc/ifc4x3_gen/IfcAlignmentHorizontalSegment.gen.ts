
import { IfcAlignmentParameterSegment } from "./index"
import { IfcCartesianPoint } from "./index"
import { IfcPlaneAngleMeasure } from "./index"
import { IfcLengthMeasure } from "./index"
import { IfcNonNegativeLengthMeasure } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcAlignmentHorizontalSegmentTypeEnum, IfcAlignmentHorizontalSegmentTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcAlignmentHorizontalSegment extends IfcAlignmentParameterSegment {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCALIGNMENTHORIZONTALSEGMENT
  }
  private StartPoint_? : IfcCartesianPoint
  private StartDirection_? : number
  private StartRadiusOfCurvature_? : number
  private EndRadiusOfCurvature_? : number
  private SegmentLength_? : number
  private GravityCenterLineHeight_? : number | null
  private PredefinedType_? : IfcAlignmentHorizontalSegmentTypeEnum

  public get StartPoint() : IfcCartesianPoint {
    if ( this.StartPoint_ === void 0 ) {
      this.StartPoint_ = this.extractElement( 2, 2, 1, false, IfcCartesianPoint )
    }

    return this.StartPoint_ as IfcCartesianPoint
  }

  public get StartDirection() : number {
    if ( this.StartDirection_ === void 0 ) {
      this.StartDirection_ = this.extractNumber( 3, 2, 1, false )
    }

    return this.StartDirection_ as number
  }

  public get StartRadiusOfCurvature() : number {
    if ( this.StartRadiusOfCurvature_ === void 0 ) {
      this.StartRadiusOfCurvature_ = this.extractNumber( 4, 2, 1, false )
    }

    return this.StartRadiusOfCurvature_ as number
  }

  public get EndRadiusOfCurvature() : number {
    if ( this.EndRadiusOfCurvature_ === void 0 ) {
      this.EndRadiusOfCurvature_ = this.extractNumber( 5, 2, 1, false )
    }

    return this.EndRadiusOfCurvature_ as number
  }

  public get SegmentLength() : number {
    if ( this.SegmentLength_ === void 0 ) {
      this.SegmentLength_ = this.extractNumber( 6, 2, 1, false )
    }

    return this.SegmentLength_ as number
  }

  public get GravityCenterLineHeight() : number | null {
    if ( this.GravityCenterLineHeight_ === void 0 ) {
      this.GravityCenterLineHeight_ = this.extractNumber( 7, 2, 1, true )
    }

    return this.GravityCenterLineHeight_ as number | null
  }

  public get PredefinedType() : IfcAlignmentHorizontalSegmentTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 2, 1, IfcAlignmentHorizontalSegmentTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcAlignmentHorizontalSegmentTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcAlignmentHorizontalSegment.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcAlignmentHorizontalSegment" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCALIGNMENTHORIZONTALSEGMENT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCALIGNMENTHORIZONTALSEGMENT
}
