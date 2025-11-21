
import { action_request_assignment } from "./index"
import { action } from "./index"
import { action_method } from "./index"
import { action_property } from "./index"
import { action_relationship } from "./index"
import { alternate_product_relationship } from "./index"
import { assembly_component_usage_substitute } from "./index"
import { configuration_design } from "./index"
import { configuration_effectivity } from "./index"
import { configuration_item } from "./index"
import { configured_effectivity_assignment } from "./index"
import { document_file } from "./index"
import { draughting_model } from "./index"
import { drawing_revision } from "./index"
import { general_property } from "./index"
import { material_designation } from "./index"
import { mechanical_design_geometric_presentation_representation } from "./index"
import { organizational_project } from "./index"
import { presentation_area } from "./index"
import { product } from "./index"
import { product_concept } from "./index"
import { product_concept_feature } from "./index"
import { product_concept_feature_association } from "./index"
import { product_concept_feature_category } from "./index"
import { product_concept_feature_category_usage } from "./index"
import { product_definition } from "./index"
import { product_definition_formation } from "./index"
import { product_definition_relationship } from "./index"
import { product_definition_substitute } from "./index"
import { property_definition } from "./index"
import { resource_property } from "./index"
import { shape_aspect } from "./index"
import { shape_representation } from "./index"
import {
  stepExtractOptional,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class applied_action_request_assignment extends action_request_assignment {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.APPLIED_ACTION_REQUEST_ASSIGNMENT
  }
  private items_? : Array<action | action_method | action_property | action_relationship | alternate_product_relationship | assembly_component_usage_substitute | configuration_design | configuration_effectivity | configuration_item | configured_effectivity_assignment | document_file | draughting_model | drawing_revision | general_property | material_designation | mechanical_design_geometric_presentation_representation | organizational_project | presentation_area | product | product_concept | product_concept_feature | product_concept_feature_association | product_concept_feature_category | product_concept_feature_category_usage | product_definition | product_definition_formation | product_definition_relationship | product_definition_substitute | property_definition | resource_property | shape_aspect | shape_representation>

  public get items() : Array<action | action_method | action_property | action_relationship | alternate_product_relationship | assembly_component_usage_substitute | configuration_design | configuration_effectivity | configuration_item | configured_effectivity_assignment | document_file | draughting_model | drawing_revision | general_property | material_designation | mechanical_design_geometric_presentation_representation | organizational_project | presentation_area | product | product_concept | product_concept_feature | product_concept_feature_association | product_concept_feature_category | product_concept_feature_category_usage | product_definition | product_definition_formation | product_definition_relationship | product_definition_substitute | property_definition | resource_property | shape_aspect | shape_representation> {
    if ( this.items_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 1, 1, 1 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<action | action_method | action_property | action_relationship | alternate_product_relationship | assembly_component_usage_substitute | configuration_design | configuration_effectivity | configuration_item | configured_effectivity_assignment | document_file | draughting_model | drawing_revision | general_property | material_designation | mechanical_design_geometric_presentation_representation | organizational_project | presentation_area | product | product_concept | product_concept_feature | product_concept_feature_association | product_concept_feature_category | product_concept_feature_category_usage | product_definition | product_definition_formation | product_definition_relationship | product_definition_substitute | property_definition | resource_property | shape_aspect | shape_representation> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesAP214 > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof action ) && !( value1Untyped instanceof action_method ) && !( value1Untyped instanceof action_property ) && !( value1Untyped instanceof action_relationship ) && !( value1Untyped instanceof alternate_product_relationship ) && !( value1Untyped instanceof assembly_component_usage_substitute ) && !( value1Untyped instanceof configuration_design ) && !( value1Untyped instanceof configuration_effectivity ) && !( value1Untyped instanceof configuration_item ) && !( value1Untyped instanceof configured_effectivity_assignment ) && !( value1Untyped instanceof document_file ) && !( value1Untyped instanceof draughting_model ) && !( value1Untyped instanceof drawing_revision ) && !( value1Untyped instanceof general_property ) && !( value1Untyped instanceof material_designation ) && !( value1Untyped instanceof mechanical_design_geometric_presentation_representation ) && !( value1Untyped instanceof organizational_project ) && !( value1Untyped instanceof presentation_area ) && !( value1Untyped instanceof product ) && !( value1Untyped instanceof product_concept ) && !( value1Untyped instanceof product_concept_feature ) && !( value1Untyped instanceof product_concept_feature_association ) && !( value1Untyped instanceof product_concept_feature_category ) && !( value1Untyped instanceof product_concept_feature_category_usage ) && !( value1Untyped instanceof product_definition ) && !( value1Untyped instanceof product_definition_formation ) && !( value1Untyped instanceof product_definition_relationship ) && !( value1Untyped instanceof product_definition_substitute ) && !( value1Untyped instanceof property_definition ) && !( value1Untyped instanceof resource_property ) && !( value1Untyped instanceof shape_aspect ) && !( value1Untyped instanceof shape_representation ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (action | action_method | action_property | action_relationship | alternate_product_relationship | assembly_component_usage_substitute | configuration_design | configuration_effectivity | configuration_item | configured_effectivity_assignment | document_file | draughting_model | drawing_revision | general_property | material_designation | mechanical_design_geometric_presentation_representation | organizational_project | presentation_area | product | product_concept | product_concept_feature | product_concept_feature_association | product_concept_feature_category | product_concept_feature_category_usage | product_definition | product_definition_formation | product_definition_relationship | product_definition_substitute | property_definition | resource_property | shape_aspect | shape_representation)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.items_ = value
    }

    return this.items_ as Array<action | action_method | action_property | action_relationship | alternate_product_relationship | assembly_component_usage_substitute | configuration_design | configuration_effectivity | configuration_item | configured_effectivity_assignment | document_file | draughting_model | drawing_revision | general_property | material_designation | mechanical_design_geometric_presentation_representation | organizational_project | presentation_area | product | product_concept | product_concept_feature | product_concept_feature_association | product_concept_feature_category | product_concept_feature_category_usage | product_definition | product_definition_formation | product_definition_relationship | product_definition_substitute | property_definition | resource_property | shape_aspect | shape_representation>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === applied_action_request_assignment.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for applied_action_request_assignment" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.APPLIED_ACTION_REQUEST_ASSIGNMENT ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.APPLIED_ACTION_REQUEST_ASSIGNMENT
}
