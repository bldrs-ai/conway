
import { IfcConstraint } from "./index"
import { IfcLogicalOperatorEnum, IfcLogicalOperatorEnumDeserializeStep } from "./index"
import { IfcObjectiveEnum, IfcObjectiveEnumDeserializeStep } from "./index"
import { IfcLabel } from "./index"
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcobjective.htm */
export  class IfcObjective extends IfcConstraint {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCOBJECTIVE
  }
  private BenchmarkValues_? : Array<IfcConstraint> | null
  private LogicalAggregator_? : IfcLogicalOperatorEnum | null
  private ObjectiveQualifier_? : IfcObjectiveEnum
  private UserDefinedQualifier_? : string | null

  public get BenchmarkValues() : Array<IfcConstraint> | null {
    if ( this.BenchmarkValues_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 7, 7, 1 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return null
      }

      const value : Array<IfcConstraint> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcConstraint )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.BenchmarkValues_ = value
    }

    return this.BenchmarkValues_ as Array<IfcConstraint> | null
  }

  public get LogicalAggregator() : IfcLogicalOperatorEnum | null {
    if ( this.LogicalAggregator_ === void 0 ) {
      this.LogicalAggregator_ = this.extractLambda( 8, 7, 1, IfcLogicalOperatorEnumDeserializeStep, true )
    }

    return this.LogicalAggregator_ as IfcLogicalOperatorEnum | null
  }

  public get ObjectiveQualifier() : IfcObjectiveEnum {
    if ( this.ObjectiveQualifier_ === void 0 ) {
      this.ObjectiveQualifier_ = this.extractLambda( 9, 7, 1, IfcObjectiveEnumDeserializeStep, false )
    }

    return this.ObjectiveQualifier_ as IfcObjectiveEnum
  }

  public get UserDefinedQualifier() : string | null {
    if ( this.UserDefinedQualifier_ === void 0 ) {
      this.UserDefinedQualifier_ = this.extractString( 10, 7, 1, true )
    }

    return this.UserDefinedQualifier_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCOBJECTIVE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCOBJECTIVE
}
