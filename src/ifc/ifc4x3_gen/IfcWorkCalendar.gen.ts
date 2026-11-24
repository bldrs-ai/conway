
import { IfcControl } from "./index"
import { IfcWorkTime } from "./index"
import { IfcWorkCalendarTypeEnum, IfcWorkCalendarTypeEnumDeserializeStep } from "./index"
import {
  stepExtractOptional,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcWorkCalendar extends IfcControl {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCWORKCALENDAR
  }
  private WorkingTimes_? : Array<IfcWorkTime> | null
  private ExceptionTimes_? : Array<IfcWorkTime> | null
  private PredefinedType_? : IfcWorkCalendarTypeEnum | null

  public get WorkingTimes() : Array<IfcWorkTime> | null {
    if ( this.WorkingTimes_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 6, 6, 4 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return null
      }

      const value : Array<IfcWorkTime> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcWorkTime )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.WorkingTimes_ = value
    }

    return this.WorkingTimes_ as Array<IfcWorkTime> | null
  }

  public get ExceptionTimes() : Array<IfcWorkTime> | null {
    if ( this.ExceptionTimes_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 7, 6, 4 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return null
      }

      const value : Array<IfcWorkTime> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcWorkTime )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.ExceptionTimes_ = value
    }

    return this.ExceptionTimes_ as Array<IfcWorkTime> | null
  }

  public get PredefinedType() : IfcWorkCalendarTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 6, 4, IfcWorkCalendarTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcWorkCalendarTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcWorkCalendar.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcWorkCalendar" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCWORKCALENDAR ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCWORKCALENDAR
}
