
import { IfcPresentationStyle } from "./index"
import { IfcSurfaceSide, IfcSurfaceSideDeserializeStep } from "./index"
import { IfcExternallyDefinedSurfaceStyle } from "./index"
import { IfcSurfaceStyleLighting } from "./index"
import { IfcSurfaceStyleRefraction } from "./index"
import { IfcSurfaceStyleShading } from "./index"
import { IfcSurfaceStyleWithTextures } from "./index"
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcsurfacestyle.htm */
export  class IfcSurfaceStyle extends IfcPresentationStyle {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSURFACESTYLE
  }
  private Side_? : IfcSurfaceSide
  private Styles_? : Array<IfcExternallyDefinedSurfaceStyle | IfcSurfaceStyleLighting | IfcSurfaceStyleRefraction | IfcSurfaceStyleShading | IfcSurfaceStyleWithTextures>

  public get Side() : IfcSurfaceSide {
    if ( this.Side_ === void 0 ) {
      this.Side_ = this.extractLambda( 1, 1, 1, IfcSurfaceSideDeserializeStep, false )
    }

    return this.Side_ as IfcSurfaceSide
  }

  public get Styles() : Array<IfcExternallyDefinedSurfaceStyle | IfcSurfaceStyleLighting | IfcSurfaceStyleRefraction | IfcSurfaceStyleShading | IfcSurfaceStyleWithTextures> {
    if ( this.Styles_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 2, 1, 1 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcExternallyDefinedSurfaceStyle | IfcSurfaceStyleLighting | IfcSurfaceStyleRefraction | IfcSurfaceStyleShading | IfcSurfaceStyleWithTextures> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesIfc > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof IfcExternallyDefinedSurfaceStyle ) && !( value1Untyped instanceof IfcSurfaceStyleLighting ) && !( value1Untyped instanceof IfcSurfaceStyleRefraction ) && !( value1Untyped instanceof IfcSurfaceStyleShading ) && !( value1Untyped instanceof IfcSurfaceStyleWithTextures ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (IfcExternallyDefinedSurfaceStyle | IfcSurfaceStyleLighting | IfcSurfaceStyleRefraction | IfcSurfaceStyleShading | IfcSurfaceStyleWithTextures)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.Styles_ = value
    }

    return this.Styles_ as Array<IfcExternallyDefinedSurfaceStyle | IfcSurfaceStyleLighting | IfcSurfaceStyleRefraction | IfcSurfaceStyleShading | IfcSurfaceStyleWithTextures>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSURFACESTYLE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSURFACESTYLE
}
