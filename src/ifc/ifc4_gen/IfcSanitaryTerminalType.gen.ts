
import { IfcFlowTerminalType } from "./index"
import { IfcSanitaryTerminalTypeEnum, IfcSanitaryTerminalTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcsanitaryterminaltype.htm */
export  class IfcSanitaryTerminalType extends IfcFlowTerminalType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSANITARYTERMINALTYPE
  }
  private PredefinedType_? : IfcSanitaryTerminalTypeEnum

  public get PredefinedType() : IfcSanitaryTerminalTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 8, IfcSanitaryTerminalTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcSanitaryTerminalTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSANITARYTERMINALTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSANITARYTERMINALTYPE
}
