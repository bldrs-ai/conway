
import { IfcTypeProcess } from "./index"
import { IfcEventTypeEnum, IfcEventTypeEnumDeserializeStep } from "./index"
import { IfcEventTriggerTypeEnum, IfcEventTriggerTypeEnumDeserializeStep } from "./index"
import { IfcLabel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcEventType extends IfcTypeProcess {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCEVENTTYPE
  }
  private PredefinedType_? : IfcEventTypeEnum
  private EventTriggerType_? : IfcEventTriggerTypeEnum
  private UserDefinedEventTriggerType_? : string | null

  public get PredefinedType() : IfcEventTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 4, IfcEventTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcEventTypeEnum
  }

  public get EventTriggerType() : IfcEventTriggerTypeEnum {
    if ( this.EventTriggerType_ === void 0 ) {
      this.EventTriggerType_ = this.extractLambda( 10, 9, 4, IfcEventTriggerTypeEnumDeserializeStep, false )
    }

    return this.EventTriggerType_ as IfcEventTriggerTypeEnum
  }

  public get UserDefinedEventTriggerType() : string | null {
    if ( this.UserDefinedEventTriggerType_ === void 0 ) {
      this.UserDefinedEventTriggerType_ = this.extractString( 11, 9, 4, true )
    }

    return this.UserDefinedEventTriggerType_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcEventType.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcEventType" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCEVENTTYPE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCEVENTTYPE
}
