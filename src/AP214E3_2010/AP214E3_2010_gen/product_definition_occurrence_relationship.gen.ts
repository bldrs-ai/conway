
import { label } from "./index"
import { text } from "./index"
import { product_definition } from "./index"
import { assembly_component_usage } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class product_definition_occurrence_relationship extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.PRODUCT_DEFINITION_OCCURRENCE_RELATIONSHIP
  }
  private name_? : string
  private description_? : string | null
  private occurrence_? : product_definition
  private occurrence_usage_? : assembly_component_usage

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

  public get occurrence() : product_definition {
    if ( this.occurrence_ === void 0 ) {
      this.occurrence_ = this.extractElement( 2, 0, 0, false, product_definition )
    }

    return this.occurrence_ as product_definition
  }

  public get occurrence_usage() : assembly_component_usage {
    if ( this.occurrence_usage_ === void 0 ) {
      this.occurrence_usage_ = this.extractElement( 3, 0, 0, false, assembly_component_usage )
    }

    return this.occurrence_usage_ as assembly_component_usage
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === product_definition_occurrence_relationship.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for product_definition_occurrence_relationship" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.PRODUCT_DEFINITION_OCCURRENCE_RELATIONSHIP ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.PRODUCT_DEFINITION_OCCURRENCE_RELATIONSHIP
}
