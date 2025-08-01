
/* This is generated code, don't alter */
import {
  stepExtractOptional,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
} from '../../step/parsing/step_deserialization_functions'
import { representation_item } from "./index"

import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'


///**
// *  */
export class set_representation_item extends StepEntityBase< EntityTypesAP214 > {    
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.SET_REPRESENTATION_ITEM
  }

  private Value_? : Array<representation_item>;

  public get Value() : Array<representation_item> {
    if ( this.Value_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 0, 0, 0 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<representation_item> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, representation_item )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.Value_ = value
    }

    return this.Value_ as Array<representation_item>
  }

  constructor(
      localID: number,
      internalReference: StepEntityInternalReference< EntityTypesAP214 >,
      model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
      multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {
     super( localID, internalReference, model )
  }

  public static readonly query =
    [ EntityTypesAP214.SET_REPRESENTATION_ITEM ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.SET_REPRESENTATION_ITEM
}
