
import { IfcFlowTerminal } from "./index"
import { IfcFireSuppressionTerminalTypeEnum, IfcFireSuppressionTerminalTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../core/step_entity_internal_reference'
import StepEntityBase from '../../core/step_entity_base'
import StepModelBase from '../../core/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcfiresuppressionterminal.htm */
export  class IfcFireSuppressionTerminal extends IfcFlowTerminal {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCFIRESUPPRESSIONTERMINAL
  }
  private PredefinedType_? : IfcFireSuppressionTerminalTypeEnum | null

  public get PredefinedType() : IfcFireSuppressionTerminalTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, IfcFireSuppressionTerminalTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcFireSuppressionTerminalTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCFIRESUPPRESSIONTERMINAL ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCFIRESUPPRESSIONTERMINAL
}
