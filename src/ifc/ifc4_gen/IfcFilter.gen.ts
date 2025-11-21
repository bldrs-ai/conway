
import { IfcFlowTreatmentDevice } from "./index"
import { IfcFilterTypeEnum, IfcFilterTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcfilter.htm */
export  class IfcFilter extends IfcFlowTreatmentDevice {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCFILTER
  }
  private PredefinedType_? : IfcFilterTypeEnum | null

  public get PredefinedType() : IfcFilterTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 8, IfcFilterTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcFilterTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCFILTER ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCFILTER
}
