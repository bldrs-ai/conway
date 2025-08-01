
import { product_definition_relationship } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class product_definition_usage extends product_definition_relationship {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.PRODUCT_DEFINITION_USAGE
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === product_definition_usage.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for product_definition_usage" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.PRODUCT_DEFINITION_USAGE, EntityTypesAP214.MAKE_FROM_USAGE_OPTION, EntityTypesAP214.ASSEMBLY_COMPONENT_USAGE, EntityTypesAP214.NEXT_ASSEMBLY_USAGE_OCCURRENCE, EntityTypesAP214.SPECIFIED_HIGHER_USAGE_OCCURRENCE, EntityTypesAP214.PROMISSORY_USAGE_OCCURRENCE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.PRODUCT_DEFINITION_USAGE
}
