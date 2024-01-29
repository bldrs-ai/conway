
import { elementary_surface } from "./index"
import { length_measure } from "./index"
import { plane_angle_measure } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class conical_surface extends elementary_surface {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.CONICAL_SURFACE
  }
  private radius_? : number
  private semi_angle_? : number

  public get radius() : number {
    if ( this.radius_ === void 0 ) {
      this.radius_ = this.extractNumber( 2, false )
    }

    return this.radius_ as number
  }

  public get semi_angle() : number {
    if ( this.semi_angle_ === void 0 ) {
      this.semi_angle_ = this.extractNumber( 3, false )
    }

    return this.semi_angle_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.CONICAL_SURFACE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.CONICAL_SURFACE
}
