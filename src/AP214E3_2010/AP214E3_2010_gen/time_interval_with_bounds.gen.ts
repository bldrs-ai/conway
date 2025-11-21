
import { time_interval } from "./index"
import { date } from "./index"
import { date_and_time } from "./index"
import { local_time } from "./index"
import { event_occurrence } from "./index"
import { time_measure_with_unit } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class time_interval_with_bounds extends time_interval {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.TIME_INTERVAL_WITH_BOUNDS
  }
  private primary_bound_? : date | date_and_time | local_time | event_occurrence | null
  private secondary_bound_? : date | date_and_time | local_time | event_occurrence | null
  private duration_? : time_measure_with_unit | null

  public get primary_bound() : date | date_and_time | local_time | event_occurrence | null {
    if ( this.primary_bound_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 >| null = 
        this.extractReference( 3, 3, 1, true )

      if ( !( value instanceof date ) && !( value instanceof date_and_time ) && !( value instanceof local_time ) && !( value instanceof event_occurrence ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.primary_bound_ = value as (date | date_and_time | local_time | event_occurrence)

    }

    return this.primary_bound_ as date | date_and_time | local_time | event_occurrence | null
  }

  public get secondary_bound() : date | date_and_time | local_time | event_occurrence | null {
    if ( this.secondary_bound_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 >| null = 
        this.extractReference( 4, 3, 1, true )

      if ( !( value instanceof date ) && !( value instanceof date_and_time ) && !( value instanceof local_time ) && !( value instanceof event_occurrence ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.secondary_bound_ = value as (date | date_and_time | local_time | event_occurrence)

    }

    return this.secondary_bound_ as date | date_and_time | local_time | event_occurrence | null
  }

  public get duration() : time_measure_with_unit | null {
    if ( this.duration_ === void 0 ) {
      this.duration_ = this.extractElement( 5, 3, 1, true, time_measure_with_unit )
    }

    return this.duration_ as time_measure_with_unit | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === time_interval_with_bounds.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for time_interval_with_bounds" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.TIME_INTERVAL_WITH_BOUNDS ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.TIME_INTERVAL_WITH_BOUNDS
}
