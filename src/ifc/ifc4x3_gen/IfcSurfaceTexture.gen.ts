
import { IfcPresentationItem } from "./index"
import { IfcBoolean } from "./index"
import { IfcIdentifier } from "./index"
import { IfcCartesianTransformationOperator2D } from "./index"
import {
  stepExtractString,
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
export abstract class IfcSurfaceTexture extends IfcPresentationItem {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCSURFACETEXTURE
  }
  private RepeatS_? : boolean
  private RepeatT_? : boolean
  private Mode_? : string | null
  private TextureTransform_? : IfcCartesianTransformationOperator2D | null
  private Parameter_? : Array< string > | null

  public get RepeatS() : boolean {
    if ( this.RepeatS_ === void 0 ) {
      this.RepeatS_ = this.extractBoolean( 0, 0, 1, false )
    }

    return this.RepeatS_ as boolean
  }

  public get RepeatT() : boolean {
    if ( this.RepeatT_ === void 0 ) {
      this.RepeatT_ = this.extractBoolean( 1, 0, 1, false )
    }

    return this.RepeatT_ as boolean
  }

  public get Mode() : string | null {
    if ( this.Mode_ === void 0 ) {
      this.Mode_ = this.extractString( 2, 0, 1, true )
    }

    return this.Mode_ as string | null
  }

  public get TextureTransform() : IfcCartesianTransformationOperator2D | null {
    if ( this.TextureTransform_ === void 0 ) {
      this.TextureTransform_ = this.extractElement( 3, 0, 1, true, IfcCartesianTransformationOperator2D )
    }

    return this.TextureTransform_ as IfcCartesianTransformationOperator2D | null
  }

  public get Parameter() : Array< string > | null {
    if ( this.Parameter_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 4, 0, 1 )
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

      this.Parameter_ = value
    }

    return this.Parameter_ as Array< string > | null
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcSurfaceTexture.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcSurfaceTexture" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCBLOBTEXTURE, EntityTypesIfc4x3.IFCIMAGETEXTURE, EntityTypesIfc4x3.IFCPIXELTEXTURE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCSURFACETEXTURE
}
