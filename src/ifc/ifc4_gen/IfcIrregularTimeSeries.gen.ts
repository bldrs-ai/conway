
import { IfcTimeSeries } from "./index"
import { IfcIrregularTimeSeriesValue } from "./index"
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcirregulartimeseries.htm */
export  class IfcIrregularTimeSeries extends IfcTimeSeries {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCIRREGULARTIMESERIES
  }
  private Values_? : Array<IfcIrregularTimeSeriesValue>

  public get Values() : Array<IfcIrregularTimeSeriesValue> {
    if ( this.Values_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 8, 8, 1 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcIrregularTimeSeriesValue> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcIrregularTimeSeriesValue )
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

    return this.Values_ as Array<IfcIrregularTimeSeriesValue>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCIRREGULARTIMESERIES ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCIRREGULARTIMESERIES
}
