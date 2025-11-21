
import { pair_value } from "./index"
import { point_on_surface_pair } from "./index"
import { point_on_surface } from "./index"
import { ypr_rotation } from "./index"
import { rotation_about_direction } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class point_on_surface_pair_value extends pair_value {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.POINT_ON_SURFACE_PAIR_VALUE
  }
  private actual_point_on_surface_? : point_on_surface
  private input_orientation_? : ypr_rotation | rotation_about_direction


  public get actual_point_on_surface() : point_on_surface {
    if ( this.actual_point_on_surface_ === void 0 ) {
      this.actual_point_on_surface_ = this.extractElement( 2, 1, 1, false, point_on_surface )
    }

    return this.actual_point_on_surface_ as point_on_surface
  }

  public get input_orientation() : ypr_rotation | rotation_about_direction {
    if ( this.input_orientation_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 3, 1, 1, false )

      if ( !( value instanceof ypr_rotation ) && !( value instanceof rotation_about_direction ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.input_orientation_ = value as (ypr_rotation | rotation_about_direction)

    }

    return this.input_orientation_ as ypr_rotation | rotation_about_direction
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === point_on_surface_pair_value.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for point_on_surface_pair_value" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.POINT_ON_SURFACE_PAIR_VALUE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.POINT_ON_SURFACE_PAIR_VALUE
}
