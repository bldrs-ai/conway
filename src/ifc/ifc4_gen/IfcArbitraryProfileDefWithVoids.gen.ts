
import { IfcArbitraryClosedProfileDef } from "./index"
import { IfcCurve } from "./index"
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcarbitraryprofiledefwithvoids.htm */
export  class IfcArbitraryProfileDefWithVoids extends IfcArbitraryClosedProfileDef {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCARBITRARYPROFILEDEFWITHVOIDS
  }
  private InnerCurves_? : Array<IfcCurve>

  public get InnerCurves() : Array<IfcCurve> {
    if ( this.InnerCurves_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 3 )
      const buffer    = this.buffer
      const endCursor = buffer.length

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

      this.InnerCurves_ = value
    }

    return this.InnerCurves_ as Array<IfcCurve>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCARBITRARYPROFILEDEFWITHVOIDS ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCARBITRARYPROFILEDEFWITHVOIDS
}
