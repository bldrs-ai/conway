
import { runout_zone_orientation } from "./index"
import { shape_aspect_relationship } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class runout_zone_orientation_reference_direction extends runout_zone_orientation {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.RUNOUT_ZONE_ORIENTATION_REFERENCE_DIRECTION
  }
  private orientation_defining_relationship_? : shape_aspect_relationship

  public get orientation_defining_relationship() : shape_aspect_relationship {
    if ( this.orientation_defining_relationship_ === void 0 ) {
      this.orientation_defining_relationship_ = this.extractElement( 1, 1, 1, false, shape_aspect_relationship )
    }

    return this.orientation_defining_relationship_ as shape_aspect_relationship
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === runout_zone_orientation_reference_direction.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for runout_zone_orientation_reference_direction" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.RUNOUT_ZONE_ORIENTATION_REFERENCE_DIRECTION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.RUNOUT_ZONE_ORIENTATION_REFERENCE_DIRECTION
}
