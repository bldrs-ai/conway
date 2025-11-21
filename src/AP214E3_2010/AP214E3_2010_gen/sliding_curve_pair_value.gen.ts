
import { pair_value } from "./index"
import { sliding_curve_pair } from "./index"
import { point_on_curve } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class sliding_curve_pair_value extends pair_value {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.SLIDING_CURVE_PAIR_VALUE
  }
  private actual_point_on_curve_1_? : point_on_curve
  private actual_point_on_curve_2_? : point_on_curve


  public get actual_point_on_curve_1() : point_on_curve {
    if ( this.actual_point_on_curve_1_ === void 0 ) {
      this.actual_point_on_curve_1_ = this.extractElement( 2, 1, 1, false, point_on_curve )
    }

    return this.actual_point_on_curve_1_ as point_on_curve
  }

  public get actual_point_on_curve_2() : point_on_curve {
    if ( this.actual_point_on_curve_2_ === void 0 ) {
      this.actual_point_on_curve_2_ = this.extractElement( 3, 1, 1, false, point_on_curve )
    }

    return this.actual_point_on_curve_2_ as point_on_curve
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === sliding_curve_pair_value.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for sliding_curve_pair_value" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.SLIDING_CURVE_PAIR_VALUE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.SLIDING_CURVE_PAIR_VALUE
}
