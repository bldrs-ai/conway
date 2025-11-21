
import { founded_item } from "./index"
import { curve_tolerance_parameter } from "./index"
import { surface_tolerance_parameter } from "./index"
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
export  class approximation_tolerance_parameter extends founded_item {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.APPROXIMATION_TOLERANCE_PARAMETER
  }
  private tolerances_? : Array<curve_tolerance_parameter | surface_tolerance_parameter>

  public get tolerances() : Array<curve_tolerance_parameter | surface_tolerance_parameter> {
    if ( this.tolerances_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 0, 0, 1 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<curve_tolerance_parameter | surface_tolerance_parameter> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesAP214 > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof curve_tolerance_parameter ) && !( value1Untyped instanceof surface_tolerance_parameter ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (curve_tolerance_parameter | surface_tolerance_parameter)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.tolerances_ = value
    }

    return this.tolerances_ as Array<curve_tolerance_parameter | surface_tolerance_parameter>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === approximation_tolerance_parameter.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for approximation_tolerance_parameter" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.APPROXIMATION_TOLERANCE_PARAMETER ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.APPROXIMATION_TOLERANCE_PARAMETER
}
