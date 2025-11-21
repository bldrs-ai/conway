
import { effectivity } from "./index"
import { date } from "./index"
import { date_and_time } from "./index"
import { local_time } from "./index"
import { event_occurrence } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class dated_effectivity extends effectivity {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.DATED_EFFECTIVITY
  }
  private effectivity_end_date_? : date | date_and_time | local_time | event_occurrence | null
  private effectivity_start_date_? : date | date_and_time | local_time | event_occurrence

  public get effectivity_end_date() : date | date_and_time | local_time | event_occurrence | null {
    if ( this.effectivity_end_date_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 >| null = 
        this.extractReference( 1, 1, 1, true )

      if ( !( value instanceof date ) && !( value instanceof date_and_time ) && !( value instanceof local_time ) && !( value instanceof event_occurrence ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.effectivity_end_date_ = value as (date | date_and_time | local_time | event_occurrence)

    }

    return this.effectivity_end_date_ as date | date_and_time | local_time | event_occurrence | null
  }

  public get effectivity_start_date() : date | date_and_time | local_time | event_occurrence {
    if ( this.effectivity_start_date_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 2, 1, 1, false )

      if ( !( value instanceof date ) && !( value instanceof date_and_time ) && !( value instanceof local_time ) && !( value instanceof event_occurrence ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.effectivity_start_date_ = value as (date | date_and_time | local_time | event_occurrence)

    }

    return this.effectivity_start_date_ as date | date_and_time | local_time | event_occurrence
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === dated_effectivity.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for dated_effectivity" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.DATED_EFFECTIVITY ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.DATED_EFFECTIVITY
}
