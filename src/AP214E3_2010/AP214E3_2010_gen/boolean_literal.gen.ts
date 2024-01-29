
import { simple_boolean_expression } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class boolean_literal extends simple_boolean_expression {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.BOOLEAN_LITERAL
  }
  private the_value_? : boolean

  public get the_value() : boolean {
    if ( this.the_value_ === void 0 ) {
      this.the_value_ = this.extractBoolean( 0, false )
    }

    return this.the_value_ as boolean
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.BOOLEAN_LITERAL ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.BOOLEAN_LITERAL
}
