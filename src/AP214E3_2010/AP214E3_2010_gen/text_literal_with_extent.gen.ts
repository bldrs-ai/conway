
import { text_literal } from "./index"
import { planar_extent } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class text_literal_with_extent extends text_literal {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.TEXT_LITERAL_WITH_EXTENT
  }
  private extent_? : planar_extent

  public get extent() : planar_extent {
    if ( this.extent_ === void 0 ) {
      this.extent_ = this.extractElement( 6, false, planar_extent )
    }

    return this.extent_ as planar_extent
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.TEXT_LITERAL_WITH_EXTENT ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.TEXT_LITERAL_WITH_EXTENT
}
