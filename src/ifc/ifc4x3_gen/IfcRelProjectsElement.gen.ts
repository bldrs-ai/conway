
import { IfcRelDecomposes } from "./index"
import { IfcElement } from "./index"
import { IfcFeatureElementAddition } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcRelProjectsElement extends IfcRelDecomposes {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCRELPROJECTSELEMENT
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcRelProjectsElement.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcRelProjectsElement" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCRELPROJECTSELEMENT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCRELPROJECTSELEMENT
}
