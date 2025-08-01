
import { general_property } from "./index"
import { property_definition } from "./index"
import { property_definition_relationship } from "./index"
import { shape_aspect } from "./index"
import { shape_aspect_relationship } from "./index"
import { representation } from "./index"
import { text } from "./index"
import { label } from "./index"
import {
  get_name_value,
  get_description_value,
} from '../ap214_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class property_definition_representation extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.PROPERTY_DEFINITION_REPRESENTATION
  }
  private definition_? : general_property | property_definition | property_definition_relationship | shape_aspect | shape_aspect_relationship
  private used_representation_? : representation

  public get definition() : general_property | property_definition | property_definition_relationship | shape_aspect | shape_aspect_relationship {
    if ( this.definition_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 0, 0, 0, false )

      if ( !( value instanceof general_property ) && !( value instanceof property_definition ) && !( value instanceof property_definition_relationship ) && !( value instanceof shape_aspect ) && !( value instanceof shape_aspect_relationship ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.definition_ = value as (general_property | property_definition | property_definition_relationship | shape_aspect | shape_aspect_relationship)

    }

    return this.definition_ as general_property | property_definition | property_definition_relationship | shape_aspect | shape_aspect_relationship
  }

  public get used_representation() : representation {
    if ( this.used_representation_ === void 0 ) {
      this.used_representation_ = this.extractElement( 1, 0, 0, false, representation )
    }

    return this.used_representation_ as representation
  }

  public get description() : string {
    return get_description_value(this);
  }

  public get name() : string {
    return get_name_value(this);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === property_definition_representation.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for property_definition_representation" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.PROPERTY_DEFINITION_REPRESENTATION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.PROPERTY_DEFINITION_REPRESENTATION
}
