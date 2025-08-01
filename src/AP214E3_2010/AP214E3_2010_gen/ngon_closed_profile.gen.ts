
import { shape_aspect } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class ngon_closed_profile extends shape_aspect {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.NGON_CLOSED_PROFILE
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === ngon_closed_profile.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for ngon_closed_profile" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.NGON_CLOSED_PROFILE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.NGON_CLOSED_PROFILE
}
