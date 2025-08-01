
import { IfcEnergyConversionDevice } from "./index"
import { IfcBurnerTypeEnum, IfcBurnerTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcburner.htm */
export  class IfcBurner extends IfcEnergyConversionDevice {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCBURNER
  }
  private PredefinedType_? : IfcBurnerTypeEnum | null

  public get PredefinedType() : IfcBurnerTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 8, IfcBurnerTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcBurnerTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCBURNER ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCBURNER
}
