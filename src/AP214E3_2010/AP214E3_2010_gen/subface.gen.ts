
import { face } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class subface extends face {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.SUBFACE
  }
  private parent_face_? : face

  public get parent_face() : face {
    if ( this.parent_face_ === void 0 ) {
      this.parent_face_ = this.extractElement( 2, 2, 3, false, face )
    }

    return this.parent_face_ as face
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === subface.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for subface" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.SUBFACE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.SUBFACE
}
