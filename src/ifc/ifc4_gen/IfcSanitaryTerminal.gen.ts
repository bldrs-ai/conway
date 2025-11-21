
import { IfcFlowTerminal } from "./index"
import { IfcSanitaryTerminalTypeEnum, IfcSanitaryTerminalTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcsanitaryterminal.htm */
export  class IfcSanitaryTerminal extends IfcFlowTerminal {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSANITARYTERMINAL
  }
  private PredefinedType_? : IfcSanitaryTerminalTypeEnum | null

  public get PredefinedType() : IfcSanitaryTerminalTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 8, IfcSanitaryTerminalTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcSanitaryTerminalTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSANITARYTERMINAL ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSANITARYTERMINAL
}
