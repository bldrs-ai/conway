
import { boolean_expression } from "./index"
import { generic_expression } from "./index"
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
export abstract class multiple_arity_boolean_expression extends boolean_expression {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.MULTIPLE_ARITY_BOOLEAN_EXPRESSION
  }
  private operands_? : Array<generic_expression>

  public get operands() : Array<generic_expression> {
    if ( this.operands_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 0 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<generic_expression> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, generic_expression )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.operands_ = value
    }

    return this.operands_ as Array<generic_expression>
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.AND_EXPRESSION, EntityTypesAP214.OR_EXPRESSION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.MULTIPLE_ARITY_BOOLEAN_EXPRESSION
}
