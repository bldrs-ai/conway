
import { pair_value } from "./index"
import { point_on_planar_curve_pair } from "./index"
import { point_on_curve } from "./index"
import { ypr_rotation } from "./index"
import { rotation_about_direction } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class point_on_planar_curve_pair_value extends pair_value {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.POINT_ON_PLANAR_CURVE_PAIR_VALUE
  }
  private actual_point_on_curve_? : point_on_curve
  private input_orientation_? : ypr_rotation | rotation_about_direction


  public get actual_point_on_curve() : point_on_curve {
    if ( this.actual_point_on_curve_ === void 0 ) {
      this.actual_point_on_curve_ = this.extractElement( 2, false, point_on_curve )
    }

    return this.actual_point_on_curve_ as point_on_curve
  }

  public get input_orientation() : ypr_rotation | rotation_about_direction {
    if ( this.input_orientation_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 3, false )

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
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.POINT_ON_PLANAR_CURVE_PAIR_VALUE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.POINT_ON_PLANAR_CURVE_PAIR_VALUE
}
