
import { IfcSpatialElement } from "./index"
import { IfcSpatialZoneTypeEnum, IfcSpatialZoneTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcspatialzone.htm */
export  class IfcSpatialZone extends IfcSpatialElement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSPATIALZONE
  }
  private PredefinedType_? : IfcSpatialZoneTypeEnum | null

  public get PredefinedType() : IfcSpatialZoneTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 5, IfcSpatialZoneTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcSpatialZoneTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSPATIALZONE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSPATIALZONE
}
