
import { IfcSurfaceTexture } from "./index"
import { IfcIdentifier } from "./index"
import { IfcBinary } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcBlobTexture extends IfcSurfaceTexture {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCBLOBTEXTURE
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcBlobTexture.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcBlobTexture" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCBLOBTEXTURE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCBLOBTEXTURE
}
