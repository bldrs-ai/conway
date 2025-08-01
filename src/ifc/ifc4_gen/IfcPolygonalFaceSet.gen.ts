
import { IfcTessellatedFaceSet } from "./index"
import { IfcBoolean } from "./index"
import { IfcIndexedPolygonalFace } from "./index"
import { IfcPositiveInteger } from "./index"
import {
  stepExtractOptional,
  stepExtractNumber,
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcpolygonalfaceset.htm */
export  class IfcPolygonalFaceSet extends IfcTessellatedFaceSet {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCPOLYGONALFACESET
  }
  private Closed_? : boolean | null
  private Faces_? : Array<IfcIndexedPolygonalFace>
  private PnIndex_? : Array< number > | null

  public get Closed() : boolean | null {
    if ( this.Closed_ === void 0 ) {
      this.Closed_ = this.extractBoolean( 1, 1, 4, true )
    }

    return this.Closed_ as boolean | null
  }

  public get Faces() : Array<IfcIndexedPolygonalFace> {
    if ( this.Faces_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 2, 1, 4 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcIndexedPolygonalFace> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcIndexedPolygonalFace )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.Faces_ = value
    }

    return this.Faces_ as Array<IfcIndexedPolygonalFace>
  }

  public get PnIndex() : Array< number > | null {
    if ( this.PnIndex_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 3, 1, 4 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return null
      }

      const value : Array<number> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = stepExtractNumber( buffer, cursor, endCursor )

        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.PnIndex_ = value
    }

    return this.PnIndex_ as Array< number > | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCPOLYGONALFACESET ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCPOLYGONALFACESET
}
