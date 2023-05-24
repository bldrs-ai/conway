
import { IfcFlowTerminal } from "./index"
import { IfcSpaceHeaterTypeEnum, IfcSpaceHeaterTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../core/step_entity_internal_reference'
import StepEntityBase from '../../core/step_entity_base'
import StepModelBase from '../../core/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcspaceheater.htm */
export  class IfcSpaceHeater extends IfcFlowTerminal {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSPACEHEATER
  }
  private PredefinedType_? : IfcSpaceHeaterTypeEnum | null

  public get PredefinedType() : IfcSpaceHeaterTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, IfcSpaceHeaterTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcSpaceHeaterTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSPACEHEATER ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSPACEHEATER
}
