
import { IfcBuildingElement } from "./index"
import { IfcStairTypeEnum, IfcStairTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcstair.htm */
export  class IfcStair extends IfcBuildingElement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSTAIR
  }
  private PredefinedType_? : IfcStairTypeEnum | null

  public get PredefinedType() : IfcStairTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 6, IfcStairTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcStairTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSTAIR ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSTAIR
}
