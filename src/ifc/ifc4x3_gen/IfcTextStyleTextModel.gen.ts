
import { IfcPresentationItem } from "./index"
import { IfcDescriptiveMeasure } from "./index"
import { IfcLengthMeasure } from "./index"
import { IfcNormalisedRatioMeasure } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcPositiveRatioMeasure } from "./index"
import { IfcRatioMeasure } from "./index"
import { IfcTextAlignment } from "./index"
import { IfcTextDecoration } from "./index"
import { IfcTextTransformation } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcTextStyleTextModel extends IfcPresentationItem {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCTEXTSTYLETEXTMODEL
  }
  private TextIndent_? : IfcDescriptiveMeasure | IfcLengthMeasure | IfcNormalisedRatioMeasure | IfcPositiveLengthMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure | null
  private TextAlign_? : string | null
  private TextDecoration_? : string | null
  private LetterSpacing_? : IfcDescriptiveMeasure | IfcLengthMeasure | IfcNormalisedRatioMeasure | IfcPositiveLengthMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure | null
  private WordSpacing_? : IfcDescriptiveMeasure | IfcLengthMeasure | IfcNormalisedRatioMeasure | IfcPositiveLengthMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure | null
  private TextTransform_? : string | null
  private LineHeight_? : IfcDescriptiveMeasure | IfcLengthMeasure | IfcNormalisedRatioMeasure | IfcPositiveLengthMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure | null

  public get TextIndent() : IfcDescriptiveMeasure | IfcLengthMeasure | IfcNormalisedRatioMeasure | IfcPositiveLengthMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure | null {
    if ( this.TextIndent_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 >| null = 
        this.extractReference( 0, 0, 1, true )

      if ( !( value instanceof IfcDescriptiveMeasure ) && !( value instanceof IfcLengthMeasure ) && !( value instanceof IfcNormalisedRatioMeasure ) && !( value instanceof IfcPositiveLengthMeasure ) && !( value instanceof IfcPositiveRatioMeasure ) && !( value instanceof IfcRatioMeasure ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.TextIndent_ = value as (IfcDescriptiveMeasure | IfcLengthMeasure | IfcNormalisedRatioMeasure | IfcPositiveLengthMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure)

    }

    return this.TextIndent_ as IfcDescriptiveMeasure | IfcLengthMeasure | IfcNormalisedRatioMeasure | IfcPositiveLengthMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure | null
  }

  public get TextAlign() : string | null {
    if ( this.TextAlign_ === void 0 ) {
      this.TextAlign_ = this.extractString( 1, 0, 1, true )
    }

    return this.TextAlign_ as string | null
  }

  public get TextDecoration() : string | null {
    if ( this.TextDecoration_ === void 0 ) {
      this.TextDecoration_ = this.extractString( 2, 0, 1, true )
    }

    return this.TextDecoration_ as string | null
  }

  public get LetterSpacing() : IfcDescriptiveMeasure | IfcLengthMeasure | IfcNormalisedRatioMeasure | IfcPositiveLengthMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure | null {
    if ( this.LetterSpacing_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 >| null = 
        this.extractReference( 3, 0, 1, true )

      if ( !( value instanceof IfcDescriptiveMeasure ) && !( value instanceof IfcLengthMeasure ) && !( value instanceof IfcNormalisedRatioMeasure ) && !( value instanceof IfcPositiveLengthMeasure ) && !( value instanceof IfcPositiveRatioMeasure ) && !( value instanceof IfcRatioMeasure ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.LetterSpacing_ = value as (IfcDescriptiveMeasure | IfcLengthMeasure | IfcNormalisedRatioMeasure | IfcPositiveLengthMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure)

    }

    return this.LetterSpacing_ as IfcDescriptiveMeasure | IfcLengthMeasure | IfcNormalisedRatioMeasure | IfcPositiveLengthMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure | null
  }

  public get WordSpacing() : IfcDescriptiveMeasure | IfcLengthMeasure | IfcNormalisedRatioMeasure | IfcPositiveLengthMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure | null {
    if ( this.WordSpacing_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 >| null = 
        this.extractReference( 4, 0, 1, true )

      if ( !( value instanceof IfcDescriptiveMeasure ) && !( value instanceof IfcLengthMeasure ) && !( value instanceof IfcNormalisedRatioMeasure ) && !( value instanceof IfcPositiveLengthMeasure ) && !( value instanceof IfcPositiveRatioMeasure ) && !( value instanceof IfcRatioMeasure ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.WordSpacing_ = value as (IfcDescriptiveMeasure | IfcLengthMeasure | IfcNormalisedRatioMeasure | IfcPositiveLengthMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure)

    }

    return this.WordSpacing_ as IfcDescriptiveMeasure | IfcLengthMeasure | IfcNormalisedRatioMeasure | IfcPositiveLengthMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure | null
  }

  public get TextTransform() : string | null {
    if ( this.TextTransform_ === void 0 ) {
      this.TextTransform_ = this.extractString( 5, 0, 1, true )
    }

    return this.TextTransform_ as string | null
  }

  public get LineHeight() : IfcDescriptiveMeasure | IfcLengthMeasure | IfcNormalisedRatioMeasure | IfcPositiveLengthMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure | null {
    if ( this.LineHeight_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 >| null = 
        this.extractReference( 6, 0, 1, true )

      if ( !( value instanceof IfcDescriptiveMeasure ) && !( value instanceof IfcLengthMeasure ) && !( value instanceof IfcNormalisedRatioMeasure ) && !( value instanceof IfcPositiveLengthMeasure ) && !( value instanceof IfcPositiveRatioMeasure ) && !( value instanceof IfcRatioMeasure ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.LineHeight_ = value as (IfcDescriptiveMeasure | IfcLengthMeasure | IfcNormalisedRatioMeasure | IfcPositiveLengthMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure)

    }

    return this.LineHeight_ as IfcDescriptiveMeasure | IfcLengthMeasure | IfcNormalisedRatioMeasure | IfcPositiveLengthMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcTextStyleTextModel.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcTextStyleTextModel" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCTEXTSTYLETEXTMODEL ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCTEXTSTYLETEXTMODEL
}
