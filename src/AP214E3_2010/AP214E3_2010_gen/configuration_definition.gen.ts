
import { pair_value } from "./index"
import { parameter_value } from "./index"
import { measure_with_unit } from "./index"
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
export  class configuration_definition extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.CONFIGURATION_DEFINITION
  }
  private pair_values_? : Array<pair_value>
  private t_parameter_? : parameter_value | measure_with_unit

  public get pair_values() : Array<pair_value> {
    if ( this.pair_values_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 0, 0, 0 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<pair_value> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, pair_value )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.pair_values_ = value
    }

    return this.pair_values_ as Array<pair_value>
  }

  public get t_parameter() : parameter_value | measure_with_unit {
    if ( this.t_parameter_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 1, 0, 0, false )

      if ( !( value instanceof parameter_value ) && !( value instanceof measure_with_unit ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.t_parameter_ = value as (parameter_value | measure_with_unit)

    }

    return this.t_parameter_ as parameter_value | measure_with_unit
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === configuration_definition.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for configuration_definition" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.CONFIGURATION_DEFINITION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.CONFIGURATION_DEFINITION
}
