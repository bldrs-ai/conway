
import { product_definition } from "./index"
import { product_definition_context } from "./index"
import { product_definition_context_role } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class product_definition_context_association extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.PRODUCT_DEFINITION_CONTEXT_ASSOCIATION
  }
  private definition_? : product_definition
  private frame_of_reference_? : product_definition_context
  private role_? : product_definition_context_role

  public get definition() : product_definition {
    if ( this.definition_ === void 0 ) {
      this.definition_ = this.extractElement( 0, 0, 0, false, product_definition )
    }

    return this.definition_ as product_definition
  }

  public get frame_of_reference() : product_definition_context {
    if ( this.frame_of_reference_ === void 0 ) {
      this.frame_of_reference_ = this.extractElement( 1, 0, 0, false, product_definition_context )
    }

    return this.frame_of_reference_ as product_definition_context
  }

  public get role() : product_definition_context_role {
    if ( this.role_ === void 0 ) {
      this.role_ = this.extractElement( 2, 0, 0, false, product_definition_context_role )
    }

    return this.role_ as product_definition_context_role
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === product_definition_context_association.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for product_definition_context_association" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.PRODUCT_DEFINITION_CONTEXT_ASSOCIATION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.PRODUCT_DEFINITION_CONTEXT_ASSOCIATION
}
