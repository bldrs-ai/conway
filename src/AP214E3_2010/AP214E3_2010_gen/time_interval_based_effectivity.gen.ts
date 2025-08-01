
import { effectivity } from "./index"
import { time_interval } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class time_interval_based_effectivity extends effectivity {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.TIME_INTERVAL_BASED_EFFECTIVITY
  }
  private effectivity_period_? : time_interval

  public get effectivity_period() : time_interval {
    if ( this.effectivity_period_ === void 0 ) {
      this.effectivity_period_ = this.extractElement( 1, 1, 1, false, time_interval )
    }

    return this.effectivity_period_ as time_interval
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === time_interval_based_effectivity.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for time_interval_based_effectivity" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.TIME_INTERVAL_BASED_EFFECTIVITY ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.TIME_INTERVAL_BASED_EFFECTIVITY
}
