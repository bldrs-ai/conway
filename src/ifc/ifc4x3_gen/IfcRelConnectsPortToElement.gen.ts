
import { IfcRelConnects } from "./index"
import { IfcPort } from "./index"
import { IfcDistributionElement } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcRelConnectsPortToElement extends IfcRelConnects {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCRELCONNECTSPORTTOELEMENT
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcRelConnectsPortToElement.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcRelConnectsPortToElement" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCRELCONNECTSPORTTOELEMENT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCRELCONNECTSPORTTOELEMENT
}
