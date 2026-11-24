
import { IfcTextureCoordinate } from "./index"
import { IfcTessellatedFaceSet } from "./index"
import { IfcTextureVertexList } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcIndexedTextureMap extends IfcTextureCoordinate {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCINDEXEDTEXTUREMAP
  }
  private MappedTo_? : IfcTessellatedFaceSet
  private TexCoords_? : IfcTextureVertexList

  public get MappedTo() : IfcTessellatedFaceSet {
    if ( this.MappedTo_ === void 0 ) {
      this.MappedTo_ = this.extractElement( 1, 1, 2, false, IfcTessellatedFaceSet )
    }

    return this.MappedTo_ as IfcTessellatedFaceSet
  }

  public get TexCoords() : IfcTextureVertexList {
    if ( this.TexCoords_ === void 0 ) {
      this.TexCoords_ = this.extractElement( 2, 1, 2, false, IfcTextureVertexList )
    }

    return this.TexCoords_ as IfcTextureVertexList
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcIndexedTextureMap.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcIndexedTextureMap" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCINDEXEDPOLYGONALTEXTUREMAP, EntityTypesIfc4x3.IFCINDEXEDTRIANGLETEXTUREMAP ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCINDEXEDTEXTUREMAP
}
