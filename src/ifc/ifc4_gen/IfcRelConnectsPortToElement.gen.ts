
import { IfcRelConnects } from "./index"
import { IfcPort } from "./index"
import { IfcDistributionElement } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrelconnectsporttoelement.htm */
export  class IfcRelConnectsPortToElement extends IfcRelConnects {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRELCONNECTSPORTTOELEMENT
  }
  private RelatingPort_? : IfcPort
  private RelatedElement_? : IfcDistributionElement

  public get RelatingPort() : IfcPort {
    if ( this.RelatingPort_ === void 0 ) {
      this.RelatingPort_ = this.extractElement( 4, 4, 3, false, IfcPort )
    }

    return this.RelatingPort_ as IfcPort
  }

  public get RelatedElement() : IfcDistributionElement {
    if ( this.RelatedElement_ === void 0 ) {
      this.RelatedElement_ = this.extractElement( 5, 4, 3, false, IfcDistributionElement )
    }

    return this.RelatedElement_ as IfcDistributionElement
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELCONNECTSPORTTOELEMENT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELCONNECTSPORTTOELEMENT
}
