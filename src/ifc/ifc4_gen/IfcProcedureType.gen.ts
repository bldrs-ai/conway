
import { IfcTypeProcess } from "./index"
import { IfcProcedureTypeEnum, IfcProcedureTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcproceduretype.htm */
export  class IfcProcedureType extends IfcTypeProcess {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCPROCEDURETYPE
  }
  private PredefinedType_? : IfcProcedureTypeEnum

  public get PredefinedType() : IfcProcedureTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, IfcProcedureTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcProcedureTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCPROCEDURETYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCPROCEDURETYPE
}
