
import { IfcBuildingElement } from "./index"
import { IfcPileTypeEnum, IfcPileTypeEnumDeserializeStep } from "./index"
import { IfcPileConstructionEnum, IfcPileConstructionEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcpile.htm */
export  class IfcPile extends IfcBuildingElement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCPILE
  }
  private PredefinedType_? : IfcPileTypeEnum | null
  private ConstructionType_? : IfcPileConstructionEnum | null

  public get PredefinedType() : IfcPileTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 6, IfcPileTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcPileTypeEnum | null
  }

  public get ConstructionType() : IfcPileConstructionEnum | null {
    if ( this.ConstructionType_ === void 0 ) {
      this.ConstructionType_ = this.extractLambda( 9, 8, 6, IfcPileConstructionEnumDeserializeStep, true )
    }

    return this.ConstructionType_ as IfcPileConstructionEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCPILE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCPILE
}
