
import { IfcProcess } from "./index"
import { IfcEventTypeEnum, IfcEventTypeEnumDeserializeStep } from "./index"
import { IfcEventTriggerTypeEnum, IfcEventTriggerTypeEnumDeserializeStep } from "./index"
import { IfcLabel } from "./index"
import { IfcEventTime } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcevent.htm */
export  class IfcEvent extends IfcProcess {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCEVENT
  }
  private PredefinedType_? : IfcEventTypeEnum | null
  private EventTriggerType_? : IfcEventTriggerTypeEnum | null
  private UserDefinedEventTriggerType_? : string | null
  private EventOccurenceTime_? : IfcEventTime | null

  public get PredefinedType() : IfcEventTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 7, 7, 4, IfcEventTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcEventTypeEnum | null
  }

  public get EventTriggerType() : IfcEventTriggerTypeEnum | null {
    if ( this.EventTriggerType_ === void 0 ) {
      this.EventTriggerType_ = this.extractLambda( 8, 7, 4, IfcEventTriggerTypeEnumDeserializeStep, true )
    }

    return this.EventTriggerType_ as IfcEventTriggerTypeEnum | null
  }

  public get UserDefinedEventTriggerType() : string | null {
    if ( this.UserDefinedEventTriggerType_ === void 0 ) {
      this.UserDefinedEventTriggerType_ = this.extractString( 9, 7, 4, true )
    }

    return this.UserDefinedEventTriggerType_ as string | null
  }

  public get EventOccurenceTime() : IfcEventTime | null {
    if ( this.EventOccurenceTime_ === void 0 ) {
      this.EventOccurenceTime_ = this.extractElement( 10, 7, 4, true, IfcEventTime )
    }

    return this.EventOccurenceTime_ as IfcEventTime | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCEVENT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCEVENT
}
