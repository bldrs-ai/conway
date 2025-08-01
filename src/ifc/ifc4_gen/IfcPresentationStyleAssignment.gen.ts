
import { IfcCurveStyle } from "./index"
import { IfcFillAreaStyle } from "./index"
import { IfcNullStyle, IfcNullStyleDeserializeStep } from "./index"
import { IfcSurfaceStyle } from "./index"
import { IfcTextStyle } from "./index"
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcpresentationstyleassignment.htm */
export  class IfcPresentationStyleAssignment extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCPRESENTATIONSTYLEASSIGNMENT
  }
  private Styles_? : Array<IfcCurveStyle | IfcFillAreaStyle | IfcNullStyle | IfcSurfaceStyle | IfcTextStyle>

  public get Styles() : Array<IfcCurveStyle | IfcFillAreaStyle | IfcNullStyle | IfcSurfaceStyle | IfcTextStyle> {
    if ( this.Styles_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 0, 0, 0 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcCurveStyle | IfcFillAreaStyle | IfcNullStyle | IfcSurfaceStyle | IfcTextStyle> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesIfc > | IfcNullStyle | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor ) ?? IfcNullStyleDeserializeStep( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof IfcCurveStyle ) && !( value1Untyped instanceof IfcFillAreaStyle ) && !( value1Untyped instanceof IfcSurfaceStyle ) && !( value1Untyped instanceof IfcTextStyle ) && value1Untyped !== IfcNullStyle.NULL ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (IfcCurveStyle | IfcFillAreaStyle | IfcNullStyle | IfcSurfaceStyle | IfcTextStyle)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.Styles_ = value
    }

    return this.Styles_ as Array<IfcCurveStyle | IfcFillAreaStyle | IfcNullStyle | IfcSurfaceStyle | IfcTextStyle>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCPRESENTATIONSTYLEASSIGNMENT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCPRESENTATIONSTYLEASSIGNMENT
}
