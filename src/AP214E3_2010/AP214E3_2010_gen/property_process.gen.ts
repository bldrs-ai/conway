
import { action } from "./index"
import { identifier } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class property_process extends action {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.PROPERTY_PROCESS
  }
  private identification_? : string

  public get identification() : string {
    if ( this.identification_ === void 0 ) {
      this.identification_ = this.extractString( 3, false )
    }

    return this.identification_ as string
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.PROPERTY_PROCESS ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.PROPERTY_PROCESS
}
