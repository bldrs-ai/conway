
import { IfcEnergyConversionDevice } from "./index"
import { IfcTransformerTypeEnum, IfcTransformerTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../core/step_entity_internal_reference'
import StepEntityBase from '../../core/step_entity_base'
import StepModelBase from '../../core/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifctransformer.htm */
export  class IfcTransformer extends IfcEnergyConversionDevice {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCTRANSFORMER
  }
  private PredefinedType_? : IfcTransformerTypeEnum | null

  public get PredefinedType() : IfcTransformerTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, IfcTransformerTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcTransformerTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCTRANSFORMER ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCTRANSFORMER
}
