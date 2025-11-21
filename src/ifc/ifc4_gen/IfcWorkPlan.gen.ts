
import { IfcWorkControl } from "./index"
import { IfcWorkPlanTypeEnum, IfcWorkPlanTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcworkplan.htm */
export  class IfcWorkPlan extends IfcWorkControl {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCWORKPLAN
  }
  private PredefinedType_? : IfcWorkPlanTypeEnum | null

  public get PredefinedType() : IfcWorkPlanTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 13, 13, 5, IfcWorkPlanTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcWorkPlanTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCWORKPLAN ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCWORKPLAN
}
