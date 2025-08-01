
import { IfcBSplineCurve } from "./index"
import { IfcInteger } from "./index"
import { IfcParameterValue } from "./index"
import { IfcKnotType, IfcKnotTypeDeserializeStep } from "./index"
import {
  stepExtractOptional,
  stepExtractNumber,
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcbsplinecurvewithknots.htm */
export  class IfcBSplineCurveWithKnots extends IfcBSplineCurve {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCBSPLINECURVEWITHKNOTS
  }
  private KnotMultiplicities_? : Array< number >
  private Knots_? : Array< number >
  private KnotSpec_? : IfcKnotType

  public get KnotMultiplicities() : Array< number > {
    if ( this.KnotMultiplicities_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 5, 5, 5 )
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

      this.KnotMultiplicities_ = value
    }

    return this.KnotMultiplicities_ as Array< number >
  }

  public get Knots() : Array< number > {
    if ( this.Knots_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 6, 5, 5 )
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

      this.Knots_ = value
    }

    return this.Knots_ as Array< number >
  }

  public get KnotSpec() : IfcKnotType {
    if ( this.KnotSpec_ === void 0 ) {
      this.KnotSpec_ = this.extractLambda( 7, 5, 5, IfcKnotTypeDeserializeStep, false )
    }

    return this.KnotSpec_ as IfcKnotType
  }

  public get UpperIndexOnKnots() : number {
    return SIZEOF(this?.Knots);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCBSPLINECURVEWITHKNOTS, EntityTypesIfc.IFCRATIONALBSPLINECURVEWITHKNOTS ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCBSPLINECURVEWITHKNOTS
}
