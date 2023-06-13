
import { IfcEnergyConversionDeviceType } from "./index"
import { IfcCondenserTypeEnum, IfcCondenserTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccondensertype.htm */
export  class IfcCondenserType extends IfcEnergyConversionDeviceType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCONDENSERTYPE
  }
  private PredefinedType_? : IfcCondenserTypeEnum

  public get PredefinedType() : IfcCondenserTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, IfcCondenserTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcCondenserTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCONDENSERTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCONDENSERTYPE
}
