
import { pair_value } from "./index"
import { cylindrical_pair } from "./index"
import { length_measure } from "./index"
import { plane_angle_measure } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class cylindrical_pair_value extends pair_value {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.CYLINDRICAL_PAIR_VALUE
  }
  private actual_translation_? : number
  private actual_rotation_? : number


  public get actual_translation() : number {
    if ( this.actual_translation_ === void 0 ) {
      this.actual_translation_ = this.extractNumber( 2, false )
    }

    return this.actual_translation_ as number
  }

  public get actual_rotation() : number {
    if ( this.actual_rotation_ === void 0 ) {
      this.actual_rotation_ = this.extractNumber( 3, false )
    }

    return this.actual_rotation_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.CYLINDRICAL_PAIR_VALUE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.CYLINDRICAL_PAIR_VALUE
}
