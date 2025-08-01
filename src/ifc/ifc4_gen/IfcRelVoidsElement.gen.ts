
import { IfcRelDecomposes } from "./index"
import { IfcElement } from "./index"
import { IfcFeatureElementSubtraction } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrelvoidselement.htm */
export  class IfcRelVoidsElement extends IfcRelDecomposes {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRELVOIDSELEMENT
  }
  private RelatingBuildingElement_? : IfcElement
  private RelatedOpeningElement_? : IfcFeatureElementSubtraction

  public get RelatingBuildingElement() : IfcElement {
    if ( this.RelatingBuildingElement_ === void 0 ) {
      this.RelatingBuildingElement_ = this.extractElement( 4, 4, 3, false, IfcElement )
    }

    return this.RelatingBuildingElement_ as IfcElement
  }

  public get RelatedOpeningElement() : IfcFeatureElementSubtraction {
    if ( this.RelatedOpeningElement_ === void 0 ) {
      this.RelatedOpeningElement_ = this.extractElement( 5, 4, 3, false, IfcFeatureElementSubtraction )
    }

    return this.RelatedOpeningElement_ as IfcFeatureElementSubtraction
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELVOIDSELEMENT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELVOIDSELEMENT
}
