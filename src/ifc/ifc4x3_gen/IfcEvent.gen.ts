
import { IfcProcess } from "./index"
import { IfcEventTypeEnum, IfcEventTypeEnumDeserializeStep } from "./index"
import { IfcEventTriggerTypeEnum, IfcEventTriggerTypeEnumDeserializeStep } from "./index"
import { IfcLabel } from "./index"
import { IfcEventTime } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcEvent extends IfcProcess {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCEVENT
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcEvent.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcEvent" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCEVENT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCEVENT
}
