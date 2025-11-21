
import { IfcFlowTreatmentDeviceType } from "./index"
import { IfcInterceptorTypeEnum, IfcInterceptorTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcinterceptortype.htm */
export  class IfcInterceptorType extends IfcFlowTreatmentDeviceType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCINTERCEPTORTYPE
  }
  private PredefinedType_? : IfcInterceptorTypeEnum

  public get PredefinedType() : IfcInterceptorTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 8, IfcInterceptorTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcInterceptorTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCINTERCEPTORTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCINTERCEPTORTYPE
}
