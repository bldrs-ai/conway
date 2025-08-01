
import { date_and_time } from "./index"
import { date_time_role } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class date_and_time_assignment extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.DATE_AND_TIME_ASSIGNMENT
  }
  private assigned_date_and_time_? : date_and_time
  private role_? : date_time_role

  public get assigned_date_and_time() : date_and_time {
    if ( this.assigned_date_and_time_ === void 0 ) {
      this.assigned_date_and_time_ = this.extractElement( 0, 0, 0, false, date_and_time )
    }

    return this.assigned_date_and_time_ as date_and_time
  }

  public get role() : date_time_role {
    if ( this.role_ === void 0 ) {
      this.role_ = this.extractElement( 1, 0, 0, false, date_time_role )
    }

    return this.role_ as date_time_role
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === date_and_time_assignment.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for date_and_time_assignment" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query: EntityTypesAP214[] = 
    [  ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.DATE_AND_TIME_ASSIGNMENT
}
