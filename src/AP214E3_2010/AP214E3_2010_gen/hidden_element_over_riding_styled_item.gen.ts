
import { context_dependent_over_riding_styled_item } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class hidden_element_over_riding_styled_item extends context_dependent_over_riding_styled_item {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.HIDDEN_ELEMENT_OVER_RIDING_STYLED_ITEM
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === hidden_element_over_riding_styled_item.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for hidden_element_over_riding_styled_item" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.HIDDEN_ELEMENT_OVER_RIDING_STYLED_ITEM ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.HIDDEN_ELEMENT_OVER_RIDING_STYLED_ITEM
}
