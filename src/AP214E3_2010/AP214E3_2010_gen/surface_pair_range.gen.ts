
import { simple_pair_range } from "./index"
import { surface_pair } from "./index"
import { rectangular_trimmed_surface } from "./index"
import { plane_angle_measure } from "./index"
import { unlimited_range, unlimited_rangeDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class surface_pair_range extends simple_pair_range {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.SURFACE_PAIR_RANGE
  }
  private range_on_surface_1_? : rectangular_trimmed_surface
  private range_on_surface_2_? : rectangular_trimmed_surface
  private lower_limit_actual_rotation_? : plane_angle_measure | unlimited_range
  private upper_limit_actual_rotation_? : plane_angle_measure | unlimited_range


  public get range_on_surface_1() : rectangular_trimmed_surface {
    if ( this.range_on_surface_1_ === void 0 ) {
      this.range_on_surface_1_ = this.extractElement( 2, 1, 1, false, rectangular_trimmed_surface )
    }

    return this.range_on_surface_1_ as rectangular_trimmed_surface
  }

  public get range_on_surface_2() : rectangular_trimmed_surface {
    if ( this.range_on_surface_2_ === void 0 ) {
      this.range_on_surface_2_ = this.extractElement( 3, 1, 1, false, rectangular_trimmed_surface )
    }

    return this.range_on_surface_2_ as rectangular_trimmed_surface
  }

  public get lower_limit_actual_rotation() : plane_angle_measure | unlimited_range {
    if ( this.lower_limit_actual_rotation_ === void 0 ) {
      
      const enumValue : unlimited_range | null =
        this.extractLambda( 4, 1, 1, unlimited_rangeDeserializeStep, true )
      const value : StepEntityBase< EntityTypesAP214 > | unlimited_range = enumValue ?? 
        this.extractReference( 4, 1, 1, false )

      if ( enumValue === null && !( value instanceof plane_angle_measure ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.lower_limit_actual_rotation_ = value as (plane_angle_measure | unlimited_range)

    }

    return this.lower_limit_actual_rotation_ as plane_angle_measure | unlimited_range
  }

  public get upper_limit_actual_rotation() : plane_angle_measure | unlimited_range {
    if ( this.upper_limit_actual_rotation_ === void 0 ) {
      
      const enumValue : unlimited_range | null =
        this.extractLambda( 5, 1, 1, unlimited_rangeDeserializeStep, true )
      const value : StepEntityBase< EntityTypesAP214 > | unlimited_range = enumValue ?? 
        this.extractReference( 5, 1, 1, false )

      if ( enumValue === null && !( value instanceof plane_angle_measure ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.upper_limit_actual_rotation_ = value as (plane_angle_measure | unlimited_range)

    }

    return this.upper_limit_actual_rotation_ as plane_angle_measure | unlimited_range
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === surface_pair_range.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for surface_pair_range" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.SURFACE_PAIR_RANGE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.SURFACE_PAIR_RANGE
}
