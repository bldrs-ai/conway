
import { face } from "./index"
import { dimension_count } from "./index"
import { surface } from "./index"
import {
  dimension_of,
} from '../ap214_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class face_surface extends face {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.FACE_SURFACE
  }
  private face_geometry_? : surface
  private same_sense_? : boolean

  public get dim() : number {
    return dimension_of(this);
  }

  public get face_geometry() : surface {
    if ( this.face_geometry_ === void 0 ) {
      this.face_geometry_ = this.extractElement( 2, 2, 3, false, surface )
    }

    return this.face_geometry_ as surface
  }

  public get same_sense() : boolean {
    if ( this.same_sense_ === void 0 ) {
      this.same_sense_ = this.extractBoolean( 3, 2, 3, false )
    }

    return this.same_sense_ as boolean
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === face_surface.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for face_surface" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.FACE_SURFACE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.FACE_SURFACE
}
