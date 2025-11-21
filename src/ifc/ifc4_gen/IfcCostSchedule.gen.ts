
import { IfcControl } from "./index"
import { IfcCostScheduleTypeEnum, IfcCostScheduleTypeEnumDeserializeStep } from "./index"
import { IfcLabel } from "./index"
import { IfcDateTime } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccostschedule.htm */
export  class IfcCostSchedule extends IfcControl {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCOSTSCHEDULE
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCOSTSCHEDULE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCOSTSCHEDULE
}
