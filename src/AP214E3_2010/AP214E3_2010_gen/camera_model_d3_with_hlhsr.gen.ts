
import { camera_model_d3 } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class camera_model_d3_with_hlhsr extends camera_model_d3 {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.CAMERA_MODEL_D3_WITH_HLHSR
  }
  private hidden_line_surface_removal_? : boolean

  public get hidden_line_surface_removal() : boolean {
    if ( this.hidden_line_surface_removal_ === void 0 ) {
      this.hidden_line_surface_removal_ = this.extractBoolean( 3, 3, 4, false )
    }

    return this.hidden_line_surface_removal_ as boolean
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === camera_model_d3_with_hlhsr.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for camera_model_d3_with_hlhsr" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.CAMERA_MODEL_D3_WITH_HLHSR ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.CAMERA_MODEL_D3_WITH_HLHSR
}
