
import { IfcFlowFittingType } from "./index"
import { IfcPipeFittingTypeEnum, IfcPipeFittingTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcpipefittingtype.htm */
export  class IfcPipeFittingType extends IfcFlowFittingType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCPIPEFITTINGTYPE
  }
  private PredefinedType_? : IfcPipeFittingTypeEnum

  public get PredefinedType() : IfcPipeFittingTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 8, IfcPipeFittingTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcPipeFittingTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCPIPEFITTINGTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCPIPEFITTINGTYPE
}
