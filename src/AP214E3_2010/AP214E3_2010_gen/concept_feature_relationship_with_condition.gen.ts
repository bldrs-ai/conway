
import { concept_feature_relationship } from "./index"
import { concept_feature_operator } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class concept_feature_relationship_with_condition extends concept_feature_relationship {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.CONCEPT_FEATURE_RELATIONSHIP_WITH_CONDITION
  }
  private conditional_operator_? : concept_feature_operator

  public get conditional_operator() : concept_feature_operator {
    if ( this.conditional_operator_ === void 0 ) {
      this.conditional_operator_ = this.extractElement( 4, 4, 1, false, concept_feature_operator )
    }

    return this.conditional_operator_ as concept_feature_operator
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === concept_feature_relationship_with_condition.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for concept_feature_relationship_with_condition" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.CONCEPT_FEATURE_RELATIONSHIP_WITH_CONDITION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.CONCEPT_FEATURE_RELATIONSHIP_WITH_CONDITION
}
