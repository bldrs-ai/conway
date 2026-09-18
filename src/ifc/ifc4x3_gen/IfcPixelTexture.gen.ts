
import { IfcSurfaceTexture } from "./index"
import { IfcInteger } from "./index"
import { IfcBinary } from "./index"
import {
  stepExtractOptional,
  stepExtractBinary,
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
export  class IfcPixelTexture extends IfcSurfaceTexture {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCPIXELTEXTURE
  }
  private Width_? : number
  private Height_? : number
  private ColourComponents_? : number
  private Pixel_? : Array< [Uint8Array, number] >

  public get Width() : number {
    if ( this.Width_ === void 0 ) {
      this.Width_ = this.extractNumber( 5, 5, 2, false )
    }

    return this.Width_ as number
  }

  public get Height() : number {
    if ( this.Height_ === void 0 ) {
      this.Height_ = this.extractNumber( 6, 5, 2, false )
    }

    return this.Height_ as number
  }

  public get ColourComponents() : number {
    if ( this.ColourComponents_ === void 0 ) {
      this.ColourComponents_ = this.extractNumber( 7, 5, 2, false )
    }

    return this.ColourComponents_ as number
  }

  public get Pixel() : Array< [Uint8Array, number] > {
    if ( this.Pixel_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 8, 5, 2 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<[Uint8Array, number]> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = stepExtractBinary( buffer, cursor, endCursor )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.Pixel_ = value
    }

    return this.Pixel_ as Array< [Uint8Array, number] >
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcPixelTexture.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcPixelTexture" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCPIXELTEXTURE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCPIXELTEXTURE
}
