
import { b_spline_curve } from "./index"
import { parameter_value } from "./index"
import { knot_type, knot_typeDeserializeStep } from "./index"
import {
  stepExtractOptional,
  stepExtractNumber,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
  SIZEOF,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class b_spline_curve_with_knots extends b_spline_curve {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.B_SPLINE_CURVE_WITH_KNOTS
  }
  private knot_multiplicities_? : Array<number>
  private knots_? : Array< number >
  private knot_spec_? : knot_type

  public get knot_multiplicities() : Array<number> {
    if ( this.knot_multiplicities_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 6, 6, 5 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<number> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = stepExtractNumber( buffer, cursor, endCursor )

        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.knot_multiplicities_ = value
    }

    return this.knot_multiplicities_ as Array<number>
  }

  public get knots() : Array< number > {
    if ( this.knots_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 7, 6, 5 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<number> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = stepExtractNumber( buffer, cursor, endCursor )

        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.knots_ = value
    }

    return this.knots_ as Array< number >
  }

  public get knot_spec() : knot_type {
    if ( this.knot_spec_ === void 0 ) {
      this.knot_spec_ = this.extractLambda( 8, 6, 5, knot_typeDeserializeStep, false )
    }

    return this.knot_spec_ as knot_type
  }

  public get upper_index_on_knots() : number {
    return SIZEOF(this?.knots);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === b_spline_curve_with_knots.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for b_spline_curve_with_knots" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.B_SPLINE_CURVE_WITH_KNOTS ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.B_SPLINE_CURVE_WITH_KNOTS
}
