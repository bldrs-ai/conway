
import { IfcAlignmentParameterSegment } from "./index"
import { IfcLengthMeasure } from "./index"
import { IfcNonNegativeLengthMeasure } from "./index"
import { IfcAlignmentCantSegmentTypeEnum, IfcAlignmentCantSegmentTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcAlignmentCantSegment extends IfcAlignmentParameterSegment {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCALIGNMENTCANTSEGMENT
  }
  private StartDistAlong_? : number
  private HorizontalLength_? : number
  private StartCantLeft_? : number
  private EndCantLeft_? : number | null
  private StartCantRight_? : number
  private EndCantRight_? : number | null
  private PredefinedType_? : IfcAlignmentCantSegmentTypeEnum

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

  public get StartCantLeft() : number {
    if ( this.StartCantLeft_ === void 0 ) {
      this.StartCantLeft_ = this.extractNumber( 4, 2, 1, false )
    }

    return this.StartCantLeft_ as number
  }

  public get EndCantLeft() : number | null {
    if ( this.EndCantLeft_ === void 0 ) {
      this.EndCantLeft_ = this.extractNumber( 5, 2, 1, true )
    }

    return this.EndCantLeft_ as number | null
  }

  public get StartCantRight() : number {
    if ( this.StartCantRight_ === void 0 ) {
      this.StartCantRight_ = this.extractNumber( 6, 2, 1, false )
    }

    return this.StartCantRight_ as number
  }

  public get EndCantRight() : number | null {
    if ( this.EndCantRight_ === void 0 ) {
      this.EndCantRight_ = this.extractNumber( 7, 2, 1, true )
    }

    return this.EndCantRight_ as number | null
  }

  public get PredefinedType() : IfcAlignmentCantSegmentTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 2, 1, IfcAlignmentCantSegmentTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcAlignmentCantSegmentTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcAlignmentCantSegment.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcAlignmentCantSegment" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCALIGNMENTCANTSEGMENT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCALIGNMENTCANTSEGMENT
}
