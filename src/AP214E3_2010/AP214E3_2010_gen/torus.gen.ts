
import { geometric_representation_item } from "./index"
import { axis1_placement } from "./index"
import { positive_length_measure } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class torus extends geometric_representation_item {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.TORUS
  }
  private position_? : axis1_placement
  private major_radius_? : number
  private minor_radius_? : number

  public get position() : axis1_placement {
    if ( this.position_ === void 0 ) {
      this.position_ = this.extractElement( 1, false, axis1_placement )
    }

    return this.position_ as axis1_placement
  }

  public get major_radius() : number {
    if ( this.major_radius_ === void 0 ) {
      this.major_radius_ = this.extractNumber( 2, false )
    }

    return this.major_radius_ as number
  }

  public get minor_radius() : number {
    if ( this.minor_radius_ === void 0 ) {
      this.minor_radius_ = this.extractNumber( 3, false )
    }

    return this.minor_radius_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.TORUS ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.TORUS
}
