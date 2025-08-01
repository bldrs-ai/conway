
import { bounded_curve } from "./index"
import { cartesian_point } from "./index"
import { b_spline_curve_form, b_spline_curve_formDeserializeStep } from "./index"
import {
  stepExtractOptional,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
  SIZEOF,
} from '../../step/parsing/step_deserialization_functions'
import {
  list_to_array,
} from '../ap214_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class b_spline_curve extends bounded_curve {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.B_SPLINE_CURVE
  }
  private degree_? : number
  private control_points_list_? : Array<cartesian_point>
  private curve_form_? : b_spline_curve_form
  private closed_curve_? : boolean
  private self_intersect_? : boolean

  public get degree() : number {
    if ( this.degree_ === void 0 ) {
      this.degree_ = this.extractNumber( 1, 1, 4, false )
    }

    return this.degree_ as number
  }

  public get control_points_list() : Array<cartesian_point> {
    if ( this.control_points_list_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 2, 1, 4 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<cartesian_point> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, cartesian_point )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.control_points_list_ = value
    }

    return this.control_points_list_ as Array<cartesian_point>
  }

  public get curve_form() : b_spline_curve_form {
    if ( this.curve_form_ === void 0 ) {
      this.curve_form_ = this.extractLambda( 3, 1, 4, b_spline_curve_formDeserializeStep, false )
    }

    return this.curve_form_ as b_spline_curve_form
  }

  public get closed_curve() : boolean {
    if ( this.closed_curve_ === void 0 ) {
      this.closed_curve_ = this.extractBoolean( 4, 1, 4, false )
    }

    return this.closed_curve_ as boolean
  }

  public get self_intersect() : boolean {
    if ( this.self_intersect_ === void 0 ) {
      this.self_intersect_ = this.extractBoolean( 5, 1, 4, false )
    }

    return this.self_intersect_ as boolean
  }

  public get upper_index_on_control_points() : number {
    return SIZEOF(this?.control_points_list)-1;
  }

  public get control_points() : Array<cartesian_point> {
    return list_to_array(this?.control_points_list,0,this?.upper_index_on_control_points);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === b_spline_curve.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for b_spline_curve" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.B_SPLINE_CURVE, EntityTypesAP214.UNIFORM_CURVE, EntityTypesAP214.B_SPLINE_CURVE_WITH_KNOTS, EntityTypesAP214.QUASI_UNIFORM_CURVE, EntityTypesAP214.BEZIER_CURVE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.B_SPLINE_CURVE
}
