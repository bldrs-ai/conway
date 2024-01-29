
import { simple_numeric_expression } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class literal_number extends simple_numeric_expression {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.LITERAL_NUMBER
  }
  private the_value_? : number

  public get the_value() : number {
    if ( this.the_value_ === void 0 ) {
      this.the_value_ = this.extractNumber( 0, false )
    }

    return this.the_value_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.INT_LITERAL, EntityTypesAP214.REAL_LITERAL ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.LITERAL_NUMBER
}
