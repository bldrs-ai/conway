
import { IfcWorkControl } from "./index"
import { IfcWorkScheduleTypeEnum, IfcWorkScheduleTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcworkschedule.htm */
export  class IfcWorkSchedule extends IfcWorkControl {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCWORKSCHEDULE
  }
  private PredefinedType_? : IfcWorkScheduleTypeEnum | null

  public get PredefinedType() : IfcWorkScheduleTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 13, 13, 5, IfcWorkScheduleTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcWorkScheduleTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCWORKSCHEDULE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCWORKSCHEDULE
}
