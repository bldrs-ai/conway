
import { date } from "./index"
import { date_and_time } from "./index"
import { local_time } from "./index"
import { approval } from "./index"
import { object_role } from "./index"
import {
  get_role,
} from '../ap214_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class approval_date_time extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.APPROVAL_DATE_TIME
  }
  private date_time_? : date | date_and_time | local_time
  private dated_approval_? : approval

  public get date_time() : date | date_and_time | local_time {
    if ( this.date_time_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 0, 0, 0, false )

      if ( !( value instanceof date ) && !( value instanceof date_and_time ) && !( value instanceof local_time ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.date_time_ = value as (date | date_and_time | local_time)

    }

    return this.date_time_ as date | date_and_time | local_time
  }

  public get dated_approval() : approval {
    if ( this.dated_approval_ === void 0 ) {
      this.dated_approval_ = this.extractElement( 1, 0, 0, false, approval )
    }

    return this.dated_approval_ as approval
  }

  public get role() : object_role {
    return get_role(this);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === approval_date_time.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for approval_date_time" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.APPROVAL_DATE_TIME ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.APPROVAL_DATE_TIME
}
