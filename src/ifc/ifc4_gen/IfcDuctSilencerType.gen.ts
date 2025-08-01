
import { IfcFlowTreatmentDeviceType } from "./index"
import { IfcDuctSilencerTypeEnum, IfcDuctSilencerTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcductsilencertype.htm */
export  class IfcDuctSilencerType extends IfcFlowTreatmentDeviceType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCDUCTSILENCERTYPE
  }
  private PredefinedType_? : IfcDuctSilencerTypeEnum

  public get PredefinedType() : IfcDuctSilencerTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 8, IfcDuctSilencerTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcDuctSilencerTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCDUCTSILENCERTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCDUCTSILENCERTYPE
}
