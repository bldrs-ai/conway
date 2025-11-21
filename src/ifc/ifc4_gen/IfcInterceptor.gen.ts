
import { IfcFlowTreatmentDevice } from "./index"
import { IfcInterceptorTypeEnum, IfcInterceptorTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcinterceptor.htm */
export  class IfcInterceptor extends IfcFlowTreatmentDevice {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCINTERCEPTOR
  }
  private PredefinedType_? : IfcInterceptorTypeEnum | null

  public get PredefinedType() : IfcInterceptorTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 8, IfcInterceptorTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcInterceptorTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCINTERCEPTOR ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCINTERCEPTOR
}
