
import { IfcFlowTerminalType } from "./index"
import { IfcAirTerminalTypeEnum, IfcAirTerminalTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcairterminaltype.htm */
export  class IfcAirTerminalType extends IfcFlowTerminalType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCAIRTERMINALTYPE
  }
  private PredefinedType_? : IfcAirTerminalTypeEnum

  public get PredefinedType() : IfcAirTerminalTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 8, IfcAirTerminalTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcAirTerminalTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCAIRTERMINALTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCAIRTERMINALTYPE
}
