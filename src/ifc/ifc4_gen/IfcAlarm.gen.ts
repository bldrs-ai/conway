
import { IfcDistributionControlElement } from "./index"
import { IfcAlarmTypeEnum, IfcAlarmTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcalarm.htm */
export  class IfcAlarm extends IfcDistributionControlElement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCALARM
  }
  private PredefinedType_? : IfcAlarmTypeEnum | null

  public get PredefinedType() : IfcAlarmTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 7, IfcAlarmTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcAlarmTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCALARM ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCALARM
}
