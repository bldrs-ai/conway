
import { IfcEnergyConversionDevice } from "./index"
import { IfcEngineTypeEnum, IfcEngineTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcengine.htm */
export  class IfcEngine extends IfcEnergyConversionDevice {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCENGINE
  }
  private PredefinedType_? : IfcEngineTypeEnum | null

  public get PredefinedType() : IfcEngineTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 8, IfcEngineTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcEngineTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCENGINE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCENGINE
}
