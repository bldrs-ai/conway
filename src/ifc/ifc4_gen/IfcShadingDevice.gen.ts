
import { IfcBuildingElement } from "./index"
import { IfcShadingDeviceTypeEnum, IfcShadingDeviceTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcshadingdevice.htm */
export  class IfcShadingDevice extends IfcBuildingElement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSHADINGDEVICE
  }
  private PredefinedType_? : IfcShadingDeviceTypeEnum | null

  public get PredefinedType() : IfcShadingDeviceTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 6, IfcShadingDeviceTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcShadingDeviceTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSHADINGDEVICE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSHADINGDEVICE
}
