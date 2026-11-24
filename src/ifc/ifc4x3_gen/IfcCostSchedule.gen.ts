
import { IfcControl } from "./index"
import { IfcCostScheduleTypeEnum, IfcCostScheduleTypeEnumDeserializeStep } from "./index"
import { IfcLabel } from "./index"
import { IfcDateTime } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcCostSchedule extends IfcControl {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCCOSTSCHEDULE
  }
  private PredefinedType_? : IfcCostScheduleTypeEnum | null
  private Status_? : string | null
  private SubmittedOn_? : string | null
  private UpdateDate_? : string | null

  public get PredefinedType() : IfcCostScheduleTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 6, 6, 4, IfcCostScheduleTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcCostScheduleTypeEnum | null
  }

  public get Status() : string | null {
    if ( this.Status_ === void 0 ) {
      this.Status_ = this.extractString( 7, 6, 4, true )
    }

    return this.Status_ as string | null
  }

  public get SubmittedOn() : string | null {
    if ( this.SubmittedOn_ === void 0 ) {
      this.SubmittedOn_ = this.extractString( 8, 6, 4, true )
    }

    return this.SubmittedOn_ as string | null
  }

  public get UpdateDate() : string | null {
    if ( this.UpdateDate_ === void 0 ) {
      this.UpdateDate_ = this.extractString( 9, 6, 4, true )
    }

    return this.UpdateDate_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcCostSchedule.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcCostSchedule" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCCOSTSCHEDULE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCCOSTSCHEDULE
}
