
import { IfcEnergyConversionDevice } from "./index"
import { IfcCoilTypeEnum, IfcCoilTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccoil.htm */
export  class IfcCoil extends IfcEnergyConversionDevice {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCOIL
  }
  private PredefinedType_? : IfcCoilTypeEnum | null

  public get PredefinedType() : IfcCoilTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, IfcCoilTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcCoilTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCOIL ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCOIL
}
