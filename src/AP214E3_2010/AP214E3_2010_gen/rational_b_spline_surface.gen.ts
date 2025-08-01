
import { b_spline_surface } from "./index"
import {
  stepExtractOptional,
  stepExtractNumber,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
} from '../../step/parsing/step_deserialization_functions'
import {
  make_array_of_array,
} from '../ap214_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class rational_b_spline_surface extends b_spline_surface {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.RATIONAL_B_SPLINE_SURFACE
  }
  private weights_data_? : Array<Array<number>>

  public get weights_data() : Array<Array<number>> {
    if ( this.weights_data_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 8, 8, 5 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<Array<number>> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 : Array<number> = []

        let signedCursor1 = stepExtractArrayBegin( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor1 )

        while ( signedCursor1 >= 0 ) {
          const value2 = stepExtractNumber( buffer, cursor, endCursor )

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

      this.weights_data_ = value
    }

    return this.weights_data_ as Array<Array<number>>
  }

  public get weights() : Array<Array<number>> {
    return make_array_of_array(this?.weights_data,0,this?.u_upper,0,this?.v_upper);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === rational_b_spline_surface.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for rational_b_spline_surface" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.RATIONAL_B_SPLINE_SURFACE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.RATIONAL_B_SPLINE_SURFACE
}
