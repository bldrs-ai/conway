
import { effectivity } from "./index"
import { product_definition_relationship } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class product_definition_effectivity extends effectivity {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.PRODUCT_DEFINITION_EFFECTIVITY
  }
  private usage_? : product_definition_relationship

  public get usage() : product_definition_relationship {
    if ( this.usage_ === void 0 ) {
      this.usage_ = this.extractElement( 1, 1, 1, false, product_definition_relationship )
    }

    return this.usage_ as product_definition_relationship
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === product_definition_effectivity.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for product_definition_effectivity" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.PRODUCT_DEFINITION_EFFECTIVITY ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.PRODUCT_DEFINITION_EFFECTIVITY
}
