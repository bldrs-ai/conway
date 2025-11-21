
import { camera_model } from "./index"
import { axis2_placement_3d } from "./index"
import { view_volume } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class camera_model_d3 extends camera_model {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.CAMERA_MODEL_D3
  }
  private view_reference_system_? : axis2_placement_3d
  private perspective_of_volume_? : view_volume

  public get view_reference_system() : axis2_placement_3d {
    if ( this.view_reference_system_ === void 0 ) {
      this.view_reference_system_ = this.extractElement( 1, 1, 3, false, axis2_placement_3d )
    }

    return this.view_reference_system_ as axis2_placement_3d
  }

  public get perspective_of_volume() : view_volume {
    if ( this.perspective_of_volume_ === void 0 ) {
      this.perspective_of_volume_ = this.extractElement( 2, 1, 3, false, view_volume )
    }

    return this.perspective_of_volume_ as view_volume
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === camera_model_d3.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for camera_model_d3" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.CAMERA_MODEL_D3 ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.CAMERA_MODEL_D3
}
