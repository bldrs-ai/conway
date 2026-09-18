
import { IfcBoundedCurve } from "./index"
import { IfcSegment } from "./index"
import { IfcLogical } from "./index"
import { IfcInteger } from "./index"
import {
  stepExtractOptional,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
  SIZEOF,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcCompositeCurve extends IfcBoundedCurve {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCCOMPOSITECURVE
  }
  private Segments_? : Array<IfcSegment>
  private SelfIntersect_? : boolean | null

  public get Segments() : Array<IfcSegment> {
    if ( this.Segments_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 0, 0, 4 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcSegment> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcSegment )
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

    return this.Segments_ as Array<IfcSegment>
  }

  public get SelfIntersect() : boolean | null {
    if ( this.SelfIntersect_ === void 0 ) {
      this.SelfIntersect_ = this.extractLogical( 1, 0, 4, false )
    }

    return this.SelfIntersect_ as boolean | null
  }

  public get NSegments() : number {
    return SIZEOF(this?.Segments);
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcCompositeCurve.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcCompositeCurve" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCCOMPOSITECURVE, EntityTypesIfc4x3.IFCCOMPOSITECURVEONSURFACE, EntityTypesIfc4x3.IFCGRADIENTCURVE, EntityTypesIfc4x3.IFCSEGMENTEDREFERENCECURVE, EntityTypesIfc4x3.IFCBOUNDARYCURVE, EntityTypesIfc4x3.IFCOUTERBOUNDARYCURVE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCCOMPOSITECURVE
}
