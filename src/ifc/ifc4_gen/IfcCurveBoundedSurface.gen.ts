
import { IfcBoundedSurface } from "./index"
import { IfcSurface } from "./index"
import { IfcBoundaryCurve } from "./index"
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccurveboundedsurface.htm */
export  class IfcCurveBoundedSurface extends IfcBoundedSurface {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCURVEBOUNDEDSURFACE
  }
  private BasisSurface_? : IfcSurface
  private Boundaries_? : Array<IfcBoundaryCurve>
  private ImplicitOuter_? : boolean

  public get BasisSurface() : IfcSurface {
    if ( this.BasisSurface_ === void 0 ) {
      this.BasisSurface_ = this.extractElement( 0, 0, 4, false, IfcSurface )
    }

    return this.BasisSurface_ as IfcSurface
  }

  public get Boundaries() : Array<IfcBoundaryCurve> {
    if ( this.Boundaries_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 1, 0, 4 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcBoundaryCurve> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcBoundaryCurve )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.Boundaries_ = value
    }

    return this.Boundaries_ as Array<IfcBoundaryCurve>
  }

  public get ImplicitOuter() : boolean {
    if ( this.ImplicitOuter_ === void 0 ) {
      this.ImplicitOuter_ = this.extractBoolean( 2, 0, 4, false )
    }

    return this.ImplicitOuter_ as boolean
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCURVEBOUNDEDSURFACE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCURVEBOUNDEDSURFACE
}
