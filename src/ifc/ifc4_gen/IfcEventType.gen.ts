
import { IfcTypeProcess } from "./index"
import { IfcEventTypeEnum, IfcEventTypeEnumDeserializeStep } from "./index"
import { IfcEventTriggerTypeEnum, IfcEventTriggerTypeEnumDeserializeStep } from "./index"
import { IfcLabel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifceventtype.htm */
export  class IfcEventType extends IfcTypeProcess {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCEVENTTYPE
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCEVENTTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCEVENTTYPE
}
