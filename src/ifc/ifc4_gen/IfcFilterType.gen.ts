
import { IfcFlowTreatmentDeviceType } from "./index"
import { IfcFilterTypeEnum, IfcFilterTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcfiltertype.htm */
export  class IfcFilterType extends IfcFlowTreatmentDeviceType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCFILTERTYPE
  }
  private PredefinedType_? : IfcFilterTypeEnum

  public get PredefinedType() : IfcFilterTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 8, IfcFilterTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcFilterTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCFILTERTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCFILTERTYPE
}
