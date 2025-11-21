
import { IfcBuildingElement } from "./index"
import { IfcFootingTypeEnum, IfcFootingTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcfooting.htm */
export  class IfcFooting extends IfcBuildingElement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCFOOTING
  }
  private PredefinedType_? : IfcFootingTypeEnum | null

  public get PredefinedType() : IfcFootingTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 6, IfcFootingTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcFootingTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCFOOTING ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCFOOTING
}
