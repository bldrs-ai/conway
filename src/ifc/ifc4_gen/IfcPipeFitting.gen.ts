
import { IfcFlowFitting } from "./index"
import { IfcPipeFittingTypeEnum, IfcPipeFittingTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcpipefitting.htm */
export  class IfcPipeFitting extends IfcFlowFitting {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCPIPEFITTING
  }
  private PredefinedType_? : IfcPipeFittingTypeEnum | null

  public get PredefinedType() : IfcPipeFittingTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 8, IfcPipeFittingTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcPipeFittingTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCPIPEFITTING ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCPIPEFITTING
}
