
import { simple_string_expression } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class string_literal extends simple_string_expression {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.STRING_LITERAL
  }
  private the_value_? : string

  public get the_value() : string {
    if ( this.the_value_ === void 0 ) {
      this.the_value_ = this.extractString( 0, false )
    }

    return this.the_value_ as string
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.STRING_LITERAL ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.STRING_LITERAL
}
