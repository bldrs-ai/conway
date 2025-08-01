
import { IfcTextureCoordinate } from "./index"
import { IfcTessellatedFaceSet } from "./index"
import { IfcTextureVertexList } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcindexedtexturemap.htm */
export abstract class IfcIndexedTextureMap extends IfcTextureCoordinate {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCINDEXEDTEXTUREMAP
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCINDEXEDTRIANGLETEXTUREMAP ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCINDEXEDTEXTUREMAP
}
