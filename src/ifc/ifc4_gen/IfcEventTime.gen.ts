
import { IfcSchedulingTime } from "./index"
import { IfcDateTime } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifceventtime.htm */
export  class IfcEventTime extends IfcSchedulingTime {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCEVENTTIME
  }
  private ActualDate_? : string | null
  private EarlyDate_? : string | null
  private LateDate_? : string | null
  private ScheduleDate_? : string | null

  public get ActualDate() : string | null {
    if ( this.ActualDate_ === void 0 ) {
      this.ActualDate_ = this.extractString( 3, 3, 1, true )
    }

    return this.ActualDate_ as string | null
  }

  public get EarlyDate() : string | null {
    if ( this.EarlyDate_ === void 0 ) {
      this.EarlyDate_ = this.extractString( 4, 3, 1, true )
    }

    return this.EarlyDate_ as string | null
  }

  public get LateDate() : string | null {
    if ( this.LateDate_ === void 0 ) {
      this.LateDate_ = this.extractString( 5, 3, 1, true )
    }

    return this.LateDate_ as string | null
  }

  public get ScheduleDate() : string | null {
    if ( this.ScheduleDate_ === void 0 ) {
      this.ScheduleDate_ = this.extractString( 6, 3, 1, true )
    }

    return this.ScheduleDate_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCEVENTTIME ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCEVENTTIME
}
