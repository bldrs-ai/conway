
import { representation_context } from "./index"
import { derived_unit } from "./index"
import { named_unit } from "./index"
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
export  class global_unit_assigned_context extends representation_context {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.GLOBAL_UNIT_ASSIGNED_CONTEXT
  }
  private units_? : Array<derived_unit | named_unit>

  public get units() : Array<derived_unit | named_unit> {
    if ( this.units_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 2 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<derived_unit | named_unit> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesAP214 > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof derived_unit ) && !( value1Untyped instanceof named_unit ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (derived_unit | named_unit)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.units_ = value
    }

    return this.units_ as Array<derived_unit | named_unit>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.GLOBAL_UNIT_ASSIGNED_CONTEXT ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.GLOBAL_UNIT_ASSIGNED_CONTEXT
}
