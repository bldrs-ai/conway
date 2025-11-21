
import { IfcFlowMovingDevice } from "./index"
import { IfcFanTypeEnum, IfcFanTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcfan.htm */
export  class IfcFan extends IfcFlowMovingDevice {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCFAN
  }
  private PredefinedType_? : IfcFanTypeEnum | null

  public get PredefinedType() : IfcFanTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 8, IfcFanTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcFanTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCFAN ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCFAN
}
