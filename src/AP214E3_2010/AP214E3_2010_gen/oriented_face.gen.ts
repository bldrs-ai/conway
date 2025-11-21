
import { face } from "./index"
import { face_bound } from "./index"
import {
  conditional_reverse,
} from '../ap214_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class oriented_face extends face {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.ORIENTED_FACE
  }
  private face_element_? : face
  private orientation_? : boolean

  public get face_element() : face {
    if ( this.face_element_ === void 0 ) {
      this.face_element_ = this.extractElement( 2, 2, 3, false, face )
    }

    return this.face_element_ as face
  }

  public get orientation() : boolean {
    if ( this.orientation_ === void 0 ) {
      this.orientation_ = this.extractBoolean( 3, 2, 3, false )
    }

    return this.orientation_ as boolean
  }

  public get bounds() : Array<face_bound> {
    return conditional_reverse(this?.orientation,this?.face_element.bounds);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === oriented_face.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for oriented_face" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.ORIENTED_FACE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.ORIENTED_FACE
}
