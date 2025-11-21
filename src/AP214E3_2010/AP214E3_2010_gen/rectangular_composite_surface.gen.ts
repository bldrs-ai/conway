
import { bounded_surface } from "./index"
import { surface_patch } from "./index"
import {
  stepExtractOptional,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
  SIZEOF,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class rectangular_composite_surface extends bounded_surface {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.RECTANGULAR_COMPOSITE_SURFACE
  }
  private segments_? : Array<Array<surface_patch>>

  public get segments() : Array<Array<surface_patch>> {
    if ( this.segments_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 1, 1, 4 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<Array<surface_patch>> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 : Array<surface_patch> = []

        let signedCursor1 = stepExtractArrayBegin( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor1 )

        while ( signedCursor1 >= 0 ) {
          const value2 = this.extractBufferElement( buffer, cursor, endCursor, surface_patch )
          if ( value2 === void 0 ) {
            throw new Error( 'Value in STEP was incorrectly typed' )
          }
          cursor = skipValue( buffer, cursor, endCursor )
          value1.push( value2 )
          signedCursor1 = stepExtractArrayToken( buffer, cursor, endCursor )
          cursor = Math.abs( signedCursor1 )
        }
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.segments_ = value
    }

    return this.segments_ as Array<Array<surface_patch>>
  }

  public get n_u() : number {
    return SIZEOF(this?.segments);
  }

  public get n_v() : number {
    return SIZEOF(this?.segments?.[1 - 1]);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === rectangular_composite_surface.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for rectangular_composite_surface" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.RECTANGULAR_COMPOSITE_SURFACE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.RECTANGULAR_COMPOSITE_SURFACE
}
