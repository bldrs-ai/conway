
import { IfcFlowMovingDevice } from "./index"
import { IfcPumpTypeEnum, IfcPumpTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcpump.htm */
export  class IfcPump extends IfcFlowMovingDevice {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCPUMP
  }
  private PredefinedType_? : IfcPumpTypeEnum | null

  public get PredefinedType() : IfcPumpTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 8, IfcPumpTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcPumpTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCPUMP ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCPUMP
}
