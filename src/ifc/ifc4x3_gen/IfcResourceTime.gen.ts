
import { IfcSchedulingTime } from "./index"
import { IfcDuration } from "./index"
import { IfcPositiveRatioMeasure } from "./index"
import { IfcDateTime } from "./index"
import { IfcLabel } from "./index"
import { IfcBoolean } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcResourceTime extends IfcSchedulingTime {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCRESOURCETIME
  }
  private ScheduleWork_? : string | null
  private ScheduleUsage_? : number | null
  private ScheduleStart_? : string | null
  private ScheduleFinish_? : string | null
  private ScheduleContour_? : string | null
  private LevelingDelay_? : string | null
  private IsOverAllocated_? : boolean | null
  private StatusTime_? : string | null
  private ActualWork_? : string | null
  private ActualUsage_? : number | null
  private ActualStart_? : string | null
  private ActualFinish_? : string | null
  private RemainingWork_? : string | null
  private RemainingUsage_? : number | null
  private Completion_? : number | null

  public get ScheduleWork() : string | null {
    if ( this.ScheduleWork_ === void 0 ) {
      this.ScheduleWork_ = this.extractString( 3, 3, 1, true )
    }

    return this.ScheduleWork_ as string | null
  }

  public get ScheduleUsage() : number | null {
    if ( this.ScheduleUsage_ === void 0 ) {
      this.ScheduleUsage_ = this.extractNumber( 4, 3, 1, true )
    }

    return this.ScheduleUsage_ as number | null
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

  public get ScheduleContour() : string | null {
    if ( this.ScheduleContour_ === void 0 ) {
      this.ScheduleContour_ = this.extractString( 7, 3, 1, true )
    }

    return this.ScheduleContour_ as string | null
  }

  public get LevelingDelay() : string | null {
    if ( this.LevelingDelay_ === void 0 ) {
      this.LevelingDelay_ = this.extractString( 8, 3, 1, true )
    }

    return this.LevelingDelay_ as string | null
  }

  public get IsOverAllocated() : boolean | null {
    if ( this.IsOverAllocated_ === void 0 ) {
      this.IsOverAllocated_ = this.extractBoolean( 9, 3, 1, true )
    }

    return this.IsOverAllocated_ as boolean | null
  }

  public get StatusTime() : string | null {
    if ( this.StatusTime_ === void 0 ) {
      this.StatusTime_ = this.extractString( 10, 3, 1, true )
    }

    return this.StatusTime_ as string | null
  }

  public get ActualWork() : string | null {
    if ( this.ActualWork_ === void 0 ) {
      this.ActualWork_ = this.extractString( 11, 3, 1, true )
    }

    return this.ActualWork_ as string | null
  }

  public get ActualUsage() : number | null {
    if ( this.ActualUsage_ === void 0 ) {
      this.ActualUsage_ = this.extractNumber( 12, 3, 1, true )
    }

    return this.ActualUsage_ as number | null
  }

  public get ActualStart() : string | null {
    if ( this.ActualStart_ === void 0 ) {
      this.ActualStart_ = this.extractString( 13, 3, 1, true )
    }

    return this.ActualStart_ as string | null
  }

  public get ActualFinish() : string | null {
    if ( this.ActualFinish_ === void 0 ) {
      this.ActualFinish_ = this.extractString( 14, 3, 1, true )
    }

    return this.ActualFinish_ as string | null
  }

  public get RemainingWork() : string | null {
    if ( this.RemainingWork_ === void 0 ) {
      this.RemainingWork_ = this.extractString( 15, 3, 1, true )
    }

    return this.RemainingWork_ as string | null
  }

  public get RemainingUsage() : number | null {
    if ( this.RemainingUsage_ === void 0 ) {
      this.RemainingUsage_ = this.extractNumber( 16, 3, 1, true )
    }

    return this.RemainingUsage_ as number | null
  }

  public get Completion() : number | null {
    if ( this.Completion_ === void 0 ) {
      this.Completion_ = this.extractNumber( 17, 3, 1, true )
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
        multiReference.find( ( item ) => item.typeID === IfcResourceTime.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcResourceTime" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCRESOURCETIME ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCRESOURCETIME
}
