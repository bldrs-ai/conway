
import { label } from "./index"
import { text } from "./index"
import { action_directive } from "./index"
import { action } from "./index"
import { action_method } from "./index"
import { action_resource_type } from "./index"
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
export  class action_resource extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.ACTION_RESOURCE
  }
  private name_? : string
  private description_? : string | null
  private usage_? : Array<action_directive | action | action_method>
  private kind_? : action_resource_type

  public get name() : string {
    if ( this.name_ === void 0 ) {
      this.name_ = this.extractString( 0, false )
    }

    return this.name_ as string
  }

  public get description() : string | null {
    if ( this.description_ === void 0 ) {
      this.description_ = this.extractString( 1, true )
    }

    return this.description_ as string | null
  }

  public get usage() : Array<action_directive | action | action_method> {
    if ( this.usage_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 2 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<action_directive | action | action_method> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesAP214 > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof action_directive ) && !( value1Untyped instanceof action ) && !( value1Untyped instanceof action_method ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (action_directive | action | action_method)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.usage_ = value
    }

    return this.usage_ as Array<action_directive | action | action_method>
  }

  public get kind() : action_resource_type {
    if ( this.kind_ === void 0 ) {
      this.kind_ = this.extractElement( 3, false, action_resource_type )
    }

    return this.kind_ as action_resource_type
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.ACTION_RESOURCE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.ACTION_RESOURCE
}
