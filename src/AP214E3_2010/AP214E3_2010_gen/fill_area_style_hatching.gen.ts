
import { geometric_representation_item } from "./index"
import { curve_style } from "./index"
import { one_direction_repeat_factor } from "./index"
import { cartesian_point } from "./index"
import { plane_angle_measure } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class fill_area_style_hatching extends geometric_representation_item {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.FILL_AREA_STYLE_HATCHING
  }
  private hatch_line_appearance_? : curve_style
  private start_of_next_hatch_line_? : one_direction_repeat_factor
  private point_of_reference_hatch_line_? : cartesian_point
  private pattern_start_? : cartesian_point
  private hatch_line_angle_? : number

  public get hatch_line_appearance() : curve_style {
    if ( this.hatch_line_appearance_ === void 0 ) {
      this.hatch_line_appearance_ = this.extractElement( 1, 1, 2, false, curve_style )
    }

    return this.hatch_line_appearance_ as curve_style
  }

  public get start_of_next_hatch_line() : one_direction_repeat_factor {
    if ( this.start_of_next_hatch_line_ === void 0 ) {
      this.start_of_next_hatch_line_ = this.extractElement( 2, 1, 2, false, one_direction_repeat_factor )
    }

    return this.start_of_next_hatch_line_ as one_direction_repeat_factor
  }

  public get point_of_reference_hatch_line() : cartesian_point {
    if ( this.point_of_reference_hatch_line_ === void 0 ) {
      this.point_of_reference_hatch_line_ = this.extractElement( 3, 1, 2, false, cartesian_point )
    }

    return this.point_of_reference_hatch_line_ as cartesian_point
  }

  public get pattern_start() : cartesian_point {
    if ( this.pattern_start_ === void 0 ) {
      this.pattern_start_ = this.extractElement( 4, 1, 2, false, cartesian_point )
    }

    return this.pattern_start_ as cartesian_point
  }

  public get hatch_line_angle() : number {
    if ( this.hatch_line_angle_ === void 0 ) {
      this.hatch_line_angle_ = this.extractNumber( 5, 1, 2, false )
    }

    return this.hatch_line_angle_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === fill_area_style_hatching.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for fill_area_style_hatching" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.FILL_AREA_STYLE_HATCHING ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.FILL_AREA_STYLE_HATCHING
}
