
import { IfcFlowTreatmentDevice } from "./index"
import { IfcDuctSilencerTypeEnum, IfcDuctSilencerTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcductsilencer.htm */
export  class IfcDuctSilencer extends IfcFlowTreatmentDevice {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCDUCTSILENCER
  }
  private PredefinedType_? : IfcDuctSilencerTypeEnum | null

  public get PredefinedType() : IfcDuctSilencerTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, IfcDuctSilencerTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcDuctSilencerTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCDUCTSILENCER ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCDUCTSILENCER
}
