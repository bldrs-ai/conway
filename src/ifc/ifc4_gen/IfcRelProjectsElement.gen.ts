
import { IfcRelDecomposes } from "./index"
import { IfcElement } from "./index"
import { IfcFeatureElementAddition } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrelprojectselement.htm */
export  class IfcRelProjectsElement extends IfcRelDecomposes {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRELPROJECTSELEMENT
  }
  private RelatingElement_? : IfcElement
  private RelatedFeatureElement_? : IfcFeatureElementAddition

  public get RelatingElement() : IfcElement {
    if ( this.RelatingElement_ === void 0 ) {
      this.RelatingElement_ = this.extractElement( 4, 4, 3, false, IfcElement )
    }

    return this.RelatingElement_ as IfcElement
  }

  public get RelatedFeatureElement() : IfcFeatureElementAddition {
    if ( this.RelatedFeatureElement_ === void 0 ) {
      this.RelatedFeatureElement_ = this.extractElement( 5, 4, 3, false, IfcFeatureElementAddition )
    }

    return this.RelatedFeatureElement_ as IfcFeatureElementAddition
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELPROJECTSELEMENT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELPROJECTSELEMENT
}
