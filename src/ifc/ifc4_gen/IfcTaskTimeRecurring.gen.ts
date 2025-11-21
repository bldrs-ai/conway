
import { IfcTaskTime } from "./index"
import { IfcRecurrencePattern } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifctasktimerecurring.htm */
export  class IfcTaskTimeRecurring extends IfcTaskTime {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCTASKTIMERECURRING
  }
  private Recurrence_? : IfcRecurrencePattern

  public get Recurrence() : IfcRecurrencePattern {
    if ( this.Recurrence_ === void 0 ) {
      this.Recurrence_ = this.extractElement( 20, 20, 2, false, IfcRecurrencePattern )
    }

    return this.Recurrence_ as IfcRecurrencePattern
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCTASKTIMERECURRING ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCTASKTIMERECURRING
}
