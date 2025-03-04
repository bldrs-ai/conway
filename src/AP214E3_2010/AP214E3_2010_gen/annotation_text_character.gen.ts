
import { mapped_item } from "./index"
import { text_alignment } from "./index"
import { axis2_placement_2d } from "./index"
import { axis2_placement_3d } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class annotation_text_character extends mapped_item {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.ANNOTATION_TEXT_CHARACTER
  }
  private alignment_? : string

  public get alignment() : string {
    if ( this.alignment_ === void 0 ) {
      this.alignment_ = this.extractString( 3, false )
    }

    return this.alignment_ as string
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.ANNOTATION_TEXT_CHARACTER ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.ANNOTATION_TEXT_CHARACTER
}
