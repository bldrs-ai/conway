
import { IfcRelConnects } from "./index"
import { IfcConnectionGeometry } from "./index"
import { IfcElement } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrelconnectselements.htm */
export  class IfcRelConnectsElements extends IfcRelConnects {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRELCONNECTSELEMENTS
  }
  private ConnectionGeometry_? : IfcConnectionGeometry | null
  private RelatingElement_? : IfcElement
  private RelatedElement_? : IfcElement

  public get ConnectionGeometry() : IfcConnectionGeometry | null {
    if ( this.ConnectionGeometry_ === void 0 ) {
      this.ConnectionGeometry_ = this.extractElement( 4, 4, 3, true, IfcConnectionGeometry )
    }

    return this.ConnectionGeometry_ as IfcConnectionGeometry | null
  }

  public get RelatingElement() : IfcElement {
    if ( this.RelatingElement_ === void 0 ) {
      this.RelatingElement_ = this.extractElement( 5, 4, 3, false, IfcElement )
    }

    return this.RelatingElement_ as IfcElement
  }

  public get RelatedElement() : IfcElement {
    if ( this.RelatedElement_ === void 0 ) {
      this.RelatedElement_ = this.extractElement( 6, 4, 3, false, IfcElement )
    }

    return this.RelatedElement_ as IfcElement
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELCONNECTSELEMENTS, EntityTypesIfc.IFCRELCONNECTSPATHELEMENTS, EntityTypesIfc.IFCRELCONNECTSWITHREALIZINGELEMENTS ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELCONNECTSELEMENTS
}
