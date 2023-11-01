
import { founded_item } from "./index"
import { central_or_parallel, central_or_parallelDeserializeStep } from "./index"
import { cartesian_point } from "./index"
import { length_measure } from "./index"
import { planar_box } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/view_volume.htm */
export  class view_volume extends founded_item {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.VIEW_VOLUME
  }
  private projection_type_? : central_or_parallel
  private projection_point_? : cartesian_point
  private view_plane_distance_? : number
  private front_plane_distance_? : number
  private front_plane_clipping_? : boolean
  private back_plane_distance_? : number
  private back_plane_clipping_? : boolean
  private view_volume_sides_clipping_? : boolean
  private view_window_? : planar_box

  public get projection_type() : central_or_parallel {
    if ( this.projection_type_ === void 0 ) {
      this.projection_type_ = this.extractLambda( 0, central_or_parallelDeserializeStep, false )
    }

    return this.projection_type_ as central_or_parallel
  }

  public get projection_point() : cartesian_point {
    if ( this.projection_point_ === void 0 ) {
      this.projection_point_ = this.extractElement( 1, false, cartesian_point )
    }

    return this.projection_point_ as cartesian_point
  }

  public get view_plane_distance() : number {
    if ( this.view_plane_distance_ === void 0 ) {
      this.view_plane_distance_ = this.extractNumber( 2, false )
    }

    return this.view_plane_distance_ as number
  }

  public get front_plane_distance() : number {
    if ( this.front_plane_distance_ === void 0 ) {
      this.front_plane_distance_ = this.extractNumber( 3, false )
    }

    return this.front_plane_distance_ as number
  }

  public get front_plane_clipping() : boolean {
    if ( this.front_plane_clipping_ === void 0 ) {
      this.front_plane_clipping_ = this.extractBoolean( 4, false )
    }

    return this.front_plane_clipping_ as boolean
  }

  public get back_plane_distance() : number {
    if ( this.back_plane_distance_ === void 0 ) {
      this.back_plane_distance_ = this.extractNumber( 5, false )
    }

    return this.back_plane_distance_ as number
  }

  public get back_plane_clipping() : boolean {
    if ( this.back_plane_clipping_ === void 0 ) {
      this.back_plane_clipping_ = this.extractBoolean( 6, false )
    }

    return this.back_plane_clipping_ as boolean
  }

  public get view_volume_sides_clipping() : boolean {
    if ( this.view_volume_sides_clipping_ === void 0 ) {
      this.view_volume_sides_clipping_ = this.extractBoolean( 7, false )
    }

    return this.view_volume_sides_clipping_ as boolean
  }

  public get view_window() : planar_box {
    if ( this.view_window_ === void 0 ) {
      this.view_window_ = this.extractElement( 8, false, planar_box )
    }

    return this.view_window_ as planar_box
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.VIEW_VOLUME ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.VIEW_VOLUME
}
