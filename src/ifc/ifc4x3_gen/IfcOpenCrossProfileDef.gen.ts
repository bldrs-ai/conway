
import { IfcProfileDef } from "./index"
import { IfcBoolean } from "./index"
import { IfcNonNegativeLengthMeasure } from "./index"
import { IfcPlaneAngleMeasure } from "./index"
import { IfcLabel } from "./index"
import { IfcCartesianPoint } from "./index"
import {
  stepExtractString,
  stepExtractOptional,
  stepExtractNumber,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcOpenCrossProfileDef extends IfcProfileDef {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCOPENCROSSPROFILEDEF
  }
  private HorizontalWidths_? : boolean
  private Widths_? : Array< number >
  private Slopes_? : Array< number >
  private Tags_? : Array< string > | null
  private OffsetPoint_? : IfcCartesianPoint | null

  public get HorizontalWidths() : boolean {
    if ( this.HorizontalWidths_ === void 0 ) {
      this.HorizontalWidths_ = this.extractBoolean( 2, 2, 1, false )
    }

    return this.HorizontalWidths_ as boolean
  }

  public get Widths() : Array< number > {
    if ( this.Widths_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 3, 2, 1 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<number> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = stepExtractNumber( buffer, cursor, endCursor )

        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.Widths_ = value
    }

    return this.Widths_ as Array< number >
  }

  public get Slopes() : Array< number > {
    if ( this.Slopes_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 4, 2, 1 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<number> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = stepExtractNumber( buffer, cursor, endCursor )

        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.Slopes_ = value
    }

    return this.Slopes_ as Array< number >
  }

  public get Tags() : Array< string > | null {
    if ( this.Tags_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 5, 2, 1 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return null
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

      this.Tags_ = value
    }

    return this.Tags_ as Array< string > | null
  }

  public get OffsetPoint() : IfcCartesianPoint | null {
    if ( this.OffsetPoint_ === void 0 ) {
      this.OffsetPoint_ = this.extractElement( 6, 2, 1, true, IfcCartesianPoint )
    }

    return this.OffsetPoint_ as IfcCartesianPoint | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcOpenCrossProfileDef.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcOpenCrossProfileDef" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCOPENCROSSPROFILEDEF ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCOPENCROSSPROFILEDEF
}
