
import { IfcExternalSpatialStructureElement } from "./index"
import { IfcExternalSpatialElementTypeEnum, IfcExternalSpatialElementTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../core/step_entity_internal_reference'
import StepEntityBase from '../../core/step_entity_base'
import StepModelBase from '../../core/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcexternalspatialelement.htm */
export  class IfcExternalSpatialElement extends IfcExternalSpatialStructureElement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCEXTERNALSPATIALELEMENT
  }
  private PredefinedType_? : IfcExternalSpatialElementTypeEnum | null

  public get PredefinedType() : IfcExternalSpatialElementTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, IfcExternalSpatialElementTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcExternalSpatialElementTypeEnum | null
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCEXTERNALSPATIALELEMENT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCEXTERNALSPATIALELEMENT
}
