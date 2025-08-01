
import { IfcTimeSeries } from "./index"
import { IfcTimeMeasure } from "./index"
import { IfcTimeSeriesValue } from "./index"
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcregulartimeseries.htm */
export  class IfcRegularTimeSeries extends IfcTimeSeries {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCREGULARTIMESERIES
  }
  private TimeStep_? : number
  private Values_? : Array<IfcTimeSeriesValue>

  public get TimeStep() : number {
    if ( this.TimeStep_ === void 0 ) {
      this.TimeStep_ = this.extractNumber( 8, 8, 1, false )
    }

    return this.TimeStep_ as number
  }

  public get Values() : Array<IfcTimeSeriesValue> {
    if ( this.Values_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 9, 8, 1 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcTimeSeriesValue> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcTimeSeriesValue )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.Values_ = value
    }

    return this.Values_ as Array<IfcTimeSeriesValue>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCREGULARTIMESERIES ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCREGULARTIMESERIES
}
