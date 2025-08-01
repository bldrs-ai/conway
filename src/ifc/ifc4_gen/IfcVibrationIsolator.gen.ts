
import { IfcElementComponent } from "./index"
import { IfcVibrationIsolatorTypeEnum, IfcVibrationIsolatorTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcvibrationisolator.htm */
export  class IfcVibrationIsolator extends IfcElementComponent {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCVIBRATIONISOLATOR
  }
  private PredefinedType_? : IfcVibrationIsolatorTypeEnum | null

  public get PredefinedType() : IfcVibrationIsolatorTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 6, IfcVibrationIsolatorTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcVibrationIsolatorTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCVIBRATIONISOLATOR ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCVIBRATIONISOLATOR
}
