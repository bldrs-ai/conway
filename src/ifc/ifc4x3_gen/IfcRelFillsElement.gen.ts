
import { IfcRelConnects } from "./index"
import { IfcOpeningElement } from "./index"
import { IfcElement } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcRelFillsElement extends IfcRelConnects {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCRELFILLSELEMENT
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcRelFillsElement.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcRelFillsElement" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCRELFILLSELEMENT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCRELFILLSELEMENT
}
