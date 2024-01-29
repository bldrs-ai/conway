
import { swept_area_solid } from "./index"
import { direction } from "./index"
import { positive_length_measure } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class extruded_area_solid extends swept_area_solid {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.EXTRUDED_AREA_SOLID
  }
  private extruded_direction_? : direction
  private depth_? : number

  public get extruded_direction() : direction {
    if ( this.extruded_direction_ === void 0 ) {
      this.extruded_direction_ = this.extractElement( 2, false, direction )
    }

    return this.extruded_direction_ as direction
  }

  public get depth() : number {
    if ( this.depth_ === void 0 ) {
      this.depth_ = this.extractNumber( 3, false )
    }

    return this.depth_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.EXTRUDED_AREA_SOLID ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.EXTRUDED_AREA_SOLID
}
