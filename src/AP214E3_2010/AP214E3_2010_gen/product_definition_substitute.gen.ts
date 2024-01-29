
import { text } from "./index"
import { product_definition_relationship } from "./index"
import { product_definition } from "./index"
import { label } from "./index"
import {
  get_name_value,
} from '../ap214_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class product_definition_substitute extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.PRODUCT_DEFINITION_SUBSTITUTE
  }
  private description_? : string | null
  private context_relationship_? : product_definition_relationship
  private substitute_definition_? : product_definition

  public get description() : string | null {
    if ( this.description_ === void 0 ) {
      this.description_ = this.extractString( 0, true )
    }

    return this.description_ as string | null
  }

  public get context_relationship() : product_definition_relationship {
    if ( this.context_relationship_ === void 0 ) {
      this.context_relationship_ = this.extractElement( 1, false, product_definition_relationship )
    }

    return this.context_relationship_ as product_definition_relationship
  }

  public get substitute_definition() : product_definition {
    if ( this.substitute_definition_ === void 0 ) {
      this.substitute_definition_ = this.extractElement( 2, false, product_definition )
    }

    return this.substitute_definition_ as product_definition
  }

  public get name() : string {
    return get_name_value(this);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.PRODUCT_DEFINITION_SUBSTITUTE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.PRODUCT_DEFINITION_SUBSTITUTE
}
