
import { IfcBoundedSurface } from "./index"
import { IfcPlane } from "./index"
import { IfcCurve } from "./index"
import {
  stepExtractOptional,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcCurveBoundedPlane extends IfcBoundedSurface {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCCURVEBOUNDEDPLANE
  }
  private BasisSurface_? : IfcPlane
  private OuterBoundary_? : IfcCurve
  private InnerBoundaries_? : Array<IfcCurve>

  public get BasisSurface() : IfcPlane {
    if ( this.BasisSurface_ === void 0 ) {
      this.BasisSurface_ = this.extractElement( 0, 0, 4, false, IfcPlane )
    }

    return this.BasisSurface_ as IfcPlane
  }

  public get OuterBoundary() : IfcCurve {
    if ( this.OuterBoundary_ === void 0 ) {
      this.OuterBoundary_ = this.extractElement( 1, 0, 4, false, IfcCurve )
    }

    return this.OuterBoundary_ as IfcCurve
  }

  public get InnerBoundaries() : Array<IfcCurve> {
    if ( this.InnerBoundaries_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 2, 0, 4 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
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

    return this.InnerBoundaries_ as Array<IfcCurve>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcCurveBoundedPlane.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcCurveBoundedPlane" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCCURVEBOUNDEDPLANE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCCURVEBOUNDEDPLANE
}
