
import { IfcRelConnects } from "./index"
import { IfcOpeningElement } from "./index"
import { IfcElement } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrelfillselement.htm */
export  class IfcRelFillsElement extends IfcRelConnects {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRELFILLSELEMENT
  }
  private RelatingOpeningElement_? : IfcOpeningElement
  private RelatedBuildingElement_? : IfcElement

  public get RelatingOpeningElement() : IfcOpeningElement {
    if ( this.RelatingOpeningElement_ === void 0 ) {
      this.RelatingOpeningElement_ = this.extractElement( 4, 4, 3, false, IfcOpeningElement )
    }

    return this.RelatingOpeningElement_ as IfcOpeningElement
  }

  public get RelatedBuildingElement() : IfcElement {
    if ( this.RelatedBuildingElement_ === void 0 ) {
      this.RelatedBuildingElement_ = this.extractElement( 5, 4, 3, false, IfcElement )
    }

    return this.RelatedBuildingElement_ as IfcElement
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELFILLSELEMENT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELFILLSELEMENT
}
