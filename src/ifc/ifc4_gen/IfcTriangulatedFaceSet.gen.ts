
import { IfcTessellatedFaceSet } from "./index"
import { IfcParameterValue } from "./index"
import { IfcBoolean } from "./index"
import { IfcPositiveInteger } from "./index"
import { IfcInteger } from "./index"
import {
  stepExtractOptional,
  stepExtractNumber,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
  SIZEOF,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifctriangulatedfaceset.htm */
export  class IfcTriangulatedFaceSet extends IfcTessellatedFaceSet {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCTRIANGULATEDFACESET
  }
  private Normals_? : Array< Array< number > > | null
  private Closed_? : boolean | null
  private CoordIndex_? : Array< Array< number > >
  private PnIndex_? : Array< number > | null

  public get Normals() : Array< Array< number > > | null {
    if ( this.Normals_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 1, 1, 4 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return null
      }

      const value : Array<Array<number>> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 : Array<number> = []

        let signedCursor1 = stepExtractArrayBegin( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor1 )

        while ( signedCursor1 >= 0 ) {
          const value2 = stepExtractNumber( buffer, cursor, endCursor )

          if ( value2 === void 0 ) {
            throw new Error( 'Value in STEP was incorrectly typed' )
          }
          cursor = skipValue( buffer, cursor, endCursor )
          value1.push( value2 )
          signedCursor1 = stepExtractArrayToken( buffer, cursor, endCursor )
          cursor = Math.abs( signedCursor1 )
        }
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.Normals_ = value
    }

    return this.Normals_ as Array< Array< number > > | null
  }

  public get Closed() : boolean | null {
    if ( this.Closed_ === void 0 ) {
      this.Closed_ = this.extractBoolean( 2, 1, 4, true )
    }

    return this.Closed_ as boolean | null
  }

  public get CoordIndex() : Array< Array< number > > {
    if ( this.CoordIndex_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 3, 1, 4 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<Array<number>> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 : Array<number> = []

        let signedCursor1 = stepExtractArrayBegin( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor1 )

        while ( signedCursor1 >= 0 ) {
          const value2 = stepExtractNumber( buffer, cursor, endCursor )

          if ( value2 === void 0 ) {
            throw new Error( 'Value in STEP was incorrectly typed' )
          }
          cursor = skipValue( buffer, cursor, endCursor )
          value1.push( value2 )
          signedCursor1 = stepExtractArrayToken( buffer, cursor, endCursor )
          cursor = Math.abs( signedCursor1 )
        }
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.CoordIndex_ = value
    }

    return this.CoordIndex_ as Array< Array< number > >
  }

  public get PnIndex() : Array< number > | null {
    if ( this.PnIndex_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 4, 1, 4 )
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

  public get NumberOfTriangles() : number {
    return SIZEOF(this?.CoordIndex);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCTRIANGULATEDFACESET ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCTRIANGULATEDFACESET
}
