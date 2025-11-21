
import { pair_value } from "./index"
import { rolling_surface_pair } from "./index"
import { point_on_surface } from "./index"
import { plane_angle_measure } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class rolling_surface_pair_value extends pair_value {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.ROLLING_SURFACE_PAIR_VALUE
  }
  private actual_point_on_surface_? : point_on_surface
  private actual_rotation_? : number


  public get actual_point_on_surface() : point_on_surface {
    if ( this.actual_point_on_surface_ === void 0 ) {
      this.actual_point_on_surface_ = this.extractElement( 2, 1, 1, false, point_on_surface )
    }

    return this.actual_point_on_surface_ as point_on_surface
  }

  public get actual_rotation() : number {
    if ( this.actual_rotation_ === void 0 ) {
      this.actual_rotation_ = this.extractNumber( 3, 1, 1, false )
    }

    return this.actual_rotation_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === rolling_surface_pair_value.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for rolling_surface_pair_value" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.ROLLING_SURFACE_PAIR_VALUE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.ROLLING_SURFACE_PAIR_VALUE
}
