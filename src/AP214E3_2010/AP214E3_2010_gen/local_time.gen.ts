
import { hour_in_day } from "./index"
import { minute_in_hour } from "./index"
import { second_in_minute } from "./index"
import { coordinated_universal_time_offset } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class local_time extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.LOCAL_TIME
  }
  private hour_component_? : number
  private minute_component_? : number | null
  private second_component_? : number | null
  private zone_? : coordinated_universal_time_offset

  public get hour_component() : number {
    if ( this.hour_component_ === void 0 ) {
      this.hour_component_ = this.extractNumber( 0, 0, 0, false )
    }

    return this.hour_component_ as number
  }

  public get minute_component() : number | null {
    if ( this.minute_component_ === void 0 ) {
      this.minute_component_ = this.extractNumber( 1, 0, 0, true )
    }

    return this.minute_component_ as number | null
  }

  public get second_component() : number | null {
    if ( this.second_component_ === void 0 ) {
      this.second_component_ = this.extractNumber( 2, 0, 0, true )
    }

    return this.second_component_ as number | null
  }

  public get zone() : coordinated_universal_time_offset {
    if ( this.zone_ === void 0 ) {
      this.zone_ = this.extractElement( 3, 0, 0, false, coordinated_universal_time_offset )
    }

    return this.zone_ as coordinated_universal_time_offset
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === local_time.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for local_time" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.LOCAL_TIME ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.LOCAL_TIME
}
