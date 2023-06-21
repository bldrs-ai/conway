
import { IfcConstructionResource } from "./index"
import { IfcConstructionEquipmentResourceTypeEnum, IfcConstructionEquipmentResourceTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcconstructionequipmentresource.htm */
export  class IfcConstructionEquipmentResource extends IfcConstructionResource {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCONSTRUCTIONEQUIPMENTRESOURCE
  }
  private PredefinedType_? : IfcConstructionEquipmentResourceTypeEnum | null

  public get PredefinedType() : IfcConstructionEquipmentResourceTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 10, IfcConstructionEquipmentResourceTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcConstructionEquipmentResourceTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCONSTRUCTIONEQUIPMENTRESOURCE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCONSTRUCTIONEQUIPMENTRESOURCE
}