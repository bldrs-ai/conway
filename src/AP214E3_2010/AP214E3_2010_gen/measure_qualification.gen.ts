
import { label } from "./index"
import { text } from "./index"
import { measure_with_unit } from "./index"
import { precision_qualifier } from "./index"
import { type_qualifier } from "./index"
import { uncertainty_qualifier } from "./index"
import {
  stepExtractOptional,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class measure_qualification extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.MEASURE_QUALIFICATION
  }
  private name_? : string
  private description_? : string
  private qualified_measure_? : measure_with_unit
  private qualifiers_? : Array<precision_qualifier | type_qualifier | uncertainty_qualifier>

  public get name() : string {
    if ( this.name_ === void 0 ) {
      this.name_ = this.extractString( 0, 0, 0, false )
    }

    return this.name_ as string
  }

  public get description() : string {
    if ( this.description_ === void 0 ) {
      this.description_ = this.extractString( 1, 0, 0, false )
    }

    return this.description_ as string
  }

  public get qualified_measure() : measure_with_unit {
    if ( this.qualified_measure_ === void 0 ) {
      this.qualified_measure_ = this.extractElement( 2, 0, 0, false, measure_with_unit )
    }

    return this.qualified_measure_ as measure_with_unit
  }

  public get qualifiers() : Array<precision_qualifier | type_qualifier | uncertainty_qualifier> {
    if ( this.qualifiers_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 3, 0, 0 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<precision_qualifier | type_qualifier | uncertainty_qualifier> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesAP214 > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof precision_qualifier ) && !( value1Untyped instanceof type_qualifier ) && !( value1Untyped instanceof uncertainty_qualifier ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (precision_qualifier | type_qualifier | uncertainty_qualifier)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.qualifiers_ = value
    }

    return this.qualifiers_ as Array<precision_qualifier | type_qualifier | uncertainty_qualifier>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === measure_qualification.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for measure_qualification" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.MEASURE_QUALIFICATION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.MEASURE_QUALIFICATION
}
