
import { IfcSurfaceTexture } from "./index"
import { IfcIdentifier } from "./index"
import { IfcBinary } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcblobtexture.htm */
export  class IfcBlobTexture extends IfcSurfaceTexture {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCBLOBTEXTURE
  }
  private RasterFormat_? : string
  private RasterCode_? : [Uint8Array, number]

  public get RasterFormat() : string {
    if ( this.RasterFormat_ === void 0 ) {
      this.RasterFormat_ = this.extractString( 5, 5, 2, false )
    }

    return this.RasterFormat_ as string
  }

  public get RasterCode() : [Uint8Array, number] {
    if ( this.RasterCode_ === void 0 ) {
      this.RasterCode_ = this.extractBinary( 6, 5, 2, false )
    }

    return this.RasterCode_ as [Uint8Array, number]
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCBLOBTEXTURE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCBLOBTEXTURE
}
