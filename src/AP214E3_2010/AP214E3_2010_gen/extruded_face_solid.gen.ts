
import { swept_face_solid } from "./index"
import { direction } from "./index"
import { positive_length_measure } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class extruded_face_solid extends swept_face_solid {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.EXTRUDED_FACE_SOLID
  }
  private extruded_direction_? : direction
  private depth_? : number

  public get extruded_direction() : direction {
    if ( this.extruded_direction_ === void 0 ) {
      this.extruded_direction_ = this.extractElement( 2, 2, 4, false, direction )
    }

    return this.extruded_direction_ as direction
  }

  public get depth() : number {
    if ( this.depth_ === void 0 ) {
      this.depth_ = this.extractNumber( 3, 2, 4, false )
    }

    return this.depth_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === extruded_face_solid.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for extruded_face_solid" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.EXTRUDED_FACE_SOLID ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.EXTRUDED_FACE_SOLID
}
