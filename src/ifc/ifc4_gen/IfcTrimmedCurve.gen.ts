
import { IfcBoundedCurve } from "./index"
import { IfcCurve } from "./index"
import { IfcCartesianPoint } from "./index"
import { IfcParameterValue } from "./index"
import { IfcBoolean } from "./index"
import { IfcTrimmingPreference, IfcTrimmingPreferenceDeserializeStep } from "./index"
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifctrimmedcurve.htm */
export  class IfcTrimmedCurve extends IfcBoundedCurve {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCTRIMMEDCURVE
  }
  private BasisCurve_? : IfcCurve
  private Trim1_? : Array<IfcCartesianPoint | IfcParameterValue>
  private Trim2_? : Array<IfcCartesianPoint | IfcParameterValue>
  private SenseAgreement_? : boolean
  private MasterRepresentation_? : IfcTrimmingPreference

  public get BasisCurve() : IfcCurve {
    if ( this.BasisCurve_ === void 0 ) {
      this.BasisCurve_ = this.extractElement( 0, 0, 4, false, IfcCurve )
    }

    return this.BasisCurve_ as IfcCurve
  }

  public get Trim1() : Array<IfcCartesianPoint | IfcParameterValue> {
    if ( this.Trim1_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 1, 0, 4 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcCartesianPoint | IfcParameterValue> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesIfc > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof IfcCartesianPoint ) && !( value1Untyped instanceof IfcParameterValue ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (IfcCartesianPoint | IfcParameterValue)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.Trim1_ = value
    }

    return this.Trim1_ as Array<IfcCartesianPoint | IfcParameterValue>
  }

  public get Trim2() : Array<IfcCartesianPoint | IfcParameterValue> {
    if ( this.Trim2_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 2, 0, 4 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcCartesianPoint | IfcParameterValue> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesIfc > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof IfcCartesianPoint ) && !( value1Untyped instanceof IfcParameterValue ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (IfcCartesianPoint | IfcParameterValue)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.Trim2_ = value
    }

    return this.Trim2_ as Array<IfcCartesianPoint | IfcParameterValue>
  }

  public get SenseAgreement() : boolean {
    if ( this.SenseAgreement_ === void 0 ) {
      this.SenseAgreement_ = this.extractBoolean( 3, 0, 4, false )
    }

    return this.SenseAgreement_ as boolean
  }

  public get MasterRepresentation() : IfcTrimmingPreference {
    if ( this.MasterRepresentation_ === void 0 ) {
      this.MasterRepresentation_ = this.extractLambda( 4, 0, 4, IfcTrimmingPreferenceDeserializeStep, false )
    }

    return this.MasterRepresentation_ as IfcTrimmingPreference
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCTRIMMEDCURVE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCTRIMMEDCURVE
}
