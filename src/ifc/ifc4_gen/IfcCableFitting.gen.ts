
import { IfcFlowFitting } from "./index"
import { IfcCableFittingTypeEnum, IfcCableFittingTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccablefitting.htm */
export  class IfcCableFitting extends IfcFlowFitting {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCABLEFITTING
  }
  private PredefinedType_? : IfcCableFittingTypeEnum | null

  public get PredefinedType() : IfcCableFittingTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 8, IfcCableFittingTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcCableFittingTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCABLEFITTING ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCABLEFITTING
}
