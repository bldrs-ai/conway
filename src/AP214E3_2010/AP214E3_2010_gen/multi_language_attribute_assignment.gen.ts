
import { attribute_value_assignment } from "./index"
import { action } from "./index"
import { action_directive } from "./index"
import { action_method } from "./index"
import { action_property } from "./index"
import { action_relationship } from "./index"
import { alternate_product_relationship } from "./index"
import { application_context } from "./index"
import { approval_relationship } from "./index"
import { assembly_component_usage_substitute } from "./index"
import { certification } from "./index"
import { configuration_design } from "./index"
import { configuration_item } from "./index"
import { contract } from "./index"
import { data_environment } from "./index"
import { date_role } from "./index"
import { date_time_role } from "./index"
import { descriptive_representation_item } from "./index"
import { document_relationship } from "./index"
import { draughting_title } from "./index"
import { effectivity } from "./index"
import { effectivity_relationship } from "./index"
import { event_occurrence } from "./index"
import { external_source } from "./index"
import { general_property } from "./index"
import { general_property_relationship } from "./index"
import { geometric_representation_item } from "./index"
import { geometric_tolerance } from "./index"
import { group } from "./index"
import { group_relationship } from "./index"
import { identification_role } from "./index"
import { kinematic_pair } from "./index"
import { mapped_item } from "./index"
import { name_assignment } from "./index"
import { organization_relationship } from "./index"
import { organization_role } from "./index"
import { organizational_project } from "./index"
import { organizational_project_relationship } from "./index"
import { pair_actuator } from "./index"
import { person_and_organization_role } from "./index"
import { presentation_layer_assignment } from "./index"
import { process_product_association } from "./index"
import { product } from "./index"
import { product_concept } from "./index"
import { product_concept_feature } from "./index"
import { product_concept_feature_association } from "./index"
import { product_concept_relationship } from "./index"
import { product_definition } from "./index"
import { product_definition_formation } from "./index"
import { product_definition_formation_relationship } from "./index"
import { product_definition_relationship } from "./index"
import { product_definition_substitute } from "./index"
import { product_related_product_category } from "./index"
import { property_definition } from "./index"
import { property_definition_relationship } from "./index"
import { representation } from "./index"
import { representation_relationship } from "./index"
import { requirement_for_action_resource } from "./index"
import { resource_property } from "./index"
import { resource_requirement_type } from "./index"
import { security_classification } from "./index"
import { shape_aspect } from "./index"
import { shape_aspect_relationship } from "./index"
import { styled_item } from "./index"
import { time_interval_role } from "./index"
import { topological_representation_item } from "./index"
import { uncertainty_measure_with_unit } from "./index"
import { uncertainty_qualifier } from "./index"
import { versioned_action_request } from "./index"
import { versioned_action_request_relationship } from "./index"
import { label } from "./index"
import {
  stepExtractOptional,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
} from '../../step/parsing/step_deserialization_functions'
import {
  get_multi_language,
} from '../ap214_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class multi_language_attribute_assignment extends attribute_value_assignment {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.MULTI_LANGUAGE_ATTRIBUTE_ASSIGNMENT
  }
  private items_? : Array<action | action_directive | action_method | action_property | action_relationship | alternate_product_relationship | application_context | approval_relationship | assembly_component_usage_substitute | certification | configuration_design | configuration_item | contract | data_environment | date_role | date_time_role | descriptive_representation_item | document_relationship | draughting_title | effectivity | effectivity_relationship | event_occurrence | external_source | general_property | general_property_relationship | geometric_representation_item | geometric_tolerance | group | group_relationship | identification_role | kinematic_pair | mapped_item | name_assignment | organization_relationship | organization_role | organizational_project | organizational_project_relationship | pair_actuator | person_and_organization_role | presentation_layer_assignment | process_product_association | product | product_concept | product_concept_feature | product_concept_feature_association | product_concept_relationship | product_definition | product_definition_formation | product_definition_formation_relationship | product_definition_relationship | product_definition_substitute | product_related_product_category | property_definition | property_definition_relationship | representation | representation_relationship | requirement_for_action_resource | resource_property | resource_requirement_type | security_classification | shape_aspect | shape_aspect_relationship | styled_item | time_interval_role | topological_representation_item | uncertainty_measure_with_unit | uncertainty_qualifier | versioned_action_request | versioned_action_request_relationship>

  public get items() : Array<action | action_directive | action_method | action_property | action_relationship | alternate_product_relationship | application_context | approval_relationship | assembly_component_usage_substitute | certification | configuration_design | configuration_item | contract | data_environment | date_role | date_time_role | descriptive_representation_item | document_relationship | draughting_title | effectivity | effectivity_relationship | event_occurrence | external_source | general_property | general_property_relationship | geometric_representation_item | geometric_tolerance | group | group_relationship | identification_role | kinematic_pair | mapped_item | name_assignment | organization_relationship | organization_role | organizational_project | organizational_project_relationship | pair_actuator | person_and_organization_role | presentation_layer_assignment | process_product_association | product | product_concept | product_concept_feature | product_concept_feature_association | product_concept_relationship | product_definition | product_definition_formation | product_definition_formation_relationship | product_definition_relationship | product_definition_substitute | product_related_product_category | property_definition | property_definition_relationship | representation | representation_relationship | requirement_for_action_resource | resource_property | resource_requirement_type | security_classification | shape_aspect | shape_aspect_relationship | styled_item | time_interval_role | topological_representation_item | uncertainty_measure_with_unit | uncertainty_qualifier | versioned_action_request | versioned_action_request_relationship> {
    if ( this.items_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 3, 3, 1 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<action | action_directive | action_method | action_property | action_relationship | alternate_product_relationship | application_context | approval_relationship | assembly_component_usage_substitute | certification | configuration_design | configuration_item | contract | data_environment | date_role | date_time_role | descriptive_representation_item | document_relationship | draughting_title | effectivity | effectivity_relationship | event_occurrence | external_source | general_property | general_property_relationship | geometric_representation_item | geometric_tolerance | group | group_relationship | identification_role | kinematic_pair | mapped_item | name_assignment | organization_relationship | organization_role | organizational_project | organizational_project_relationship | pair_actuator | person_and_organization_role | presentation_layer_assignment | process_product_association | product | product_concept | product_concept_feature | product_concept_feature_association | product_concept_relationship | product_definition | product_definition_formation | product_definition_formation_relationship | product_definition_relationship | product_definition_substitute | product_related_product_category | property_definition | property_definition_relationship | representation | representation_relationship | requirement_for_action_resource | resource_property | resource_requirement_type | security_classification | shape_aspect | shape_aspect_relationship | styled_item | time_interval_role | topological_representation_item | uncertainty_measure_with_unit | uncertainty_qualifier | versioned_action_request | versioned_action_request_relationship> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesAP214 > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof action ) && !( value1Untyped instanceof action_directive ) && !( value1Untyped instanceof action_method ) && !( value1Untyped instanceof action_property ) && !( value1Untyped instanceof action_relationship ) && !( value1Untyped instanceof alternate_product_relationship ) && !( value1Untyped instanceof application_context ) && !( value1Untyped instanceof approval_relationship ) && !( value1Untyped instanceof assembly_component_usage_substitute ) && !( value1Untyped instanceof certification ) && !( value1Untyped instanceof configuration_design ) && !( value1Untyped instanceof configuration_item ) && !( value1Untyped instanceof contract ) && !( value1Untyped instanceof data_environment ) && !( value1Untyped instanceof date_role ) && !( value1Untyped instanceof date_time_role ) && !( value1Untyped instanceof descriptive_representation_item ) && !( value1Untyped instanceof document_relationship ) && !( value1Untyped instanceof draughting_title ) && !( value1Untyped instanceof effectivity ) && !( value1Untyped instanceof effectivity_relationship ) && !( value1Untyped instanceof event_occurrence ) && !( value1Untyped instanceof external_source ) && !( value1Untyped instanceof general_property ) && !( value1Untyped instanceof general_property_relationship ) && !( value1Untyped instanceof geometric_representation_item ) && !( value1Untyped instanceof geometric_tolerance ) && !( value1Untyped instanceof group ) && !( value1Untyped instanceof group_relationship ) && !( value1Untyped instanceof identification_role ) && !( value1Untyped instanceof kinematic_pair ) && !( value1Untyped instanceof mapped_item ) && !( value1Untyped instanceof name_assignment ) && !( value1Untyped instanceof organization_relationship ) && !( value1Untyped instanceof organization_role ) && !( value1Untyped instanceof organizational_project ) && !( value1Untyped instanceof organizational_project_relationship ) && !( value1Untyped instanceof pair_actuator ) && !( value1Untyped instanceof person_and_organization_role ) && !( value1Untyped instanceof presentation_layer_assignment ) && !( value1Untyped instanceof process_product_association ) && !( value1Untyped instanceof product ) && !( value1Untyped instanceof product_concept ) && !( value1Untyped instanceof product_concept_feature ) && !( value1Untyped instanceof product_concept_feature_association ) && !( value1Untyped instanceof product_concept_relationship ) && !( value1Untyped instanceof product_definition ) && !( value1Untyped instanceof product_definition_formation ) && !( value1Untyped instanceof product_definition_formation_relationship ) && !( value1Untyped instanceof product_definition_relationship ) && !( value1Untyped instanceof product_definition_substitute ) && !( value1Untyped instanceof product_related_product_category ) && !( value1Untyped instanceof property_definition ) && !( value1Untyped instanceof property_definition_relationship ) && !( value1Untyped instanceof representation ) && !( value1Untyped instanceof representation_relationship ) && !( value1Untyped instanceof requirement_for_action_resource ) && !( value1Untyped instanceof resource_property ) && !( value1Untyped instanceof resource_requirement_type ) && !( value1Untyped instanceof security_classification ) && !( value1Untyped instanceof shape_aspect ) && !( value1Untyped instanceof shape_aspect_relationship ) && !( value1Untyped instanceof styled_item ) && !( value1Untyped instanceof time_interval_role ) && !( value1Untyped instanceof topological_representation_item ) && !( value1Untyped instanceof uncertainty_measure_with_unit ) && !( value1Untyped instanceof uncertainty_qualifier ) && !( value1Untyped instanceof versioned_action_request ) && !( value1Untyped instanceof versioned_action_request_relationship ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (action | action_directive | action_method | action_property | action_relationship | alternate_product_relationship | application_context | approval_relationship | assembly_component_usage_substitute | certification | configuration_design | configuration_item | contract | data_environment | date_role | date_time_role | descriptive_representation_item | document_relationship | draughting_title | effectivity | effectivity_relationship | event_occurrence | external_source | general_property | general_property_relationship | geometric_representation_item | geometric_tolerance | group | group_relationship | identification_role | kinematic_pair | mapped_item | name_assignment | organization_relationship | organization_role | organizational_project | organizational_project_relationship | pair_actuator | person_and_organization_role | presentation_layer_assignment | process_product_association | product | product_concept | product_concept_feature | product_concept_feature_association | product_concept_relationship | product_definition | product_definition_formation | product_definition_formation_relationship | product_definition_relationship | product_definition_substitute | product_related_product_category | property_definition | property_definition_relationship | representation | representation_relationship | requirement_for_action_resource | resource_property | resource_requirement_type | security_classification | shape_aspect | shape_aspect_relationship | styled_item | time_interval_role | topological_representation_item | uncertainty_measure_with_unit | uncertainty_qualifier | versioned_action_request | versioned_action_request_relationship)
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

    return this.items_ as Array<action | action_directive | action_method | action_property | action_relationship | alternate_product_relationship | application_context | approval_relationship | assembly_component_usage_substitute | certification | configuration_design | configuration_item | contract | data_environment | date_role | date_time_role | descriptive_representation_item | document_relationship | draughting_title | effectivity | effectivity_relationship | event_occurrence | external_source | general_property | general_property_relationship | geometric_representation_item | geometric_tolerance | group | group_relationship | identification_role | kinematic_pair | mapped_item | name_assignment | organization_relationship | organization_role | organizational_project | organizational_project_relationship | pair_actuator | person_and_organization_role | presentation_layer_assignment | process_product_association | product | product_concept | product_concept_feature | product_concept_feature_association | product_concept_relationship | product_definition | product_definition_formation | product_definition_formation_relationship | product_definition_relationship | product_definition_substitute | product_related_product_category | property_definition | property_definition_relationship | representation | representation_relationship | requirement_for_action_resource | resource_property | resource_requirement_type | security_classification | shape_aspect | shape_aspect_relationship | styled_item | time_interval_role | topological_representation_item | uncertainty_measure_with_unit | uncertainty_qualifier | versioned_action_request | versioned_action_request_relationship>
  }

  public get language() : string {
    return get_multi_language(this);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === multi_language_attribute_assignment.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for multi_language_attribute_assignment" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.MULTI_LANGUAGE_ATTRIBUTE_ASSIGNMENT ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.MULTI_LANGUAGE_ATTRIBUTE_ASSIGNMENT
}
