
import { pair_value } from "./index"
import { screw_pair } from "./index"
import { plane_angle_measure } from "./index"
import { length_measure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/screw_pair_value.htm */
export  class screw_pair_value extends pair_value {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.SCREW_PAIR_VALUE
  }
  private applies_to_pair_? : screw_pair
  private actual_rotation_? : number

  public get applies_to_pair() : screw_pair {
    if ( this.applies_to_pair_ === void 0 ) {
      this.applies_to_pair_ = this.extractElement( 1, false, screw_pair )
    }

    return this.applies_to_pair_ as screw_pair
  }

  public get actual_rotation() : number {
    if ( this.actual_rotation_ === void 0 ) {
      this.actual_rotation_ = this.extractNumber( 2, false )
    }

    return this.actual_rotation_ as number
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.SCREW_PAIR_VALUE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.SCREW_PAIR_VALUE
}