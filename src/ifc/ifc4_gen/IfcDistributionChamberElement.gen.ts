
import { IfcDistributionFlowElement } from "./index"
import { IfcDistributionChamberElementTypeEnum, IfcDistributionChamberElementTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcdistributionchamberelement.htm */
export  class IfcDistributionChamberElement extends IfcDistributionFlowElement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCDISTRIBUTIONCHAMBERELEMENT
  }
  private PredefinedType_? : IfcDistributionChamberElementTypeEnum | null

  public get PredefinedType() : IfcDistributionChamberElementTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 7, IfcDistributionChamberElementTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcDistributionChamberElementTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCDISTRIBUTIONCHAMBERELEMENT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCDISTRIBUTIONCHAMBERELEMENT
}
