
import { IfcPlaneAngleMeasure } from "./index"
import { IfcLuminousIntensityDistributionMeasure } from "./index"
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifclightdistributiondata.htm */
export  class IfcLightDistributionData extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCLIGHTDISTRIBUTIONDATA
  }
  private MainPlaneAngle_? : number
  private SecondaryPlaneAngle_? : Array< number >
  private LuminousIntensity_? : Array< number >

  public get MainPlaneAngle() : number {
    if ( this.MainPlaneAngle_ === void 0 ) {
      this.MainPlaneAngle_ = this.extractNumber( 0, 0, 0, false )
    }

    return this.MainPlaneAngle_ as number
  }

  public get SecondaryPlaneAngle() : Array< number > {
    if ( this.SecondaryPlaneAngle_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 1, 0, 0 )
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

      this.SecondaryPlaneAngle_ = value
    }

    return this.SecondaryPlaneAngle_ as Array< number >
  }

  public get LuminousIntensity() : Array< number > {
    if ( this.LuminousIntensity_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 2, 0, 0 )
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

      this.LuminousIntensity_ = value
    }

    return this.LuminousIntensity_ as Array< number >
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCLIGHTDISTRIBUTIONDATA ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCLIGHTDISTRIBUTIONDATA
}
