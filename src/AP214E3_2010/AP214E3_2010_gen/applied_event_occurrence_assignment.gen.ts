
import { event_occurrence_assignment } from "./index"
import { action } from "./index"
import { action_directive } from "./index"
import { action_method } from "./index"
import { action_property } from "./index"
import { action_relationship } from "./index"
import { action_request_solution } from "./index"
import { alternate_product_relationship } from "./index"
import { applied_action_assignment } from "./index"
import { applied_classification_assignment } from "./index"
import { applied_person_and_organization_assignment } from "./index"
import { approval_status } from "./index"
import { assembly_component_usage_substitute } from "./index"
import { certification } from "./index"
import { class } from "./index"
import { class_system } from "./index"
import { configuration_design } from "./index"
import { configuration_effectivity } from "./index"
import { configuration_item } from "./index"
import { configured_effectivity_assignment } from "./index"
import { contract } from "./index"
import { document_file } from "./index"
import { draughting_model } from "./index"
import { drawing_revision } from "./index"
import { executed_action } from "./index"
import { general_property } from "./index"
import { material_designation } from "./index"
import { mechanical_design_geometric_presentation_representation } from "./index"
import { organization_relationship } from "./index"
import { organizational_project } from "./index"
import { person_and_organization } from "./index"
import { presentation_area } from "./index"
import { product } from "./index"
import { product_concept } from "./index"
import { product_concept_feature } from "./index"
import { product_concept_feature_association } from "./index"
import { product_concept_feature_category } from "./index"
import { product_concept_feature_category_usage } from "./index"
import { product_definition } from "./index"
import { product_definition_formation } from "./index"
import { product_definition_formation_relationship } from "./index"
import { product_definition_relationship } from "./index"
import { product_definition_substitute } from "./index"
import { property_definition } from "./index"
import { requirement_for_action_resource } from "./index"
import { resource_property } from "./index"
import { security_classification } from "./index"
import { security_classification_level } from "./index"
import { shape_representation } from "./index"
import { versioned_action_request } from "./index"
import {
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/applied_event_occurrence_assignment.htm */
export  class applied_event_occurrence_assignment extends event_occurrence_assignment {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.APPLIED_EVENT_OCCURRENCE_ASSIGNMENT
  }
  private items_? : Array<action | action_directive | action_method | action_property | action_relationship | action_request_solution | alternate_product_relationship | applied_action_assignment | applied_classification_assignment | applied_person_and_organization_assignment | approval_status | assembly_component_usage_substitute | certification | class | class_system | configuration_design | configuration_effectivity | configuration_item | configured_effectivity_assignment | contract | document_file | draughting_model | drawing_revision | executed_action | general_property | material_designation | mechanical_design_geometric_presentation_representation | organization_relationship | organizational_project | person_and_organization | presentation_area | product | product_concept | product_concept_feature | product_concept_feature_association | product_concept_feature_category | product_concept_feature_category_usage | product_definition | product_definition_formation | product_definition_formation_relationship | product_definition_relationship | product_definition_substitute | property_definition | requirement_for_action_resource | resource_property | security_classification | security_classification_level | shape_representation | versioned_action_request>

  public get items() : Array<action | action_directive | action_method | action_property | action_relationship | action_request_solution | alternate_product_relationship | applied_action_assignment | applied_classification_assignment | applied_person_and_organization_assignment | approval_status | assembly_component_usage_substitute | certification | class | class_system | configuration_design | configuration_effectivity | configuration_item | configured_effectivity_assignment | contract | document_file | draughting_model | drawing_revision | executed_action | general_property | material_designation | mechanical_design_geometric_presentation_representation | organization_relationship | organizational_project | person_and_organization | presentation_area | product | product_concept | product_concept_feature | product_concept_feature_association | product_concept_feature_category | product_concept_feature_category_usage | product_definition | product_definition_formation | product_definition_formation_relationship | product_definition_relationship | product_definition_substitute | property_definition | requirement_for_action_resource | resource_property | security_classification | security_classification_level | shape_representation | versioned_action_request> {
    if ( this.items_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 2 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      const value : Array<action | action_directive | action_method | action_property | action_relationship | action_request_solution | alternate_product_relationship | applied_action_assignment | applied_classification_assignment | applied_person_and_organization_assignment | approval_status | assembly_component_usage_substitute | certification | class | class_system | configuration_design | configuration_effectivity | configuration_item | configured_effectivity_assignment | contract | document_file | draughting_model | drawing_revision | executed_action | general_property | material_designation | mechanical_design_geometric_presentation_representation | organization_relationship | organizational_project | person_and_organization | presentation_area | product | product_concept | product_concept_feature | product_concept_feature_association | product_concept_feature_category | product_concept_feature_category_usage | product_definition | product_definition_formation | product_definition_formation_relationship | product_definition_relationship | product_definition_substitute | property_definition | requirement_for_action_resource | resource_property | security_classification | security_classification_level | shape_representation | versioned_action_request> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesIfc > | undefined =
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof action ) && !( value1Untyped instanceof action_directive ) && !( value1Untyped instanceof action_method ) && !( value1Untyped instanceof action_property ) && !( value1Untyped instanceof action_relationship ) && !( value1Untyped instanceof action_request_solution ) && !( value1Untyped instanceof alternate_product_relationship ) && !( value1Untyped instanceof applied_action_assignment ) && !( value1Untyped instanceof applied_classification_assignment ) && !( value1Untyped instanceof applied_person_and_organization_assignment ) && !( value1Untyped instanceof approval_status ) && !( value1Untyped instanceof assembly_component_usage_substitute ) && !( value1Untyped instanceof certification ) && !( value1Untyped instanceof class ) && !( value1Untyped instanceof class_system ) && !( value1Untyped instanceof configuration_design ) && !( value1Untyped instanceof configuration_effectivity ) && !( value1Untyped instanceof configuration_item ) && !( value1Untyped instanceof configured_effectivity_assignment ) && !( value1Untyped instanceof contract ) && !( value1Untyped instanceof document_file ) && !( value1Untyped instanceof draughting_model ) && !( value1Untyped instanceof drawing_revision ) && !( value1Untyped instanceof executed_action ) && !( value1Untyped instanceof general_property ) && !( value1Untyped instanceof material_designation ) && !( value1Untyped instanceof mechanical_design_geometric_presentation_representation ) && !( value1Untyped instanceof organization_relationship ) && !( value1Untyped instanceof organizational_project ) && !( value1Untyped instanceof person_and_organization ) && !( value1Untyped instanceof presentation_area ) && !( value1Untyped instanceof product ) && !( value1Untyped instanceof product_concept ) && !( value1Untyped instanceof product_concept_feature ) && !( value1Untyped instanceof product_concept_feature_association ) && !( value1Untyped instanceof product_concept_feature_category ) && !( value1Untyped instanceof product_concept_feature_category_usage ) && !( value1Untyped instanceof product_definition ) && !( value1Untyped instanceof product_definition_formation ) && !( value1Untyped instanceof product_definition_formation_relationship ) && !( value1Untyped instanceof product_definition_relationship ) && !( value1Untyped instanceof product_definition_substitute ) && !( value1Untyped instanceof property_definition ) && !( value1Untyped instanceof requirement_for_action_resource ) && !( value1Untyped instanceof resource_property ) && !( value1Untyped instanceof security_classification ) && !( value1Untyped instanceof security_classification_level ) && !( value1Untyped instanceof shape_representation ) && !( value1Untyped instanceof versioned_action_request ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (action | action_directive | action_method | action_property | action_relationship | action_request_solution | alternate_product_relationship | applied_action_assignment | applied_classification_assignment | applied_person_and_organization_assignment | approval_status | assembly_component_usage_substitute | certification | class | class_system | configuration_design | configuration_effectivity | configuration_item | configured_effectivity_assignment | contract | document_file | draughting_model | drawing_revision | executed_action | general_property | material_designation | mechanical_design_geometric_presentation_representation | organization_relationship | organizational_project | person_and_organization | presentation_area | product | product_concept | product_concept_feature | product_concept_feature_association | product_concept_feature_category | product_concept_feature_category_usage | product_definition | product_definition_formation | product_definition_formation_relationship | product_definition_relationship | product_definition_substitute | property_definition | requirement_for_action_resource | resource_property | security_classification | security_classification_level | shape_representation | versioned_action_request)
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

    return this.items_ as Array<action | action_directive | action_method | action_property | action_relationship | action_request_solution | alternate_product_relationship | applied_action_assignment | applied_classification_assignment | applied_person_and_organization_assignment | approval_status | assembly_component_usage_substitute | certification | class | class_system | configuration_design | configuration_effectivity | configuration_item | configured_effectivity_assignment | contract | document_file | draughting_model | drawing_revision | executed_action | general_property | material_designation | mechanical_design_geometric_presentation_representation | organization_relationship | organizational_project | person_and_organization | presentation_area | product | product_concept | product_concept_feature | product_concept_feature_association | product_concept_feature_category | product_concept_feature_category_usage | product_definition | product_definition_formation | product_definition_formation_relationship | product_definition_relationship | product_definition_substitute | property_definition | requirement_for_action_resource | resource_property | security_classification | security_classification_level | shape_representation | versioned_action_request>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.APPLIED_EVENT_OCCURRENCE_ASSIGNMENT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.APPLIED_EVENT_OCCURRENCE_ASSIGNMENT
}
