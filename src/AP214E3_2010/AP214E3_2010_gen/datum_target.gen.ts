
import { shape_aspect } from "./index"
import { identifier } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class datum_target extends shape_aspect {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.DATUM_TARGET
  }
  private target_id_? : string

  public get target_id() : string {
    if ( this.target_id_ === void 0 ) {
      this.target_id_ = this.extractString( 4, false )
    }

    return this.target_id_ as string
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.DATUM_TARGET ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.DATUM_TARGET
}
