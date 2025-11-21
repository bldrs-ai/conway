
import { camera_model } from "./index"
import { planar_box } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class camera_model_d2 extends camera_model {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.CAMERA_MODEL_D2
  }
  private view_window_? : planar_box
  private view_window_clipping_? : boolean

  public get view_window() : planar_box {
    if ( this.view_window_ === void 0 ) {
      this.view_window_ = this.extractElement( 1, 1, 3, false, planar_box )
    }

    return this.view_window_ as planar_box
  }

  public get view_window_clipping() : boolean {
    if ( this.view_window_clipping_ === void 0 ) {
      this.view_window_clipping_ = this.extractBoolean( 2, 1, 3, false )
    }

    return this.view_window_clipping_ as boolean
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === camera_model_d2.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for camera_model_d2" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.CAMERA_MODEL_D2 ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.CAMERA_MODEL_D2
}
