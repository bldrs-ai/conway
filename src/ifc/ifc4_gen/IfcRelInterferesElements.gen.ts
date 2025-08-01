
import { IfcRelConnects } from "./index"
import { IfcElement } from "./index"
import { IfcConnectionGeometry } from "./index"
import { IfcIdentifier } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrelinterfereselements.htm */
export  class IfcRelInterferesElements extends IfcRelConnects {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRELINTERFERESELEMENTS
  }
  private RelatingElement_? : IfcElement
  private RelatedElement_? : IfcElement
  private InterferenceGeometry_? : IfcConnectionGeometry | null
  private InterferenceType_? : string | null
  private ImpliedOrder_? : boolean

  public get RelatingElement() : IfcElement {
    if ( this.RelatingElement_ === void 0 ) {
      this.RelatingElement_ = this.extractElement( 4, 4, 3, false, IfcElement )
    }

    return this.RelatingElement_ as IfcElement
  }

  public get RelatedElement() : IfcElement {
    if ( this.RelatedElement_ === void 0 ) {
      this.RelatedElement_ = this.extractElement( 5, 4, 3, false, IfcElement )
    }

    return this.RelatedElement_ as IfcElement
  }

  public get InterferenceGeometry() : IfcConnectionGeometry | null {
    if ( this.InterferenceGeometry_ === void 0 ) {
      this.InterferenceGeometry_ = this.extractElement( 6, 4, 3, true, IfcConnectionGeometry )
    }

    return this.InterferenceGeometry_ as IfcConnectionGeometry | null
  }

  public get InterferenceType() : string | null {
    if ( this.InterferenceType_ === void 0 ) {
      this.InterferenceType_ = this.extractString( 7, 4, 3, true )
    }

    return this.InterferenceType_ as string | null
  }

  public get ImpliedOrder() : boolean {
    if ( this.ImpliedOrder_ === void 0 ) {
      this.ImpliedOrder_ = this.extractBoolean( 8, 4, 3, false )
    }

    return this.ImpliedOrder_ as boolean
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELINTERFERESELEMENTS ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELINTERFERESELEMENTS
}
