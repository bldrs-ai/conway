
import { IfcSchedulingTime } from "./index"
import { IfcTaskDurationEnum, IfcTaskDurationEnumDeserializeStep } from "./index"
import { IfcDuration } from "./index"
import { IfcDateTime } from "./index"
import { IfcBoolean } from "./index"
import { IfcPositiveRatioMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcTaskTime extends IfcSchedulingTime {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCTASKTIME
  }
  private DurationType_? : IfcTaskDurationEnum | null
  private ScheduleDuration_? : string | null
  private ScheduleStart_? : string | null
  private ScheduleFinish_? : string | null
  private EarlyStart_? : string | null
  private EarlyFinish_? : string | null
  private LateStart_? : string | null
  private LateFinish_? : string | null
  private FreeFloat_? : string | null
  private TotalFloat_? : string | null
  private IsCritical_? : boolean | null
  private StatusTime_? : string | null
  private ActualDuration_? : string | null
  private ActualStart_? : string | null
  private ActualFinish_? : string | null
  private RemainingTime_? : string | null
  private Completion_? : number | null

  public get DurationType() : IfcTaskDurationEnum | null {
    if ( this.DurationType_ === void 0 ) {
      this.DurationType_ = this.extractLambda( 3, 3, 1, IfcTaskDurationEnumDeserializeStep, true )
    }

    return this.DurationType_ as IfcTaskDurationEnum | null
  }

  public get ScheduleDuration() : string | null {
    if ( this.ScheduleDuration_ === void 0 ) {
      this.ScheduleDuration_ = this.extractString( 4, 3, 1, true )
    }

    return this.ScheduleDuration_ as string | null
  }

  public get ScheduleStart() : string | null {
    if ( this.ScheduleStart_ === void 0 ) {
      this.ScheduleStart_ = this.extractString( 5, 3, 1, true )
    }

    return this.ScheduleStart_ as string | null
  }

  public get ScheduleFinish() : string | null {
    if ( this.ScheduleFinish_ === void 0 ) {
      this.ScheduleFinish_ = this.extractString( 6, 3, 1, true )
    }

    return this.ScheduleFinish_ as string | null
  }

  public get EarlyStart() : string | null {
    if ( this.EarlyStart_ === void 0 ) {
      this.EarlyStart_ = this.extractString( 7, 3, 1, true )
    }

    return this.EarlyStart_ as string | null
  }

  public get EarlyFinish() : string | null {
    if ( this.EarlyFinish_ === void 0 ) {
      this.EarlyFinish_ = this.extractString( 8, 3, 1, true )
    }

    return this.EarlyFinish_ as string | null
  }

  public get LateStart() : string | null {
    if ( this.LateStart_ === void 0 ) {
      this.LateStart_ = this.extractString( 9, 3, 1, true )
    }

    return this.LateStart_ as string | null
  }

  public get LateFinish() : string | null {
    if ( this.LateFinish_ === void 0 ) {
      this.LateFinish_ = this.extractString( 10, 3, 1, true )
    }

    return this.LateFinish_ as string | null
  }

  public get FreeFloat() : string | null {
    if ( this.FreeFloat_ === void 0 ) {
      this.FreeFloat_ = this.extractString( 11, 3, 1, true )
    }

    return this.FreeFloat_ as string | null
  }

  public get TotalFloat() : string | null {
    if ( this.TotalFloat_ === void 0 ) {
      this.TotalFloat_ = this.extractString( 12, 3, 1, true )
    }

    return this.TotalFloat_ as string | null
  }

  public get IsCritical() : boolean | null {
    if ( this.IsCritical_ === void 0 ) {
      this.IsCritical_ = this.extractBoolean( 13, 3, 1, true )
    }

    return this.IsCritical_ as boolean | null
  }

  public get StatusTime() : string | null {
    if ( this.StatusTime_ === void 0 ) {
      this.StatusTime_ = this.extractString( 14, 3, 1, true )
    }

    return this.StatusTime_ as string | null
  }

  public get ActualDuration() : string | null {
    if ( this.ActualDuration_ === void 0 ) {
      this.ActualDuration_ = this.extractString( 15, 3, 1, true )
    }

    return this.ActualDuration_ as string | null
  }

  public get ActualStart() : string | null {
    if ( this.ActualStart_ === void 0 ) {
      this.ActualStart_ = this.extractString( 16, 3, 1, true )
    }

    return this.ActualStart_ as string | null
  }

  public get ActualFinish() : string | null {
    if ( this.ActualFinish_ === void 0 ) {
      this.ActualFinish_ = this.extractString( 17, 3, 1, true )
    }

    return this.ActualFinish_ as string | null
  }

  public get RemainingTime() : string | null {
    if ( this.RemainingTime_ === void 0 ) {
      this.RemainingTime_ = this.extractString( 18, 3, 1, true )
    }

    return this.RemainingTime_ as string | null
  }

  public get Completion() : number | null {
    if ( this.Completion_ === void 0 ) {
      this.Completion_ = this.extractNumber( 19, 3, 1, true )
    }

    return this.Completion_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcTaskTime.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcTaskTime" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCTASKTIME, EntityTypesIfc4x3.IFCTASKTIMERECURRING ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCTASKTIME
}
