
import { IfcBuildingElement } from "./index"
import { IfcRoofTypeEnum, IfcRoofTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcroof.htm */
export  class IfcRoof extends IfcBuildingElement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCROOF
  }
  private PredefinedType_? : IfcRoofTypeEnum | null

  public get PredefinedType() : IfcRoofTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 6, IfcRoofTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcRoofTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCROOF ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCROOF
}
