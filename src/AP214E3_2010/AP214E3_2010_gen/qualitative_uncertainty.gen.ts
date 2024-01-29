
import { uncertainty_qualifier } from "./index"
import { text } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class qualitative_uncertainty extends uncertainty_qualifier {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.QUALITATIVE_UNCERTAINTY
  }
  private uncertainty_value_? : string

  public get uncertainty_value() : string {
    if ( this.uncertainty_value_ === void 0 ) {
      this.uncertainty_value_ = this.extractString( 2, false )
    }

    return this.uncertainty_value_ as string
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.QUALITATIVE_UNCERTAINTY ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.QUALITATIVE_UNCERTAINTY
}
