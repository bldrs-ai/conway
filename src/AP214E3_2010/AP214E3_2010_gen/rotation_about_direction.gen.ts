
import { direction } from "./index"
import { plane_angle_measure } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class rotation_about_direction extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.ROTATION_ABOUT_DIRECTION
  }
  private direction_of_axis_? : direction
  private rotation_angle_? : number

  public get direction_of_axis() : direction {
    if ( this.direction_of_axis_ === void 0 ) {
      this.direction_of_axis_ = this.extractElement( 0, 0, 0, false, direction )
    }

    return this.direction_of_axis_ as direction
  }

  public get rotation_angle() : number {
    if ( this.rotation_angle_ === void 0 ) {
      this.rotation_angle_ = this.extractNumber( 1, 0, 0, false )
    }

    return this.rotation_angle_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === rotation_about_direction.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for rotation_about_direction" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.ROTATION_ABOUT_DIRECTION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.ROTATION_ABOUT_DIRECTION
}
