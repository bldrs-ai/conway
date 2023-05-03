
import { IfcFlowController } from "./index"
import { IfcDamperTypeEnum, IfcDamperTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../core/step_entity_internal_reference'
import StepEntityBase from '../../core/step_entity_base'
import StepModelBase from '../../core/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcdamper.htm */
export  class IfcDamper extends IfcFlowController {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCDAMPER
  }
  private PredefinedType_? : IfcDamperTypeEnum | null

  public get PredefinedType() : IfcDamperTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, IfcDamperTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcDamperTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCDAMPER ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCDAMPER
}
