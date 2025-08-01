
import { label } from "./index"
import { text } from "./index"
import { product_concept } from "./index"
import { product_concept_feature } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class product_concept_feature_association extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.PRODUCT_CONCEPT_FEATURE_ASSOCIATION
  }
  private name_? : string
  private description_? : string | null
  private concept_? : product_concept
  private feature_? : product_concept_feature

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

  public get concept() : product_concept {
    if ( this.concept_ === void 0 ) {
      this.concept_ = this.extractElement( 2, 0, 0, false, product_concept )
    }

    return this.concept_ as product_concept
  }

  public get feature() : product_concept_feature {
    if ( this.feature_ === void 0 ) {
      this.feature_ = this.extractElement( 3, 0, 0, false, product_concept_feature )
    }

    return this.feature_ as product_concept_feature
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === product_concept_feature_association.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for product_concept_feature_association" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.PRODUCT_CONCEPT_FEATURE_ASSOCIATION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.PRODUCT_CONCEPT_FEATURE_ASSOCIATION
}
