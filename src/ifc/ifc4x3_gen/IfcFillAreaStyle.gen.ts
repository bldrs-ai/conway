
import { IfcPresentationStyle } from "./index"
import { IfcColourSpecification } from "./index"
import { IfcPreDefinedColour } from "./index"
import { IfcExternallyDefinedHatchStyle } from "./index"
import { IfcFillAreaStyleHatching } from "./index"
import { IfcFillAreaStyleTiles } from "./index"
import { IfcBoolean } from "./index"
import {
  stepExtractOptional,
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
export  class IfcFillAreaStyle extends IfcPresentationStyle {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCFILLAREASTYLE
  }
  private FillStyles_? : Array<IfcColourSpecification | IfcPreDefinedColour | IfcExternallyDefinedHatchStyle | IfcFillAreaStyleHatching | IfcFillAreaStyleTiles>
  private ModelOrDraughting_? : boolean | null

  public get FillStyles() : Array<IfcColourSpecification | IfcPreDefinedColour | IfcExternallyDefinedHatchStyle | IfcFillAreaStyleHatching | IfcFillAreaStyleTiles> {
    if ( this.FillStyles_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 1, 1, 1 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcColourSpecification | IfcPreDefinedColour | IfcExternallyDefinedHatchStyle | IfcFillAreaStyleHatching | IfcFillAreaStyleTiles> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesIfc4x3 > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof IfcColourSpecification ) && !( value1Untyped instanceof IfcPreDefinedColour ) && !( value1Untyped instanceof IfcExternallyDefinedHatchStyle ) && !( value1Untyped instanceof IfcFillAreaStyleHatching ) && !( value1Untyped instanceof IfcFillAreaStyleTiles ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (IfcColourSpecification | IfcPreDefinedColour | IfcExternallyDefinedHatchStyle | IfcFillAreaStyleHatching | IfcFillAreaStyleTiles)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.FillStyles_ = value
    }

    return this.FillStyles_ as Array<IfcColourSpecification | IfcPreDefinedColour | IfcExternallyDefinedHatchStyle | IfcFillAreaStyleHatching | IfcFillAreaStyleTiles>
  }

  public get ModelOrDraughting() : boolean | null {
    if ( this.ModelOrDraughting_ === void 0 ) {
      this.ModelOrDraughting_ = this.extractBoolean( 2, 1, 1, true )
    }

    return this.ModelOrDraughting_ as boolean | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcFillAreaStyle.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcFillAreaStyle" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCFILLAREASTYLE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCFILLAREASTYLE
}
