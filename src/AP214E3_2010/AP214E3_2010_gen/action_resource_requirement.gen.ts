
import { label } from "./index"
import { text } from "./index"
import { resource_requirement_type } from "./index"
import { action } from "./index"
import { action_method } from "./index"
import { action_method_relationship } from "./index"
import { action_relationship } from "./index"
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
export  class action_resource_requirement extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.ACTION_RESOURCE_REQUIREMENT
  }
  private name_? : string
  private description_? : string
  private kind_? : resource_requirement_type
  private OPERATIONS_? : Array<action | action_method | action_method_relationship | action_relationship>

  public get name() : string {
    if ( this.name_ === void 0 ) {
      this.name_ = this.extractString( 0, 0, 0, false )
    }

    return this.name_ as string
  }

  public get description() : string {
    if ( this.description_ === void 0 ) {
      this.description_ = this.extractString( 1, 0, 0, false )
    }

    return this.description_ as string
  }

  public get kind() : resource_requirement_type {
    if ( this.kind_ === void 0 ) {
      this.kind_ = this.extractElement( 2, 0, 0, false, resource_requirement_type )
    }

    return this.kind_ as resource_requirement_type
  }

  public get OPERATIONS() : Array<action | action_method | action_method_relationship | action_relationship> {
    if ( this.OPERATIONS_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 3, 0, 0 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<action | action_method | action_method_relationship | action_relationship> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesAP214 > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof action ) && !( value1Untyped instanceof action_method ) && !( value1Untyped instanceof action_method_relationship ) && !( value1Untyped instanceof action_relationship ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (action | action_method | action_method_relationship | action_relationship)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.OPERATIONS_ = value
    }

    return this.OPERATIONS_ as Array<action | action_method | action_method_relationship | action_relationship>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === action_resource_requirement.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for action_resource_requirement" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.ACTION_RESOURCE_REQUIREMENT ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.ACTION_RESOURCE_REQUIREMENT
}
