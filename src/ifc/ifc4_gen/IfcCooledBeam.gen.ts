
import { IfcEnergyConversionDevice } from "./index"
import { IfcCooledBeamTypeEnum, IfcCooledBeamTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccooledbeam.htm */
export  class IfcCooledBeam extends IfcEnergyConversionDevice {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCOOLEDBEAM
  }
  private PredefinedType_? : IfcCooledBeamTypeEnum | null

  public get PredefinedType() : IfcCooledBeamTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 8, IfcCooledBeamTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcCooledBeamTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCOOLEDBEAM ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCOOLEDBEAM
}
