
import { numeric_expression } from "./index"
import { generic_expression } from "./index"
import { string_expression } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class value_function extends numeric_expression {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.VALUE_FUNCTION
  }
  private operand_? : generic_expression

  public get operand() : generic_expression {
    if ( this.operand_ === void 0 ) {
      this.operand_ = this.extractElement( 0, false, generic_expression )
    }

    return this.operand_ as generic_expression
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.VALUE_FUNCTION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.VALUE_FUNCTION
}
