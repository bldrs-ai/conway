
import { IfcBoundedCurve } from "./index"
import { IfcCartesianPointList } from "./index"
import { IfcArcIndex } from "./index"
import { IfcLineIndex } from "./index"
import { IfcBoolean } from "./index"
import {
  stepExtractOptional,
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcindexedpolycurve.htm */
export  class IfcIndexedPolyCurve extends IfcBoundedCurve {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCINDEXEDPOLYCURVE
  }
  private Points_? : IfcCartesianPointList
  private Segments_? : Array<IfcArcIndex | IfcLineIndex> | null
  private SelfIntersect_? : boolean | null

  public get Points() : IfcCartesianPointList {
    if ( this.Points_ === void 0 ) {
      this.Points_ = this.extractElement( 0, 0, 4, false, IfcCartesianPointList )
    }

    return this.Points_ as IfcCartesianPointList
  }

  public get Segments() : Array<IfcArcIndex | IfcLineIndex> | null {
    if ( this.Segments_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 1, 0, 4 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return null
      }

      const value : Array<IfcArcIndex | IfcLineIndex> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesIfc > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof IfcArcIndex ) && !( value1Untyped instanceof IfcLineIndex ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (IfcArcIndex | IfcLineIndex)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.Segments_ = value
    }

    return this.Segments_ as Array<IfcArcIndex | IfcLineIndex> | null
  }

  public get SelfIntersect() : boolean | null {
    if ( this.SelfIntersect_ === void 0 ) {
      this.SelfIntersect_ = this.extractBoolean( 2, 0, 4, true )
    }

    return this.SelfIntersect_ as boolean | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCINDEXEDPOLYCURVE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCINDEXEDPOLYCURVE
}
