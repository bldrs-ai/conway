
import { IfcRelConnects } from "./index"
import { IfcConnectionGeometry } from "./index"
import { IfcElement } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcRelConnectsElements extends IfcRelConnects {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCRELCONNECTSELEMENTS
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcRelConnectsElements.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcRelConnectsElements" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCRELCONNECTSELEMENTS, EntityTypesIfc4x3.IFCRELCONNECTSPATHELEMENTS, EntityTypesIfc4x3.IFCRELCONNECTSWITHREALIZINGELEMENTS ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCRELCONNECTSELEMENTS
}
