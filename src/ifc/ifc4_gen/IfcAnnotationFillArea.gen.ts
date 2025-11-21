
import { IfcGeometricRepresentationItem } from "./index"
import { IfcCurve } from "./index"
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcannotationfillarea.htm */
export  class IfcAnnotationFillArea extends IfcGeometricRepresentationItem {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCANNOTATIONFILLAREA
  }
  private OuterBoundary_? : IfcCurve
  private InnerBoundaries_? : Array<IfcCurve> | null

  public get OuterBoundary() : IfcCurve {
    if ( this.OuterBoundary_ === void 0 ) {
      this.OuterBoundary_ = this.extractElement( 0, 0, 2, false, IfcCurve )
    }

    return this.OuterBoundary_ as IfcCurve
  }

  public get InnerBoundaries() : Array<IfcCurve> | null {
    if ( this.InnerBoundaries_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 1, 0, 2 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return null
      }

      const value : Array<IfcCurve> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcCurve )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.InnerBoundaries_ = value
    }

    return this.InnerBoundaries_ as Array<IfcCurve> | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCANNOTATIONFILLAREA ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCANNOTATIONFILLAREA
}
