
import { IfcBoundedCurve } from "./index"
import { IfcCompositeCurveSegment } from "./index"
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
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccompositecurve.htm */
export  class IfcCompositeCurve extends IfcBoundedCurve {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCOMPOSITECURVE
  }
  private Segments_? : Array<IfcCompositeCurveSegment>
  private SelfIntersect_? : boolean | null

  public get Segments() : Array<IfcCompositeCurveSegment> {
    if ( this.Segments_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 0, 0, 4 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcCompositeCurveSegment> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcCompositeCurveSegment )
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

    return this.Segments_ as Array<IfcCompositeCurveSegment>
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCOMPOSITECURVE, EntityTypesIfc.IFCCOMPOSITECURVEONSURFACE, EntityTypesIfc.IFCBOUNDARYCURVE, EntityTypesIfc.IFCOUTERBOUNDARYCURVE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCOMPOSITECURVE
}
