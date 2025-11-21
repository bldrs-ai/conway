
import { IfcSurfaceTexture } from "./index"
import { IfcURIReference } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcimagetexture.htm */
export  class IfcImageTexture extends IfcSurfaceTexture {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCIMAGETEXTURE
  }
  private URLReference_? : string

  public get URLReference() : string {
    if ( this.URLReference_ === void 0 ) {
      this.URLReference_ = this.extractString( 5, 5, 2, false )
    }

    return this.URLReference_ as string
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCIMAGETEXTURE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCIMAGETEXTURE
}
