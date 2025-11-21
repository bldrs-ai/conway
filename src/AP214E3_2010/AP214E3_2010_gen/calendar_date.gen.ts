
import { date } from "./index"
import { day_in_month_number } from "./index"
import { month_in_year_number } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class calendar_date extends date {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.CALENDAR_DATE
  }
  private day_component_? : number
  private month_component_? : number

  public get day_component() : number {
    if ( this.day_component_ === void 0 ) {
      this.day_component_ = this.extractNumber( 1, 1, 1, false )
    }

    return this.day_component_ as number
  }

  public get month_component() : number {
    if ( this.month_component_ === void 0 ) {
      this.month_component_ = this.extractNumber( 2, 1, 1, false )
    }

    return this.month_component_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === calendar_date.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for calendar_date" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.CALENDAR_DATE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.CALENDAR_DATE
}
