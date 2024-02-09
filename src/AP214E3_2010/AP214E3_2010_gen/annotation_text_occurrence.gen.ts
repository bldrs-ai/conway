
import { annotation_occurrence } from "./index"
import { text_literal } from "./index"
import { annotation_text } from "./index"
import { annotation_text_character } from "./index"
import { defined_character_glyph } from "./index"
import { composite_text } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class annotation_text_occurrence extends annotation_occurrence {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.ANNOTATION_TEXT_OCCURRENCE
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.ANNOTATION_TEXT_OCCURRENCE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.ANNOTATION_TEXT_OCCURRENCE
}
