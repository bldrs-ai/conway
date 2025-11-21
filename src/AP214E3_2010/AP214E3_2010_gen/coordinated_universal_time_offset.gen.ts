
import { ahead_or_behind, ahead_or_behindDeserializeStep } from "./index"
import {
  NVL,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class coordinated_universal_time_offset extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.COORDINATED_UNIVERSAL_TIME_OFFSET
  }
  private hour_offset_? : number
  private minute_offset_? : number | null
  private sense_? : ahead_or_behind

  public get hour_offset() : number {
    if ( this.hour_offset_ === void 0 ) {
      this.hour_offset_ = this.extractNumber( 0, 0, 0, false )
    }

    return this.hour_offset_ as number
  }

  public get minute_offset() : number | null {
    if ( this.minute_offset_ === void 0 ) {
      this.minute_offset_ = this.extractNumber( 1, 0, 0, true )
    }

    return this.minute_offset_ as number | null
  }

  public get sense() : ahead_or_behind {
    if ( this.sense_ === void 0 ) {
      this.sense_ = this.extractLambda( 2, 0, 0, ahead_or_behindDeserializeStep, false )
    }

    return this.sense_ as ahead_or_behind
  }

  public get actual_minute_offset() : number {
    return NVL(this?.minute_offset,0);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === coordinated_universal_time_offset.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for coordinated_universal_time_offset" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.COORDINATED_UNIVERSAL_TIME_OFFSET ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.COORDINATED_UNIVERSAL_TIME_OFFSET
}
