
import { label } from "./index"
import { text } from "./index"
import { product_concept_feature } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class concept_feature_relationship extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.CONCEPT_FEATURE_RELATIONSHIP
  }
  private name_? : string
  private description_? : string | null
  private relating_product_concept_feature_? : product_concept_feature
  private related_product_concept_feature_? : product_concept_feature

  public get name() : string {
    if ( this.name_ === void 0 ) {
      this.name_ = this.extractString( 0, 0, 0, false )
    }

    return this.name_ as string
  }

  public get description() : string | null {
    if ( this.description_ === void 0 ) {
      this.description_ = this.extractString( 1, 0, 0, true )
    }

    return this.description_ as string | null
  }

  public get relating_product_concept_feature() : product_concept_feature {
    if ( this.relating_product_concept_feature_ === void 0 ) {
      this.relating_product_concept_feature_ = this.extractElement( 2, 0, 0, false, product_concept_feature )
    }

    return this.relating_product_concept_feature_ as product_concept_feature
  }

  public get related_product_concept_feature() : product_concept_feature {
    if ( this.related_product_concept_feature_ === void 0 ) {
      this.related_product_concept_feature_ = this.extractElement( 3, 0, 0, false, product_concept_feature )
    }

    return this.related_product_concept_feature_ as product_concept_feature
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === concept_feature_relationship.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for concept_feature_relationship" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.CONCEPT_FEATURE_RELATIONSHIP ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.CONCEPT_FEATURE_RELATIONSHIP
}
