
import { IfcPresentationStyle } from "./index"
import { IfcCurveStyleFontAndScaling } from "./index"
import { IfcCurveStyleFont } from "./index"
import { IfcPreDefinedCurveFont } from "./index"
import { IfcDescriptiveMeasure } from "./index"
import { IfcLengthMeasure } from "./index"
import { IfcNormalisedRatioMeasure } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcPositiveRatioMeasure } from "./index"
import { IfcRatioMeasure } from "./index"
import { IfcColourSpecification } from "./index"
import { IfcPreDefinedColour } from "./index"
import { IfcBoolean } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccurvestyle.htm */
export  class IfcCurveStyle extends IfcPresentationStyle {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCURVESTYLE
  }
  private CurveFont_? : IfcCurveStyleFontAndScaling | IfcCurveStyleFont | IfcPreDefinedCurveFont | null
  private CurveWidth_? : IfcDescriptiveMeasure | IfcLengthMeasure | IfcNormalisedRatioMeasure | IfcPositiveLengthMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure | null
  private CurveColour_? : IfcColourSpecification | IfcPreDefinedColour | null
  private ModelOrDraughting_? : boolean | null

  public get CurveFont() : IfcCurveStyleFontAndScaling | IfcCurveStyleFont | IfcPreDefinedCurveFont | null {
    if ( this.CurveFont_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc >| null = 
        this.extractReference( 1, 1, 1, true )

      if ( !( value instanceof IfcCurveStyleFontAndScaling ) && !( value instanceof IfcCurveStyleFont ) && !( value instanceof IfcPreDefinedCurveFont ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.CurveFont_ = value as (IfcCurveStyleFontAndScaling | IfcCurveStyleFont | IfcPreDefinedCurveFont)

    }

    return this.CurveFont_ as IfcCurveStyleFontAndScaling | IfcCurveStyleFont | IfcPreDefinedCurveFont | null
  }

  public get CurveWidth() : IfcDescriptiveMeasure | IfcLengthMeasure | IfcNormalisedRatioMeasure | IfcPositiveLengthMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure | null {
    if ( this.CurveWidth_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc >| null = 
        this.extractReference( 2, 1, 1, true )

      if ( !( value instanceof IfcDescriptiveMeasure ) && !( value instanceof IfcLengthMeasure ) && !( value instanceof IfcNormalisedRatioMeasure ) && !( value instanceof IfcPositiveLengthMeasure ) && !( value instanceof IfcPositiveRatioMeasure ) && !( value instanceof IfcRatioMeasure ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.CurveWidth_ = value as (IfcDescriptiveMeasure | IfcLengthMeasure | IfcNormalisedRatioMeasure | IfcPositiveLengthMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure)

    }

    return this.CurveWidth_ as IfcDescriptiveMeasure | IfcLengthMeasure | IfcNormalisedRatioMeasure | IfcPositiveLengthMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure | null
  }

  public get CurveColour() : IfcColourSpecification | IfcPreDefinedColour | null {
    if ( this.CurveColour_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc >| null = 
        this.extractReference( 3, 1, 1, true )

      if ( !( value instanceof IfcColourSpecification ) && !( value instanceof IfcPreDefinedColour ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.CurveColour_ = value as (IfcColourSpecification | IfcPreDefinedColour)

    }

    return this.CurveColour_ as IfcColourSpecification | IfcPreDefinedColour | null
  }

  public get ModelOrDraughting() : boolean | null {
    if ( this.ModelOrDraughting_ === void 0 ) {
      this.ModelOrDraughting_ = this.extractBoolean( 4, 1, 1, true )
    }

    return this.ModelOrDraughting_ as boolean | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCURVESTYLE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCURVESTYLE
}
