
import { text_literal } from "./index"
import { planar_box } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class text_literal_with_blanking_box extends text_literal {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.TEXT_LITERAL_WITH_BLANKING_BOX
  }
  private blanking_? : planar_box

  public get blanking() : planar_box {
    if ( this.blanking_ === void 0 ) {
      this.blanking_ = this.extractElement( 6, false, planar_box )
    }

    return this.blanking_ as planar_box
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.TEXT_LITERAL_WITH_BLANKING_BOX ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.TEXT_LITERAL_WITH_BLANKING_BOX
}
