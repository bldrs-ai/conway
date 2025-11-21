
import { bounded_surface } from "./index"
import { cartesian_point } from "./index"
import { b_spline_surface_form, b_spline_surface_formDeserializeStep } from "./index"
import {
  stepExtractOptional,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
  SIZEOF,
} from '../../step/parsing/step_deserialization_functions'
import {
  make_array_of_array,
} from '../ap214_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class b_spline_surface extends bounded_surface {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.B_SPLINE_SURFACE
  }
  private u_degree_? : number
  private v_degree_? : number
  private control_points_list_? : Array<Array<cartesian_point>>
  private surface_form_? : b_spline_surface_form
  private u_closed_? : boolean
  private v_closed_? : boolean
  private self_intersect_? : boolean

  public get u_degree() : number {
    if ( this.u_degree_ === void 0 ) {
      this.u_degree_ = this.extractNumber( 1, 1, 4, false )
    }

    return this.u_degree_ as number
  }

  public get v_degree() : number {
    if ( this.v_degree_ === void 0 ) {
      this.v_degree_ = this.extractNumber( 2, 1, 4, false )
    }

    return this.v_degree_ as number
  }

  public get control_points_list() : Array<Array<cartesian_point>> {
    if ( this.control_points_list_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 3, 1, 4 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<Array<cartesian_point>> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 : Array<cartesian_point> = []

        let signedCursor1 = stepExtractArrayBegin( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor1 )

        while ( signedCursor1 >= 0 ) {
          const value2 = this.extractBufferElement( buffer, cursor, endCursor, cartesian_point )
          if ( value2 === void 0 ) {
            throw new Error( 'Value in STEP was incorrectly typed' )
          }
          cursor = skipValue( buffer, cursor, endCursor )
          value1.push( value2 )
          signedCursor1 = stepExtractArrayToken( buffer, cursor, endCursor )
          cursor = Math.abs( signedCursor1 )
        }
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.control_points_list_ = value
    }

    return this.control_points_list_ as Array<Array<cartesian_point>>
  }

  public get surface_form() : b_spline_surface_form {
    if ( this.surface_form_ === void 0 ) {
      this.surface_form_ = this.extractLambda( 4, 1, 4, b_spline_surface_formDeserializeStep, false )
    }

    return this.surface_form_ as b_spline_surface_form
  }

  public get u_closed() : boolean {
    if ( this.u_closed_ === void 0 ) {
      this.u_closed_ = this.extractBoolean( 5, 1, 4, false )
    }

    return this.u_closed_ as boolean
  }

  public get v_closed() : boolean {
    if ( this.v_closed_ === void 0 ) {
      this.v_closed_ = this.extractBoolean( 6, 1, 4, false )
    }

    return this.v_closed_ as boolean
  }

  public get self_intersect() : boolean {
    if ( this.self_intersect_ === void 0 ) {
      this.self_intersect_ = this.extractBoolean( 7, 1, 4, false )
    }

    return this.self_intersect_ as boolean
  }

  public get u_upper() : number {
    return SIZEOF(this?.control_points_list)-1;
  }

  public get v_upper() : number {
    return SIZEOF(this?.control_points_list?.[1 - 1])-1;
  }

  public get control_points() : Array<Array<cartesian_point>> {
    return make_array_of_array(this?.control_points_list,0,this?.u_upper,0,this?.v_upper);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === b_spline_surface.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for b_spline_surface" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.B_SPLINE_SURFACE, EntityTypesAP214.B_SPLINE_SURFACE_WITH_KNOTS, EntityTypesAP214.UNIFORM_SURFACE, EntityTypesAP214.QUASI_UNIFORM_SURFACE, EntityTypesAP214.BEZIER_SURFACE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.B_SPLINE_SURFACE
}
