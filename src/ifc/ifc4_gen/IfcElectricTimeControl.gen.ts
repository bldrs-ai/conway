
import { IfcFlowController } from "./index"
import { IfcElectricTimeControlTypeEnum, IfcElectricTimeControlTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcelectrictimecontrol.htm */
export  class IfcElectricTimeControl extends IfcFlowController {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCELECTRICTIMECONTROL
  }
  private PredefinedType_? : IfcElectricTimeControlTypeEnum | null

  public get PredefinedType() : IfcElectricTimeControlTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 8, IfcElectricTimeControlTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcElectricTimeControlTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCELECTRICTIMECONTROL ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCELECTRICTIMECONTROL
}
