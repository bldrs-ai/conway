
import { IfcDistributionFlowElementType } from "./index"
import { IfcDistributionChamberElementTypeEnum, IfcDistributionChamberElementTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcdistributionchamberelementtype.htm */
export  class IfcDistributionChamberElementType extends IfcDistributionFlowElementType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCDISTRIBUTIONCHAMBERELEMENTTYPE
  }
  private PredefinedType_? : IfcDistributionChamberElementTypeEnum

  public get PredefinedType() : IfcDistributionChamberElementTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 7, IfcDistributionChamberElementTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcDistributionChamberElementTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCDISTRIBUTIONCHAMBERELEMENTTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCDISTRIBUTIONCHAMBERELEMENTTYPE
}
