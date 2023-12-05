
import { IfcTextureCoordinate } from "./index"
import { IfcTextureVertex } from "./index"
import { IfcFace } from "./index"
import {
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifctexturemap.htm */
export  class IfcTextureMap extends IfcTextureCoordinate {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCTEXTUREMAP
  }
  private Vertices_? : Array<IfcTextureVertex>
  private MappedTo_? : IfcFace

  public get Vertices() : Array<IfcTextureVertex> {
    if ( this.Vertices_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 1 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      const value : Array<IfcTextureVertex> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcTextureVertex )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.Vertices_ = value
    }

    return this.Vertices_ as Array<IfcTextureVertex>
  }

  public get MappedTo() : IfcFace {
    if ( this.MappedTo_ === void 0 ) {
      this.MappedTo_ = this.extractElement( 2, false, IfcFace )
    }

    return this.MappedTo_ as IfcFace
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCTEXTUREMAP ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCTEXTUREMAP
}
