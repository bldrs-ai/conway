
import { text_literal } from "./index"
import { curve } from "./index"
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
export  class text_literal_with_associated_curves extends text_literal {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.TEXT_LITERAL_WITH_ASSOCIATED_CURVES
  }
  private associated_curves_? : Array<curve>

  public get associated_curves() : Array<curve> {
    if ( this.associated_curves_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 6, 6, 3 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<curve> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, curve )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.associated_curves_ = value
    }

    return this.associated_curves_ as Array<curve>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === text_literal_with_associated_curves.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for text_literal_with_associated_curves" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.TEXT_LITERAL_WITH_ASSOCIATED_CURVES ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.TEXT_LITERAL_WITH_ASSOCIATED_CURVES
}
