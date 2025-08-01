
import { connected_face_set } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class connected_face_sub_set extends connected_face_set {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.CONNECTED_FACE_SUB_SET
  }
  private parent_face_set_? : connected_face_set

  public get parent_face_set() : connected_face_set {
    if ( this.parent_face_set_ === void 0 ) {
      this.parent_face_set_ = this.extractElement( 2, 2, 3, false, connected_face_set )
    }

    return this.parent_face_set_ as connected_face_set
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === connected_face_sub_set.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for connected_face_sub_set" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.CONNECTED_FACE_SUB_SET ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.CONNECTED_FACE_SUB_SET
}
