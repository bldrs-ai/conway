
import { label } from "./index"
import { text } from "./index"
import { general_property } from "./index"
import { property_definition } from "./index"
import { property_definition_relationship } from "./index"
import { shape_aspect } from "./index"
import { shape_aspect_relationship } from "./index"
import { representation } from "./index"
import { representation_item } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class item_identified_representation_usage extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.ITEM_IDENTIFIED_REPRESENTATION_USAGE
  }
  private name_? : string
  private description_? : string | null
  private definition_? : general_property | property_definition | property_definition_relationship | shape_aspect | shape_aspect_relationship
  private used_representation_? : representation
  private identified_item_? : representation_item

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

  public get definition() : general_property | property_definition | property_definition_relationship | shape_aspect | shape_aspect_relationship {
    if ( this.definition_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 2, 0, 0, false )

      if ( !( value instanceof general_property ) && !( value instanceof property_definition ) && !( value instanceof property_definition_relationship ) && !( value instanceof shape_aspect ) && !( value instanceof shape_aspect_relationship ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.definition_ = value as (general_property | property_definition | property_definition_relationship | shape_aspect | shape_aspect_relationship)

    }

    return this.definition_ as general_property | property_definition | property_definition_relationship | shape_aspect | shape_aspect_relationship
  }

  public get used_representation() : representation {
    if ( this.used_representation_ === void 0 ) {
      this.used_representation_ = this.extractElement( 3, 0, 0, false, representation )
    }

    return this.used_representation_ as representation
  }

  public get identified_item() : representation_item {
    if ( this.identified_item_ === void 0 ) {
      this.identified_item_ = this.extractElement( 4, 0, 0, false, representation_item )
    }

    return this.identified_item_ as representation_item
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === item_identified_representation_usage.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for item_identified_representation_usage" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.ITEM_IDENTIFIED_REPRESENTATION_USAGE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.ITEM_IDENTIFIED_REPRESENTATION_USAGE
}
