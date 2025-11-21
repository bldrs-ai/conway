
import { label } from "./index"
import { text } from "./index"
import { product } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class alternate_product_relationship extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.ALTERNATE_PRODUCT_RELATIONSHIP
  }
  private name_? : string
  private definition_? : string | null
  private alternate_? : product
  private base_? : product
  private basis_? : string

  public get name() : string {
    if ( this.name_ === void 0 ) {
      this.name_ = this.extractString( 0, 0, 0, false )
    }

    return this.name_ as string
  }

  public get definition() : string | null {
    if ( this.definition_ === void 0 ) {
      this.definition_ = this.extractString( 1, 0, 0, true )
    }

    return this.definition_ as string | null
  }

  public get alternate() : product {
    if ( this.alternate_ === void 0 ) {
      this.alternate_ = this.extractElement( 2, 0, 0, false, product )
    }

    return this.alternate_ as product
  }

  public get base() : product {
    if ( this.base_ === void 0 ) {
      this.base_ = this.extractElement( 3, 0, 0, false, product )
    }

    return this.base_ as product
  }

  public get basis() : string {
    if ( this.basis_ === void 0 ) {
      this.basis_ = this.extractString( 4, 0, 0, false )
    }

    return this.basis_ as string
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === alternate_product_relationship.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for alternate_product_relationship" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.ALTERNATE_PRODUCT_RELATIONSHIP ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.ALTERNATE_PRODUCT_RELATIONSHIP
}
