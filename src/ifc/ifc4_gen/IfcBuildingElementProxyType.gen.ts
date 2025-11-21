
import { IfcBuildingElementType } from "./index"
import { IfcBuildingElementProxyTypeEnum, IfcBuildingElementProxyTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcbuildingelementproxytype.htm */
export  class IfcBuildingElementProxyType extends IfcBuildingElementType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCBUILDINGELEMENTPROXYTYPE
  }
  private PredefinedType_? : IfcBuildingElementProxyTypeEnum

  public get PredefinedType() : IfcBuildingElementProxyTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 6, IfcBuildingElementProxyTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcBuildingElementProxyTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCBUILDINGELEMENTPROXYTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCBUILDINGELEMENTPROXYTYPE
}
