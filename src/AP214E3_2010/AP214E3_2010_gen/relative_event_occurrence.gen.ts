
import { event_occurrence } from "./index"
import { time_measure_with_unit } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class relative_event_occurrence extends event_occurrence {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.RELATIVE_EVENT_OCCURRENCE
  }
  private base_event_? : event_occurrence
  private offset_? : time_measure_with_unit

  public get base_event() : event_occurrence {
    if ( this.base_event_ === void 0 ) {
      this.base_event_ = this.extractElement( 3, 3, 1, false, event_occurrence )
    }

    return this.base_event_ as event_occurrence
  }

  public get offset() : time_measure_with_unit {
    if ( this.offset_ === void 0 ) {
      this.offset_ = this.extractElement( 4, 3, 1, false, time_measure_with_unit )
    }

    return this.offset_ as time_measure_with_unit
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === relative_event_occurrence.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for relative_event_occurrence" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.RELATIVE_EVENT_OCCURRENCE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.RELATIVE_EVENT_OCCURRENCE
}
