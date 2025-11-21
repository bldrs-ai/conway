
import { bounded_curve } from "./index"
import { composite_curve_segment } from "./index"
import {
  stepExtractOptional,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
  SIZEOF,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class composite_curve extends bounded_curve {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.COMPOSITE_CURVE
  }
  private segments_? : Array<composite_curve_segment>
  private self_intersect_? : boolean

  public get segments() : Array<composite_curve_segment> {
    if ( this.segments_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 1, 1, 4 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<composite_curve_segment> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, composite_curve_segment )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.segments_ = value
    }

    return this.segments_ as Array<composite_curve_segment>
  }

  public get self_intersect() : boolean {
    if ( this.self_intersect_ === void 0 ) {
      this.self_intersect_ = this.extractBoolean( 2, 1, 4, false )
    }

    return this.self_intersect_ as boolean
  }

  public get n_segments() : number {
    return SIZEOF(this?.segments);
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === composite_curve.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for composite_curve" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.COMPOSITE_CURVE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.COMPOSITE_CURVE
}
