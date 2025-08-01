
import { IfcProcess } from "./index"
import { IfcProcedureTypeEnum, IfcProcedureTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcprocedure.htm */
export  class IfcProcedure extends IfcProcess {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCPROCEDURE
  }
  private PredefinedType_? : IfcProcedureTypeEnum | null

  public get PredefinedType() : IfcProcedureTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 7, 7, 4, IfcProcedureTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcProcedureTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCPROCEDURE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCPROCEDURE
}
