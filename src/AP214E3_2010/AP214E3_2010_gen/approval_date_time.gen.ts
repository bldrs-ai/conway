
import { date } from "./index"
import { date_and_time } from "./index"
import { local_time } from "./index"
import { approval } from "./index"
import { object_role } from "./index"
import {
  get_role,
} from '../ap214_functions'

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/approval_date_time.htm */
export  class approval_date_time extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.APPROVAL_DATE_TIME
  }
  private date_time_? : date | date_and_time | local_time
  private dated_approval_? : approval

  public get date_time() : date | date_and_time | local_time {
    if ( this.date_time_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc > =
        this.extractReference( 0, false )

      if ( !( value instanceof date ) && !( value instanceof date_and_time ) && !( value instanceof local_time ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.date_time_ = value as (date | date_and_time | local_time)

    }

    return this.date_time_ as date | date_and_time | local_time
  }

  public get dated_approval() : approval {
    if ( this.dated_approval_ === void 0 ) {
      this.dated_approval_ = this.extractElement( 1, false, approval )
    }

    return this.dated_approval_ as approval
  }

  public get role() : object_role {
    return get_role(this);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.APPROVAL_DATE_TIME ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.APPROVAL_DATE_TIME
}
