
import { mechanism } from "./index"
import { interpolated_configuration_sequence } from "./index"
import { resulting_path } from "./index"
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
export  class kinematic_analysis_result extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.KINEMATIC_ANALYSIS_RESULT
  }
  private analysed_mechanism_? : mechanism
  private contained_kinematic_results_? : Array<interpolated_configuration_sequence | resulting_path>

  public get analysed_mechanism() : mechanism {
    if ( this.analysed_mechanism_ === void 0 ) {
      this.analysed_mechanism_ = this.extractElement( 0, 0, 0, false, mechanism )
    }

    return this.analysed_mechanism_ as mechanism
  }

  public get contained_kinematic_results() : Array<interpolated_configuration_sequence | resulting_path> {
    if ( this.contained_kinematic_results_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 1, 0, 0 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<interpolated_configuration_sequence | resulting_path> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesAP214 > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof interpolated_configuration_sequence ) && !( value1Untyped instanceof resulting_path ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (interpolated_configuration_sequence | resulting_path)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.contained_kinematic_results_ = value
    }

    return this.contained_kinematic_results_ as Array<interpolated_configuration_sequence | resulting_path>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === kinematic_analysis_result.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for kinematic_analysis_result" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.KINEMATIC_ANALYSIS_RESULT ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.KINEMATIC_ANALYSIS_RESULT
}
