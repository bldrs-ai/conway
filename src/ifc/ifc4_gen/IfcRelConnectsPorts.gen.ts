
import { IfcRelConnects } from "./index"
import { IfcPort } from "./index"
import { IfcElement } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrelconnectsports.htm */
export  class IfcRelConnectsPorts extends IfcRelConnects {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRELCONNECTSPORTS
  }
  private RelatingPort_? : IfcPort
  private RelatedPort_? : IfcPort
  private RealizingElement_? : IfcElement | null

  public get RelatingPort() : IfcPort {
    if ( this.RelatingPort_ === void 0 ) {
      this.RelatingPort_ = this.extractElement( 4, 4, 3, false, IfcPort )
    }

    return this.RelatingPort_ as IfcPort
  }

  public get RelatedPort() : IfcPort {
    if ( this.RelatedPort_ === void 0 ) {
      this.RelatedPort_ = this.extractElement( 5, 4, 3, false, IfcPort )
    }

    return this.RelatedPort_ as IfcPort
  }

  public get RealizingElement() : IfcElement | null {
    if ( this.RealizingElement_ === void 0 ) {
      this.RealizingElement_ = this.extractElement( 6, 4, 3, true, IfcElement )
    }

    return this.RealizingElement_ as IfcElement | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELCONNECTSPORTS ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELCONNECTSPORTS
}
