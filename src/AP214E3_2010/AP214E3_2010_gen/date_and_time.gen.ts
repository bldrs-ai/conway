
import { date } from "./index"
import { local_time } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class date_and_time extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.DATE_AND_TIME
  }
  private date_component_? : date
  private time_component_? : local_time

  public get date_component() : date {
    if ( this.date_component_ === void 0 ) {
      this.date_component_ = this.extractElement( 0, 0, 0, false, date )
    }

    return this.date_component_ as date
  }

  public get time_component() : local_time {
    if ( this.time_component_ === void 0 ) {
      this.time_component_ = this.extractElement( 1, 0, 0, false, local_time )
    }

    return this.time_component_ as local_time
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === date_and_time.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for date_and_time" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.DATE_AND_TIME ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.DATE_AND_TIME
}
