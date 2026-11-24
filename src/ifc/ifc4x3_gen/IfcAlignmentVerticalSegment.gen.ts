
import { IfcAlignmentParameterSegment } from "./index"
import { IfcLengthMeasure } from "./index"
import { IfcNonNegativeLengthMeasure } from "./index"
import { IfcRatioMeasure } from "./index"
import { IfcAlignmentVerticalSegmentTypeEnum, IfcAlignmentVerticalSegmentTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcAlignmentVerticalSegment extends IfcAlignmentParameterSegment {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCALIGNMENTVERTICALSEGMENT
  }
  private StartDistAlong_? : number
  private HorizontalLength_? : number
  private StartHeight_? : number
  private StartGradient_? : number
  private EndGradient_? : number
  private RadiusOfCurvature_? : number | null
  private PredefinedType_? : IfcAlignmentVerticalSegmentTypeEnum

  public get StartDistAlong() : number {
    if ( this.StartDistAlong_ === void 0 ) {
      this.StartDistAlong_ = this.extractNumber( 2, 2, 1, false )
    }

    return this.StartDistAlong_ as number
  }

  public get HorizontalLength() : number {
    if ( this.HorizontalLength_ === void 0 ) {
      this.HorizontalLength_ = this.extractNumber( 3, 2, 1, false )
    }

    return this.HorizontalLength_ as number
  }

  public get StartHeight() : number {
    if ( this.StartHeight_ === void 0 ) {
      this.StartHeight_ = this.extractNumber( 4, 2, 1, false )
    }

    return this.StartHeight_ as number
  }

  public get StartGradient() : number {
    if ( this.StartGradient_ === void 0 ) {
      this.StartGradient_ = this.extractNumber( 5, 2, 1, false )
    }

    return this.StartGradient_ as number
  }

  public get EndGradient() : number {
    if ( this.EndGradient_ === void 0 ) {
      this.EndGradient_ = this.extractNumber( 6, 2, 1, false )
    }

    return this.EndGradient_ as number
  }

  public get RadiusOfCurvature() : number | null {
    if ( this.RadiusOfCurvature_ === void 0 ) {
      this.RadiusOfCurvature_ = this.extractNumber( 7, 2, 1, true )
    }

    return this.RadiusOfCurvature_ as number | null
  }

  public get PredefinedType() : IfcAlignmentVerticalSegmentTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 2, 1, IfcAlignmentVerticalSegmentTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcAlignmentVerticalSegmentTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcAlignmentVerticalSegment.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcAlignmentVerticalSegment" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCALIGNMENTVERTICALSEGMENT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCALIGNMENTVERTICALSEGMENT
}
