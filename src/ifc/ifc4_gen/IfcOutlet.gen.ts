
import { IfcFlowTerminal } from "./index"
import { IfcOutletTypeEnum, IfcOutletTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcoutlet.htm */
export  class IfcOutlet extends IfcFlowTerminal {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCOUTLET
  }
  private PredefinedType_? : IfcOutletTypeEnum | null

  public get PredefinedType() : IfcOutletTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 8, IfcOutletTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcOutletTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCOUTLET ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCOUTLET
}
