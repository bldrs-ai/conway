
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
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcfillareastyle.htm */
export  class IfcFillAreaStyle extends IfcPresentationStyle {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCFILLAREASTYLE
  }
  private FillStyles_? : Array<IfcColourSpecification | IfcPreDefinedColour | IfcExternallyDefinedHatchStyle | IfcFillAreaStyleHatching | IfcFillAreaStyleTiles>
  private ModelorDraughting_? : boolean | null

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
        const value1Untyped : StepEntityBase< EntityTypesIfc > | undefined = 
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

  public get ModelorDraughting() : boolean | null {
    if ( this.ModelorDraughting_ === void 0 ) {
      this.ModelorDraughting_ = this.extractBoolean( 2, 1, 1, true )
    }

    return this.ModelorDraughting_ as boolean | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCFILLAREASTYLE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCFILLAREASTYLE
}
