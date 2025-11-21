
import { IfcSchedulingTime } from "./index"
import { IfcRecurrencePattern } from "./index"
import { IfcDate } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcworktime.htm */
export  class IfcWorkTime extends IfcSchedulingTime {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCWORKTIME
  }
  private RecurrencePattern_? : IfcRecurrencePattern | null
  private Start_? : string | null
  private Finish_? : string | null

  public get RecurrencePattern() : IfcRecurrencePattern | null {
    if ( this.RecurrencePattern_ === void 0 ) {
      this.RecurrencePattern_ = this.extractElement( 3, 3, 1, true, IfcRecurrencePattern )
    }

    return this.RecurrencePattern_ as IfcRecurrencePattern | null
  }

  public get Start() : string | null {
    if ( this.Start_ === void 0 ) {
      this.Start_ = this.extractString( 4, 3, 1, true )
    }

    return this.Start_ as string | null
  }

  public get Finish() : string | null {
    if ( this.Finish_ === void 0 ) {
      this.Finish_ = this.extractString( 5, 3, 1, true )
    }

    return this.Finish_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCWORKTIME ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCWORKTIME
}
