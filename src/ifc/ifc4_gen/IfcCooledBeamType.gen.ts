
import { IfcEnergyConversionDeviceType } from "./index"
import { IfcCooledBeamTypeEnum, IfcCooledBeamTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccooledbeamtype.htm */
export  class IfcCooledBeamType extends IfcEnergyConversionDeviceType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCOOLEDBEAMTYPE
  }
  private PredefinedType_? : IfcCooledBeamTypeEnum

  public get PredefinedType() : IfcCooledBeamTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, IfcCooledBeamTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcCooledBeamTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCOOLEDBEAMTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCOOLEDBEAMTYPE
}
