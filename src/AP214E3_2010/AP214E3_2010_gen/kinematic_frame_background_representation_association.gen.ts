
import { representation_relationship_with_transformation } from "./index"
import { kinematic_frame_based_transformation } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class kinematic_frame_background_representation_association extends representation_relationship_with_transformation {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.KINEMATIC_FRAME_BACKGROUND_REPRESENTATION_ASSOCIATION
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === kinematic_frame_background_representation_association.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for kinematic_frame_background_representation_association" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.KINEMATIC_FRAME_BACKGROUND_REPRESENTATION_ASSOCIATION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.KINEMATIC_FRAME_BACKGROUND_REPRESENTATION_ASSOCIATION
}
