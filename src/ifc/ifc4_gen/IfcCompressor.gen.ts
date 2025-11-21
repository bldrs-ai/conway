
import { IfcFlowMovingDevice } from "./index"
import { IfcCompressorTypeEnum, IfcCompressorTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccompressor.htm */
export  class IfcCompressor extends IfcFlowMovingDevice {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCOMPRESSOR
  }
  private PredefinedType_? : IfcCompressorTypeEnum | null

  public get PredefinedType() : IfcCompressorTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 8, IfcCompressorTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcCompressorTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCOMPRESSOR ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCOMPRESSOR
}
