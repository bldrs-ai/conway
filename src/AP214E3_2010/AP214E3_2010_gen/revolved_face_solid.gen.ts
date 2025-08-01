
import { swept_face_solid } from "./index"
import { axis1_placement } from "./index"
import { plane_angle_measure } from "./index"
import { line } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class revolved_face_solid extends swept_face_solid {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.REVOLVED_FACE_SOLID
  }
  private axis_? : axis1_placement
  private angle_? : number

  public get axis() : axis1_placement {
    if ( this.axis_ === void 0 ) {
      this.axis_ = this.extractElement( 2, 2, 4, false, axis1_placement )
    }

    return this.axis_ as axis1_placement
  }

  public get angle() : number {
    if ( this.angle_ === void 0 ) {
      this.angle_ = this.extractNumber( 3, 2, 4, false )
    }

    return this.angle_ as number
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === revolved_face_solid.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for revolved_face_solid" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.REVOLVED_FACE_SOLID ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.REVOLVED_FACE_SOLID
}
