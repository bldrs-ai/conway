
import { IfcProcess } from "./index"
import { IfcLabel } from "./index"
import { IfcBoolean } from "./index"
import { IfcInteger } from "./index"
import { IfcTaskTime } from "./index"
import { IfcTaskTypeEnum, IfcTaskTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcTask extends IfcProcess {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCTASK
  }
  private Status_? : string | null
  private WorkMethod_? : string | null
  private IsMilestone_? : boolean
  private Priority_? : number | null
  private TaskTime_? : IfcTaskTime | null
  private PredefinedType_? : IfcTaskTypeEnum | null

  public get Status() : string | null {
    if ( this.Status_ === void 0 ) {
      this.Status_ = this.extractString( 7, 7, 4, true )
    }

    return this.Status_ as string | null
  }

  public get WorkMethod() : string | null {
    if ( this.WorkMethod_ === void 0 ) {
      this.WorkMethod_ = this.extractString( 8, 7, 4, true )
    }

    return this.WorkMethod_ as string | null
  }

  public get IsMilestone() : boolean {
    if ( this.IsMilestone_ === void 0 ) {
      this.IsMilestone_ = this.extractBoolean( 9, 7, 4, false )
    }

    return this.IsMilestone_ as boolean
  }

  public get Priority() : number | null {
    if ( this.Priority_ === void 0 ) {
      this.Priority_ = this.extractNumber( 10, 7, 4, true )
    }

    return this.Priority_ as number | null
  }

  public get TaskTime() : IfcTaskTime | null {
    if ( this.TaskTime_ === void 0 ) {
      this.TaskTime_ = this.extractElement( 11, 7, 4, true, IfcTaskTime )
    }

    return this.TaskTime_ as IfcTaskTime | null
  }

  public get PredefinedType() : IfcTaskTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 12, 7, 4, IfcTaskTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcTaskTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcTask.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcTask" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCTASK ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCTASK
}
