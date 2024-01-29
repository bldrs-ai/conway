
import { kinematic_pair } from "./index"
import { curve } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class planar_curve_pair extends kinematic_pair {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.PLANAR_CURVE_PAIR
  }
  private curve_1_? : curve
  private curve_2_? : curve
  private orientation_? : boolean

  public get curve_1() : curve {
    if ( this.curve_1_ === void 0 ) {
      this.curve_1_ = this.extractElement( 5, false, curve )
    }

    return this.curve_1_ as curve
  }

  public get curve_2() : curve {
    if ( this.curve_2_ === void 0 ) {
      this.curve_2_ = this.extractElement( 6, false, curve )
    }

    return this.curve_2_ as curve
  }

  public get orientation() : boolean {
    if ( this.orientation_ === void 0 ) {
      this.orientation_ = this.extractBoolean( 7, false )
    }

    return this.orientation_ as boolean
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.PLANAR_CURVE_PAIR ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.PLANAR_CURVE_PAIR
}
