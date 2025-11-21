
import { IfcFlowController } from "./index"
import { IfcValveTypeEnum, IfcValveTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcvalve.htm */
export  class IfcValve extends IfcFlowController {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCVALVE
  }
  private PredefinedType_? : IfcValveTypeEnum | null

  public get PredefinedType() : IfcValveTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 8, IfcValveTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcValveTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCVALVE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCVALVE
}
