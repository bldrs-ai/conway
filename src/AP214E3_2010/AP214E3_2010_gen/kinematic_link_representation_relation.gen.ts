
import { kinematic_link } from "./index"
import { kinematic_link_representation } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class kinematic_link_representation_relation extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.KINEMATIC_LINK_REPRESENTATION_RELATION
  }
  private topological_aspects_? : kinematic_link
  private geometric_aspects_? : kinematic_link_representation

  public get topological_aspects() : kinematic_link {
    if ( this.topological_aspects_ === void 0 ) {
      this.topological_aspects_ = this.extractElement( 0, 0, 0, false, kinematic_link )
    }

    return this.topological_aspects_ as kinematic_link
  }

  public get geometric_aspects() : kinematic_link_representation {
    if ( this.geometric_aspects_ === void 0 ) {
      this.geometric_aspects_ = this.extractElement( 1, 0, 0, false, kinematic_link_representation )
    }

    return this.geometric_aspects_ as kinematic_link_representation
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === kinematic_link_representation_relation.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for kinematic_link_representation_relation" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.KINEMATIC_LINK_REPRESENTATION_RELATION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.KINEMATIC_LINK_REPRESENTATION_RELATION
}
