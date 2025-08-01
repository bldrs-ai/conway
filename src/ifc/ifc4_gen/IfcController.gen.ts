
import { IfcDistributionControlElement } from "./index"
import { IfcControllerTypeEnum, IfcControllerTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccontroller.htm */
export  class IfcController extends IfcDistributionControlElement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCONTROLLER
  }
  private PredefinedType_? : IfcControllerTypeEnum | null

  public get PredefinedType() : IfcControllerTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 7, IfcControllerTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcControllerTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCONTROLLER ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCONTROLLER
}
