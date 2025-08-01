
import { label } from "./index"
import { text } from "./index"
import { product_category } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class product_category_relationship extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.PRODUCT_CATEGORY_RELATIONSHIP
  }
  private name_? : string
  private description_? : string | null
  private category_? : product_category
  private sub_category_? : product_category

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

  public get category() : product_category {
    if ( this.category_ === void 0 ) {
      this.category_ = this.extractElement( 2, 0, 0, false, product_category )
    }

    return this.category_ as product_category
  }

  public get sub_category() : product_category {
    if ( this.sub_category_ === void 0 ) {
      this.sub_category_ = this.extractElement( 3, 0, 0, false, product_category )
    }

    return this.sub_category_ as product_category
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === product_category_relationship.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for product_category_relationship" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.PRODUCT_CATEGORY_RELATIONSHIP ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.PRODUCT_CATEGORY_RELATIONSHIP
}
