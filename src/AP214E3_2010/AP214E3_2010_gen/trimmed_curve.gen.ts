
import { bounded_curve } from "./index"
import { curve } from "./index"
import { cartesian_point } from "./index"
import { parameter_value } from "./index"
import { trimming_preference, trimming_preferenceDeserializeStep } from "./index"
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
export  class trimmed_curve extends bounded_curve {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.TRIMMED_CURVE
  }
  private basis_curve_? : curve
  private trim_1_? : Array<cartesian_point | parameter_value>
  private trim_2_? : Array<cartesian_point | parameter_value>
  private sense_agreement_? : boolean
  private master_representation_? : trimming_preference

  public get basis_curve() : curve {
    if ( this.basis_curve_ === void 0 ) {
      this.basis_curve_ = this.extractElement( 1, 1, 4, false, curve )
    }

    return this.basis_curve_ as curve
  }

  public get trim_1() : Array<cartesian_point | parameter_value> {
    if ( this.trim_1_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 2, 1, 4 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<cartesian_point | parameter_value> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesAP214 > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof cartesian_point ) && !( value1Untyped instanceof parameter_value ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (cartesian_point | parameter_value)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.trim_1_ = value
    }

    return this.trim_1_ as Array<cartesian_point | parameter_value>
  }

  public get trim_2() : Array<cartesian_point | parameter_value> {
    if ( this.trim_2_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 3, 1, 4 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<cartesian_point | parameter_value> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesAP214 > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof cartesian_point ) && !( value1Untyped instanceof parameter_value ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (cartesian_point | parameter_value)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.trim_2_ = value
    }

    return this.trim_2_ as Array<cartesian_point | parameter_value>
  }

  public get sense_agreement() : boolean {
    if ( this.sense_agreement_ === void 0 ) {
      this.sense_agreement_ = this.extractBoolean( 4, 1, 4, false )
    }

    return this.sense_agreement_ as boolean
  }

  public get master_representation() : trimming_preference {
    if ( this.master_representation_ === void 0 ) {
      this.master_representation_ = this.extractLambda( 5, 1, 4, trimming_preferenceDeserializeStep, false )
    }

    return this.master_representation_ as trimming_preference
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === trimmed_curve.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for trimmed_curve" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.TRIMMED_CURVE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.TRIMMED_CURVE
}
