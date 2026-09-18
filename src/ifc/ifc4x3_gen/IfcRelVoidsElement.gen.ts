
import { IfcRelDecomposes } from "./index"
import { IfcElement } from "./index"
import { IfcFeatureElementSubtraction } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcRelVoidsElement extends IfcRelDecomposes {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCRELVOIDSELEMENT
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcRelVoidsElement.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcRelVoidsElement" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCRELVOIDSELEMENT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCRELVOIDSELEMENT
}
