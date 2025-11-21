
import { IfcFlowFitting } from "./index"
import { IfcJunctionBoxTypeEnum, IfcJunctionBoxTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcjunctionbox.htm */
export  class IfcJunctionBox extends IfcFlowFitting {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCJUNCTIONBOX
  }
  private PredefinedType_? : IfcJunctionBoxTypeEnum | null

  public get PredefinedType() : IfcJunctionBoxTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 8, IfcJunctionBoxTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcJunctionBoxTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCJUNCTIONBOX ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCJUNCTIONBOX
}
