
import { product_definition_formation } from "./index"
import { source, sourceDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class product_definition_formation_with_specified_source extends product_definition_formation {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.PRODUCT_DEFINITION_FORMATION_WITH_SPECIFIED_SOURCE
  }
  private make_or_buy_? : source

  public get make_or_buy() : source {
    if ( this.make_or_buy_ === void 0 ) {
      this.make_or_buy_ = this.extractLambda( 3, sourceDeserializeStep, false )
    }

    return this.make_or_buy_ as source
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.PRODUCT_DEFINITION_FORMATION_WITH_SPECIFIED_SOURCE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.PRODUCT_DEFINITION_FORMATION_WITH_SPECIFIED_SOURCE
}
