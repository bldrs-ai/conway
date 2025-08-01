
import { item_identified_representation_usage } from "./index"
import { shape_aspect } from "./index"
import { draughting_model } from "./index"
import { annotation_occurrence } from "./index"
import { draughting_callout } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class draughting_model_item_association extends item_identified_representation_usage {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.DRAUGHTING_MODEL_ITEM_ASSOCIATION
  }




  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === draughting_model_item_association.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for draughting_model_item_association" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.DRAUGHTING_MODEL_ITEM_ASSOCIATION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.DRAUGHTING_MODEL_ITEM_ASSOCIATION
}
