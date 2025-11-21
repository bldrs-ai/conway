
import { simple_pair_range } from "./index"
import { planar_curve_pair } from "./index"
import { trimmed_curve } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class planar_curve_pair_range extends simple_pair_range {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.PLANAR_CURVE_PAIR_RANGE
  }
  private range_on_curve_1_? : trimmed_curve
  private range_on_curve_2_? : trimmed_curve


  public get range_on_curve_1() : trimmed_curve {
    if ( this.range_on_curve_1_ === void 0 ) {
      this.range_on_curve_1_ = this.extractElement( 2, 1, 1, false, trimmed_curve )
    }

    return this.range_on_curve_1_ as trimmed_curve
  }

  public get range_on_curve_2() : trimmed_curve {
    if ( this.range_on_curve_2_ === void 0 ) {
      this.range_on_curve_2_ = this.extractElement( 3, 1, 1, false, trimmed_curve )
    }

    return this.range_on_curve_2_ as trimmed_curve
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === planar_curve_pair_range.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for planar_curve_pair_range" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.PLANAR_CURVE_PAIR_RANGE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.PLANAR_CURVE_PAIR_RANGE
}
