
import { IfcBSplineCurveWithKnots } from "./index"
import { IfcReal } from "./index"
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrationalbsplinecurvewithknots.htm */
export  class IfcRationalBSplineCurveWithKnots extends IfcBSplineCurveWithKnots {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRATIONALBSPLINECURVEWITHKNOTS
  }
  private WeightsData_? : Array< number >

  public get WeightsData() : Array< number > {
    if ( this.WeightsData_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 8 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
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

      this.WeightsData_ = value
    }

    return this.WeightsData_ as Array< number >
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRATIONALBSPLINECURVEWITHKNOTS ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRATIONALBSPLINECURVEWITHKNOTS
}
