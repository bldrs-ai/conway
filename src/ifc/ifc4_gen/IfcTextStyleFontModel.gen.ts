
import { IfcPreDefinedTextFont } from "./index"
import { IfcTextFontName } from "./index"
import { IfcFontStyle } from "./index"
import { IfcFontVariant } from "./index"
import { IfcFontWeight } from "./index"
import { IfcDescriptiveMeasure } from "./index"
import { IfcLengthMeasure } from "./index"
import { IfcNormalisedRatioMeasure } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcPositiveRatioMeasure } from "./index"
import { IfcRatioMeasure } from "./index"
import {
  stepExtractString,
  stepExtractOptional,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifctextstylefontmodel.htm */
export  class IfcTextStyleFontModel extends IfcPreDefinedTextFont {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCTEXTSTYLEFONTMODEL
  }
  private FontFamily_? : Array< string >
  private FontStyle_? : string | null
  private FontVariant_? : string | null
  private FontWeight_? : string | null
  private FontSize_? : IfcDescriptiveMeasure | IfcLengthMeasure | IfcNormalisedRatioMeasure | IfcPositiveLengthMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure

  public get FontFamily() : Array< string > {
    if ( this.FontFamily_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 1, 1, 3 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<string> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = stepExtractString( buffer, cursor, endCursor )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.FontFamily_ = value
    }

    return this.FontFamily_ as Array< string >
  }

  public get FontStyle() : string | null {
    if ( this.FontStyle_ === void 0 ) {
      this.FontStyle_ = this.extractString( 2, 1, 3, true )
    }

    return this.FontStyle_ as string | null
  }

  public get FontVariant() : string | null {
    if ( this.FontVariant_ === void 0 ) {
      this.FontVariant_ = this.extractString( 3, 1, 3, true )
    }

    return this.FontVariant_ as string | null
  }

  public get FontWeight() : string | null {
    if ( this.FontWeight_ === void 0 ) {
      this.FontWeight_ = this.extractString( 4, 1, 3, true )
    }

    return this.FontWeight_ as string | null
  }

  public get FontSize() : IfcDescriptiveMeasure | IfcLengthMeasure | IfcNormalisedRatioMeasure | IfcPositiveLengthMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure {
    if ( this.FontSize_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc > = 
        this.extractReference( 5, 1, 3, false )

      if ( !( value instanceof IfcDescriptiveMeasure ) && !( value instanceof IfcLengthMeasure ) && !( value instanceof IfcNormalisedRatioMeasure ) && !( value instanceof IfcPositiveLengthMeasure ) && !( value instanceof IfcPositiveRatioMeasure ) && !( value instanceof IfcRatioMeasure ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.FontSize_ = value as (IfcDescriptiveMeasure | IfcLengthMeasure | IfcNormalisedRatioMeasure | IfcPositiveLengthMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure)

    }

    return this.FontSize_ as IfcDescriptiveMeasure | IfcLengthMeasure | IfcNormalisedRatioMeasure | IfcPositiveLengthMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCTEXTSTYLEFONTMODEL ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCTEXTSTYLEFONTMODEL
}
