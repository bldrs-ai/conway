
import { IfcFlowControllerType } from "./index"
import { IfcValveTypeEnum, IfcValveTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcvalvetype.htm */
export  class IfcValveType extends IfcFlowControllerType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCVALVETYPE
  }
  private PredefinedType_? : IfcValveTypeEnum

  public get PredefinedType() : IfcValveTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 8, IfcValveTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcValveTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCVALVETYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCVALVETYPE
}
