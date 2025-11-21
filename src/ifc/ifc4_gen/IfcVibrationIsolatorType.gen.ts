
import { IfcElementComponentType } from "./index"
import { IfcVibrationIsolatorTypeEnum, IfcVibrationIsolatorTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcvibrationisolatortype.htm */
export  class IfcVibrationIsolatorType extends IfcElementComponentType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCVIBRATIONISOLATORTYPE
  }
  private PredefinedType_? : IfcVibrationIsolatorTypeEnum

  public get PredefinedType() : IfcVibrationIsolatorTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 6, IfcVibrationIsolatorTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcVibrationIsolatorTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCVIBRATIONISOLATORTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCVIBRATIONISOLATORTYPE
}
