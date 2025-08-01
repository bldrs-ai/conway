
import { camera_image } from "./index"
import { positive_ratio_measure } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class camera_image_3d_with_scale extends camera_image {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.CAMERA_IMAGE_3D_WITH_SCALE
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === camera_image_3d_with_scale.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for camera_image_3d_with_scale" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.CAMERA_IMAGE_3D_WITH_SCALE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.CAMERA_IMAGE_3D_WITH_SCALE
}
