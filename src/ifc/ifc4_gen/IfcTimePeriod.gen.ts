
import { IfcTime } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifctimeperiod.htm */
export  class IfcTimePeriod extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCTIMEPERIOD
  }
  private StartTime_? : string
  private EndTime_? : string

  public get StartTime() : string {
    if ( this.StartTime_ === void 0 ) {
      this.StartTime_ = this.extractString( 0, 0, 0, false )
    }

    return this.StartTime_ as string
  }

  public get EndTime() : string {
    if ( this.EndTime_ === void 0 ) {
      this.EndTime_ = this.extractString( 1, 0, 0, false )
    }

    return this.EndTime_ as string
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCTIMEPERIOD ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCTIMEPERIOD
}
