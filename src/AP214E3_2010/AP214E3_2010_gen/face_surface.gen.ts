
import { face } from "./index"
import { surface } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/face_surface.htm */
export  class face_surface extends face {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.FACE_SURFACE
  }
  private face_geometry_? : surface
  private same_sense_? : boolean

  public get face_geometry() : surface {
    if ( this.face_geometry_ === void 0 ) {
      this.face_geometry_ = this.extractElement( 2, false, surface )
    }

    return this.face_geometry_ as surface
  }

  public get same_sense() : boolean {
    if ( this.same_sense_ === void 0 ) {
      this.same_sense_ = this.extractBoolean( 3, false )
    }

    return this.same_sense_ as boolean
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.FACE_SURFACE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.FACE_SURFACE
}