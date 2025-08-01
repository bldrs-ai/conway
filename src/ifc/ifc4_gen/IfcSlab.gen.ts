
import { IfcBuildingElement } from "./index"
import { IfcSlabTypeEnum, IfcSlabTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcslab.htm */
export  class IfcSlab extends IfcBuildingElement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSLAB
  }
  private PredefinedType_? : IfcSlabTypeEnum | null

  public get PredefinedType() : IfcSlabTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 6, IfcSlabTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcSlabTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSLAB, EntityTypesIfc.IFCSLABELEMENTEDCASE, EntityTypesIfc.IFCSLABSTANDARDCASE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSLAB
}
