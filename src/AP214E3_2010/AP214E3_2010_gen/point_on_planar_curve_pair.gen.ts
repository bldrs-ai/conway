
import { kinematic_pair } from "./index"
import { curve } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class point_on_planar_curve_pair extends kinematic_pair {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.POINT_ON_PLANAR_CURVE_PAIR
  }
  private pair_curve_? : curve
  private orientation_? : boolean

  public get pair_curve() : curve {
    if ( this.pair_curve_ === void 0 ) {
      this.pair_curve_ = this.extractElement( 5, 5, 2, false, curve )
    }

    return this.pair_curve_ as curve
  }

  public get orientation() : boolean {
    if ( this.orientation_ === void 0 ) {
      this.orientation_ = this.extractBoolean( 6, 5, 2, false )
    }

    return this.orientation_ as boolean
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === point_on_planar_curve_pair.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for point_on_planar_curve_pair" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.POINT_ON_PLANAR_CURVE_PAIR ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.POINT_ON_PLANAR_CURVE_PAIR
}
