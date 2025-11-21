
import { surface_style_rendering } from "./index"
import { surface_style_reflectance_ambient } from "./index"
import { surface_style_transparent } from "./index"
import {
  stepExtractOptional,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class surface_style_rendering_with_properties extends surface_style_rendering {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.SURFACE_STYLE_RENDERING_WITH_PROPERTIES
  }
  private properties_? : Array<surface_style_reflectance_ambient | surface_style_transparent>

  public get properties() : Array<surface_style_reflectance_ambient | surface_style_transparent> {
    if ( this.properties_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 2, 2, 1 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<surface_style_reflectance_ambient | surface_style_transparent> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesAP214 > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof surface_style_reflectance_ambient ) && !( value1Untyped instanceof surface_style_transparent ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (surface_style_reflectance_ambient | surface_style_transparent)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.properties_ = value
    }

    return this.properties_ as Array<surface_style_reflectance_ambient | surface_style_transparent>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === surface_style_rendering_with_properties.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for surface_style_rendering_with_properties" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.SURFACE_STYLE_RENDERING_WITH_PROPERTIES ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.SURFACE_STYLE_RENDERING_WITH_PROPERTIES
}
