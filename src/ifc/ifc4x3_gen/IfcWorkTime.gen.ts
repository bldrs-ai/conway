
import { IfcSchedulingTime } from "./index"
import { IfcRecurrencePattern } from "./index"
import { IfcDate } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcWorkTime extends IfcSchedulingTime {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCWORKTIME
  }
  private RecurrencePattern_? : IfcRecurrencePattern | null
  private StartDate_? : string | null
  private FinishDate_? : string | null

  public get RecurrencePattern() : IfcRecurrencePattern | null {
    if ( this.RecurrencePattern_ === void 0 ) {
      this.RecurrencePattern_ = this.extractElement( 3, 3, 1, true, IfcRecurrencePattern )
    }

    return this.RecurrencePattern_ as IfcRecurrencePattern | null
  }

  public get StartDate() : string | null {
    if ( this.StartDate_ === void 0 ) {
      this.StartDate_ = this.extractString( 4, 3, 1, true )
    }

    return this.StartDate_ as string | null
  }

  public get FinishDate() : string | null {
    if ( this.FinishDate_ === void 0 ) {
      this.FinishDate_ = this.extractString( 5, 3, 1, true )
    }

    return this.FinishDate_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcWorkTime.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcWorkTime" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCWORKTIME ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCWORKTIME
}
