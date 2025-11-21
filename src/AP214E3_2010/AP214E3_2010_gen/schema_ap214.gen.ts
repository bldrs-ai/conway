/* This is generated code, don't alter */
import {
  FieldDescriptionKind,
} from '../../core/entity_field_description'
import { EntityDescription } from '../../core/entity_description'
import EntityTypesAP214 from './entity_types_ap214.gen'
import EntityTypesAP214Search from './entity_types_search.gen'
import StepEntityConstructor from '../../step/step_entity_constructor'
import StepEntityBase from '../../step/step_entity_base'
import StepEntitySchema from '../../step/step_entity_schema'
import StepParser from '../../step/parsing/step_parser'
import { abs_function } from './index'
import { unary_function_call } from './index'
import { acos_function } from './index'
import { action } from './index'
import { action_assignment } from './index'
import { action_directive } from './index'
import { action_method } from './index'
import { action_method_relationship } from './index'
import { action_property } from './index'
import { action_property_representation } from './index'
import { action_relationship } from './index'
import { action_request_assignment } from './index'
import { action_request_solution } from './index'
import { action_request_status } from './index'
import { action_resource } from './index'
import { action_resource_requirement } from './index'
import { action_resource_type } from './index'
import { action_status } from './index'
import { address } from './index'
import { advanced_brep_shape_representation } from './index'
import { shape_representation } from './index'
import { advanced_face } from './index'
import { face_surface } from './index'
import { alternate_product_relationship } from './index'
import { amount_of_substance_measure_with_unit } from './index'
import { measure_with_unit } from './index'
import { amount_of_substance_unit } from './index'
import { named_unit } from './index'
import { and_expression } from './index'
import { multiple_arity_boolean_expression } from './index'
import { angular_dimension } from './index'
import { dimension_curve_directed_callout } from './index'
import { angular_location } from './index'
import { dimensional_location } from './index'
import { angular_size } from './index'
import { dimensional_size } from './index'
import { angularity_tolerance } from './index'
import { geometric_tolerance_with_datum_reference } from './index'
import { annotation_curve_occurrence } from './index'
import { annotation_occurrence } from './index'
import { annotation_fill_area } from './index'
import { geometric_representation_item } from './index'
import { annotation_fill_area_occurrence } from './index'
import { annotation_text_occurrence } from './index'
import { annotation_symbol_occurrence } from './index'
import { styled_item } from './index'
import { annotation_occurrence_associativity } from './index'
import { annotation_occurrence_relationship } from './index'
import { annotation_plane } from './index'
import { annotation_subfigure_occurrence } from './index'
import { annotation_symbol } from './index'
import { mapped_item } from './index'
import { annotation_text } from './index'
import { annotation_text_character } from './index'
import { apex } from './index'
import { derived_shape_aspect } from './index'
import { application_context } from './index'
import { application_context_element } from './index'
import { product_concept_context } from './index'
import { product_context } from './index'
import { product_definition_context } from './index'
import { application_context_relationship } from './index'
import { application_protocol_definition } from './index'
import { applied_action_assignment } from './index'
import { applied_action_request_assignment } from './index'
import { applied_approval_assignment } from './index'
import { approval_assignment } from './index'
import { applied_area } from './index'
import { shape_aspect } from './index'
import { applied_certification_assignment } from './index'
import { certification_assignment } from './index'
import { applied_classification_assignment } from './index'
import { classification_assignment } from './index'
import { applied_contract_assignment } from './index'
import { contract_assignment } from './index'
import { applied_date_and_time_assignment } from './index'
import { date_and_time_assignment } from './index'
import { applied_date_assignment } from './index'
import { date_assignment } from './index'
import { applied_document_reference } from './index'
import { document_reference } from './index'
import { applied_document_usage_constraint_assignment } from './index'
import { document_usage_constraint_assignment } from './index'
import { applied_effectivity_assignment } from './index'
import { effectivity_assignment } from './index'
import { applied_event_occurrence_assignment } from './index'
import { event_occurrence_assignment } from './index'
import { applied_external_identification_assignment } from './index'
import { external_identification_assignment } from './index'
import { applied_group_assignment } from './index'
import { group_assignment } from './index'
import { applied_identification_assignment } from './index'
import { identification_assignment } from './index'
import { applied_ineffectivity_assignment } from './index'
import { applied_name_assignment } from './index'
import { name_assignment } from './index'
import { applied_organization_assignment } from './index'
import { organization_assignment } from './index'
import { applied_organizational_project_assignment } from './index'
import { organizational_project_assignment } from './index'
import { applied_person_and_organization_assignment } from './index'
import { person_and_organization_assignment } from './index'
import { applied_presented_item } from './index'
import { presented_item } from './index'
import { applied_security_classification_assignment } from './index'
import { security_classification_assignment } from './index'
import { applied_time_interval_assignment } from './index'
import { time_interval_assignment } from './index'
import { approval } from './index'
import { approval_date_time } from './index'
import { approval_person_organization } from './index'
import { approval_relationship } from './index'
import { approval_role } from './index'
import { approval_status } from './index'
import { approximation_tolerance } from './index'
import { founded_item } from './index'
import { approximation_tolerance_deviation } from './index'
import { approximation_tolerance_parameter } from './index'
import { area_in_set } from './index'
import { area_measure_with_unit } from './index'
import { area_unit } from './index'
import { derived_unit } from './index'
import { asin_function } from './index'
import { assembly_component_usage } from './index'
import { next_assembly_usage_occurrence } from './index'
import { specified_higher_usage_occurrence } from './index'
import { promissory_usage_occurrence } from './index'
import { product_definition_usage } from './index'
import { assembly_component_usage_substitute } from './index'
import { atan_function } from './index'
import { binary_function_call } from './index'
import { attribute_classification_assignment } from './index'
import { attribute_language_assignment } from './index'
import { attribute_value_assignment } from './index'
import { attribute_value_role } from './index'
import { axis1_placement } from './index'
import { placement } from './index'
import { axis2_placement_2d } from './index'
import { axis2_placement_3d } from './index'
import { b_spline_curve } from './index'
import { uniform_curve } from './index'
import { b_spline_curve_with_knots } from './index'
import { quasi_uniform_curve } from './index'
import { bezier_curve } from './index'
import { bounded_curve } from './index'
import { b_spline_surface } from './index'
import { b_spline_surface_with_knots } from './index'
import { uniform_surface } from './index'
import { quasi_uniform_surface } from './index'
import { bezier_surface } from './index'
import { bounded_surface } from './index'
import { background_colour } from './index'
import { colour } from './index'
import { barring_hole } from './index'
import { feature_definition } from './index'
import { bead } from './index'
import { bead_end } from './index'
import { binary_boolean_expression } from './index'
import { xor_expression } from './index'
import { equals_expression } from './index'
import { boolean_expression } from './index'
import { binary_generic_expression } from './index'
import { binary_numeric_expression } from './index'
import { generic_expression } from './index'
import { minus_expression } from './index'
import { div_expression } from './index'
import { mod_expression } from './index'
import { slash_expression } from './index'
import { power_expression } from './index'
import { numeric_expression } from './index'
import { block } from './index'
import { boolean_defined_function } from './index'
import { defined_function } from './index'
import { simple_boolean_expression } from './index'
import { unary_boolean_expression } from './index'
import { comparison_expression } from './index'
import { interval_expression } from './index'
import { expression } from './index'
import { boolean_literal } from './index'
import { generic_literal } from './index'
import { boolean_result } from './index'
import { boolean_variable } from './index'
import { variable } from './index'
import { boss } from './index'
import { boss_top } from './index'
import { boundary_curve } from './index'
import { composite_curve_on_surface } from './index'
import { polyline } from './index'
import { trimmed_curve } from './index'
import { bounded_pcurve } from './index'
import { bounded_surface_curve } from './index'
import { composite_curve } from './index'
import { curve } from './index'
import { pcurve } from './index'
import { rectangular_trimmed_surface } from './index'
import { curve_bounded_surface } from './index'
import { rectangular_composite_surface } from './index'
import { surface } from './index'
import { surface_curve } from './index'
import { box_domain } from './index'
import { boxed_half_space } from './index'
import { half_space_solid } from './index'
import { brep_with_voids } from './index'
import { manifold_solid_brep } from './index'
import { calendar_date } from './index'
import { date } from './index'
import { camera_image } from './index'
import { camera_image_2d_with_scale } from './index'
import { camera_image_3d_with_scale } from './index'
import { camera_model } from './index'
import { camera_model_d2 } from './index'
import { camera_model_d3 } from './index'
import { camera_model_d3_with_hlhsr } from './index'
import { camera_usage } from './index'
import { representation_map } from './index'
import { cartesian_point } from './index'
import { point } from './index'
import { cartesian_transformation_operator } from './index'
import { cartesian_transformation_operator_2d } from './index'
import { cartesian_transformation_operator_3d } from './index'
import { functionally_defined_transformation } from './index'
import { celsius_temperature_measure_with_unit } from './index'
import { centre_of_symmetry } from './index'
import { certification } from './index'
import { certification_type } from './index'
import { chamfer } from './index'
import { transition_feature } from './index'
import { chamfer_offset } from './index'
import { character_glyph_symbol } from './index'
import { generic_character_glyph_symbol } from './index'
import { characterized_class } from './index'
import { characterized_object } from './index'
import { class_ } from './index'
import { circle } from './index'
import { conic } from './index'
import { circular_closed_profile } from './index'
import { circular_pattern } from './index'
import { replicate_feature } from './index'
import { circular_runout_tolerance } from './index'
import { group } from './index'
import { class_system } from './index'
import { class_usage_effectivity_context_assignment } from './index'
import { effectivity_context_assignment } from './index'
import { classification_role } from './index'
import { closed_path_profile } from './index'
import { closed_shell } from './index'
import { connected_face_set } from './index'
import { coaxiality_tolerance } from './index'
import { colour_rgb } from './index'
import { colour_specification } from './index'
import { common_datum } from './index'
import { composite_shape_aspect } from './index'
import { datum } from './index'
import { comparison_equal } from './index'
import { comparison_greater } from './index'
import { comparison_greater_equal } from './index'
import { comparison_less } from './index'
import { comparison_less_equal } from './index'
import { comparison_not_equal } from './index'
import { like_expression } from './index'
import { composite_curve_segment } from './index'
import { composite_hole } from './index'
import { compound_feature } from './index'
import { composite_text } from './index'
import { composite_text_with_associated_curves } from './index'
import { composite_text_with_blanking_box } from './index'
import { composite_text_with_extent } from './index'
import { compound_representation_item } from './index'
import { representation_item } from './index'
import { compound_shape_representation } from './index'
import { concat_expression } from './index'
import { string_expression } from './index'
import { multiple_arity_generic_expression } from './index'
import { concentricity_tolerance } from './index'
import { concept_feature_operator } from './index'
import { concept_feature_relationship } from './index'
import { concept_feature_relationship_with_condition } from './index'
import { conditional_concept_feature } from './index'
import { product_concept_feature } from './index'
import { configurable_item } from './index'
import { configuration_item } from './index'
import { configuration_definition } from './index'
import { configuration_design } from './index'
import { configuration_effectivity } from './index'
import { product_definition_effectivity } from './index'
import { configuration_interpolation } from './index'
import { configured_effectivity_assignment } from './index'
import { configured_effectivity_context_assignment } from './index'
import { ellipse } from './index'
import { hyperbola } from './index'
import { parabola } from './index'
import { conical_surface } from './index'
import { elementary_surface } from './index'
import { connected_edge_set } from './index'
import { topological_representation_item } from './index'
import { open_shell } from './index'
import { connected_face_sub_set } from './index'
import { constructive_geometry_representation } from './index'
import { representation } from './index'
import { constructive_geometry_representation_relationship } from './index'
import { representation_relationship } from './index'
import { contact_ratio_representation } from './index'
import { context_dependent_invisibility } from './index'
import { invisibility } from './index'
import { context_dependent_over_riding_styled_item } from './index'
import { over_riding_styled_item } from './index'
import { context_dependent_shape_representation } from './index'
import { context_dependent_unit } from './index'
import { contract } from './index'
import { contract_type } from './index'
import { conversion_based_unit } from './index'
import { coordinated_universal_time_offset } from './index'
import { cos_function } from './index'
import { csg_shape_representation } from './index'
import { csg_solid } from './index'
import { solid_model } from './index'
import { line } from './index'
import { offset_curve_2d } from './index'
import { offset_curve_3d } from './index'
import { curve_replica } from './index'
import { curve_dimension } from './index'
import { curve_style } from './index'
import { curve_style_font } from './index'
import { curve_style_font_pattern } from './index'
import { curve_style_rendering } from './index'
import { curve_swept_solid_shape_representation } from './index'
import { cylindrical_pair } from './index'
import { kinematic_pair } from './index'
import { cylindrical_pair_range } from './index'
import { simple_pair_range } from './index'
import { cylindrical_pair_value } from './index'
import { pair_value } from './index'
import { cylindrical_surface } from './index'
import { cylindricity_tolerance } from './index'
import { geometric_tolerance } from './index'
import { data_environment } from './index'
import { date_and_time } from './index'
import { date_role } from './index'
import { date_time_role } from './index'
import { dated_effectivity } from './index'
import { effectivity } from './index'
import { datum_feature } from './index'
import { datum_feature_callout } from './index'
import { draughting_callout } from './index'
import { datum_reference } from './index'
import { datum_target } from './index'
import { datum_target_callout } from './index'
import { default_tolerance_table } from './index'
import { default_tolerance_table_cell } from './index'
import { defined_character_glyph } from './index'
import { numeric_defined_function } from './index'
import { string_defined_function } from './index'
import { defined_symbol } from './index'
import { definitional_representation } from './index'
import { degenerate_pcurve } from './index'
import { degenerate_toroidal_surface } from './index'
import { toroidal_surface } from './index'
import { geometric_alignment } from './index'
import { geometric_intersection } from './index'
import { parallel_offset } from './index'
import { perpendicular_to } from './index'
import { extension } from './index'
import { tangent } from './index'
import { volume_unit } from './index'
import { derived_unit_element } from './index'
import { derived_unit_variable } from './index'
import { variable_semantics } from './index'
import { description_attribute } from './index'
import { descriptive_representation_item } from './index'
import { diameter_dimension } from './index'
import { dimension_callout } from './index'
import { dimension_callout_component_relationship } from './index'
import { draughting_callout_relationship } from './index'
import { dimension_callout_relationship } from './index'
import { dimension_curve } from './index'
import { dimension_curve_terminator } from './index'
import { terminator_symbol } from './index'
import { dimension_pair } from './index'
import { dimension_related_tolerance_zone_element } from './index'
import { dimension_text_associativity } from './index'
import { text_literal } from './index'
import { dimensional_characteristic_representation } from './index'
import { dimensional_exponents } from './index'
import { dimensional_location_with_path } from './index'
import { shape_aspect_relationship } from './index'
import { dimensional_size_with_path } from './index'
import { directed_action } from './index'
import { executed_action } from './index'
import { directed_angle } from './index'
import { directed_dimensional_location } from './index'
import { direction } from './index'
import { direction_shape_representation } from './index'
import { document } from './index'
import { document_file } from './index'
import { document_product_association } from './index'
import { document_product_equivalence } from './index'
import { document_relationship } from './index'
import { document_representation_type } from './index'
import { document_type } from './index'
import { document_usage_constraint } from './index'
import { document_usage_role } from './index'
import { draughting_annotation_occurrence } from './index'
import { draughting_elements } from './index'
import { draughting_model } from './index'
import { draughting_model_item_association } from './index'
import { item_identified_representation_usage } from './index'
import { draughting_pre_defined_colour } from './index'
import { pre_defined_colour } from './index'
import { draughting_pre_defined_curve_font } from './index'
import { pre_defined_curve_font } from './index'
import { draughting_pre_defined_text_font } from './index'
import { pre_defined_text_font } from './index'
import { draughting_specification_reference } from './index'
import { draughting_subfigure_representation } from './index'
import { symbol_representation } from './index'
import { draughting_symbol_representation } from './index'
import { draughting_text_literal_with_delineation } from './index'
import { text_literal_with_delineation } from './index'
import { draughting_title } from './index'
import { drawing_definition } from './index'
import { drawing_revision } from './index'
import { presentation_set } from './index'
import { drawing_revision_sequence } from './index'
import { drawing_sheet_layout } from './index'
import { drawing_sheet_revision } from './index'
import { presentation_area } from './index'
import { drawing_sheet_revision_usage } from './index'
import { edge } from './index'
import { edge_curve } from './index'
import { oriented_edge } from './index'
import { subedge } from './index'
import { edge_based_wireframe_model } from './index'
import { edge_based_wireframe_shape_representation } from './index'
import { edge_loop } from './index'
import { loop } from './index'
import { path } from './index'
import { edge_round } from './index'
import { serial_numbered_effectivity } from './index'
import { lot_effectivity } from './index'
import { time_interval_based_effectivity } from './index'
import { effectivity_context_role } from './index'
import { effectivity_relationship } from './index'
import { electric_current_measure_with_unit } from './index'
import { electric_current_unit } from './index'
import { element_delivery } from './index'
import { plane } from './index'
import { spherical_surface } from './index'
import { environment } from './index'
import { evaluated_degenerate_pcurve } from './index'
import { event_occurrence } from './index'
import { event_occurrence_context_assignment } from './index'
import { event_occurrence_context_role } from './index'
import { event_occurrence_role } from './index'
import { exclusive_product_concept_feature_category } from './index'
import { product_concept_feature_category } from './index'
import { exp_function } from './index'
import { expression_conversion_based_unit } from './index'
import { external_source } from './index'
import { externally_defined_character_glyph } from './index'
import { externally_defined_item } from './index'
import { externally_defined_class } from './index'
import { externally_defined_curve_font } from './index'
import { externally_defined_dimension_definition } from './index'
import { externally_defined_feature_definition } from './index'
import { externally_defined_general_property } from './index'
import { general_property } from './index'
import { externally_defined_hatch_style } from './index'
import { externally_defined_item_relationship } from './index'
import { externally_defined_style } from './index'
import { externally_defined_symbol } from './index'
import { externally_defined_text_font } from './index'
import { externally_defined_tile_style } from './index'
import { extruded_area_solid } from './index'
import { swept_area_solid } from './index'
import { extruded_face_solid } from './index'
import { swept_face_solid } from './index'
import { face } from './index'
import { subface } from './index'
import { oriented_face } from './index'
import { face_based_surface_model } from './index'
import { face_bound } from './index'
import { face_outer_bound } from './index'
import { face_shape_representation } from './index'
import { faceted_brep } from './index'
import { faceted_brep_shape_representation } from './index'
import { feature_component_definition } from './index'
import { feature_component_relationship } from './index'
import { feature_in_panel } from './index'
import { feature_pattern } from './index'
import { featured_shape } from './index'
import { product_definition_shape } from './index'
import { fill_area_style } from './index'
import { fill_area_style_colour } from './index'
import { fill_area_style_hatching } from './index'
import { fill_area_style_tile_symbol_with_style } from './index'
import { fill_area_style_tiles } from './index'
import { fillet } from './index'
import { flatness_tolerance } from './index'
import { format_function } from './index'
import { founded_kinematic_path } from './index'
import { fully_constrained_pair } from './index'
import { gear_pair } from './index'
import { gear_pair_range } from './index'
import { gear_pair_value } from './index'
import { general_feature } from './index'
import { general_material_property } from './index'
import { general_property_association } from './index'
import { general_property_relationship } from './index'
import { simple_generic_expression } from './index'
import { unary_generic_expression } from './index'
import { generic_variable } from './index'
import { geometric_curve_set } from './index'
import { geometric_set } from './index'
import { geometric_item_specific_usage } from './index'
import { geometric_representation_context } from './index'
import { representation_context } from './index'
import { vector } from './index'
import { poly_loop } from './index'
import { vertex_point } from './index'
import { sphere } from './index'
import { right_circular_cone } from './index'
import { right_circular_cylinder } from './index'
import { torus } from './index'
import { right_angular_wedge } from './index'
import { shell_based_surface_model } from './index'
import { geometric_tolerance_relationship } from './index'
import { geometric_tolerance_with_defined_unit } from './index'
import { geometrical_tolerance_callout } from './index'
import { geometrically_bounded_2d_wireframe_representation } from './index'
import { geometrically_bounded_surface_shape_representation } from './index'
import { geometrically_bounded_wireframe_shape_representation } from './index'
import { global_uncertainty_assigned_context } from './index'
import { global_unit_assigned_context } from './index'
import { group_relationship } from './index'
import { hardness_representation } from './index'
import { hidden_element_over_riding_styled_item } from './index'
import { hole_bottom } from './index'
import { hole_in_panel } from './index'
import { homokinetic_pair } from './index'
import { universal_pair } from './index'
import { id_attribute } from './index'
import { identification_role } from './index'
import { inclusion_product_concept_feature } from './index'
import { index_expression } from './index'
import { initial_state } from './index'
import { instanced_feature } from './index'
import { int_literal } from './index'
import { literal_number } from './index'
import { int_numeric_variable } from './index'
import { numeric_variable } from './index'
import { int_value_function } from './index'
import { value_function } from './index'
import { integer_defined_function } from './index'
import { interpolated_configuration_sequence } from './index'
import { intersection_curve } from './index'
import { item_defined_transformation } from './index'
import { joggle } from './index'
import { joggle_termination } from './index'
import { kinematic_analysis_consistency } from './index'
import { kinematic_analysis_result } from './index'
import { kinematic_control } from './index'
import { kinematic_frame_background_representation } from './index'
import { kinematic_frame_background_representation_association } from './index'
import { representation_relationship_with_transformation } from './index'
import { kinematic_frame_based_transformation } from './index'
import { kinematic_ground_representation } from './index'
import { kinematic_joint } from './index'
import { kinematic_link } from './index'
import { kinematic_link_representation } from './index'
import { kinematic_link_representation_association } from './index'
import { kinematic_link_representation_relation } from './index'
import { kinematic_path } from './index'
import { kinematic_property_definition } from './index'
import { property_definition } from './index'
import { kinematic_property_representation_relation } from './index'
import { property_definition_representation } from './index'
import { kinematic_structure } from './index'
import { known_source } from './index'
import { pre_defined_item } from './index'
import { language } from './index'
import { language_assignment } from './index'
import { leader_curve } from './index'
import { leader_directed_callout } from './index'
import { leader_directed_dimension } from './index'
import { leader_terminator } from './index'
import { length_function } from './index'
import { length_measure_with_unit } from './index'
import { length_unit } from './index'
import { light_source } from './index'
import { light_source_ambient } from './index'
import { light_source_directional } from './index'
import { light_source_positional } from './index'
import { light_source_spot } from './index'
import { limits_and_fits } from './index'
import { line_profile_tolerance } from './index'
import { linear_dimension } from './index'
import { real_literal } from './index'
import { simple_numeric_expression } from './index'
import { local_time } from './index'
import { location_shape_representation } from './index'
import { locator } from './index'
import { log10_function } from './index'
import { log2_function } from './index'
import { log_function } from './index'
import { vertex_loop } from './index'
import { luminous_intensity_measure_with_unit } from './index'
import { luminous_intensity_unit } from './index'
import { make_from_usage_option } from './index'
import { manifold_subsurface_shape_representation } from './index'
import { manifold_surface_shape_representation } from './index'
import { mass_measure_with_unit } from './index'
import { mass_unit } from './index'
import { material_designation } from './index'
import { material_designation_characterization } from './index'
import { material_property } from './index'
import { material_property_representation } from './index'
import { maximum_function } from './index'
import { multiple_arity_function_call } from './index'
import { measure_qualification } from './index'
import { measure_representation_item } from './index'
import { time_measure_with_unit } from './index'
import { thermodynamic_temperature_measure_with_unit } from './index'
import { plane_angle_measure_with_unit } from './index'
import { solid_angle_measure_with_unit } from './index'
import { volume_measure_with_unit } from './index'
import { ratio_measure_with_unit } from './index'
import { mechanical_design_geometric_presentation_area } from './index'
import { mechanical_design_geometric_presentation_representation } from './index'
import { mechanism } from './index'
import { mechanism_base_placement } from './index'
import { minimum_function } from './index'
import { minus_function } from './index'
import { modified_geometric_tolerance } from './index'
import { modified_pattern } from './index'
import { moments_of_inertia_representation } from './index'
import { motion_link_relationship } from './index'
import { mult_expression } from './index'
import { multiple_arity_numeric_expression } from './index'
import { multi_language_attribute_assignment } from './index'
import { or_expression } from './index'
import { plus_expression } from './index'
import { name_attribute } from './index'
import { si_unit } from './index'
import { named_unit_variable } from './index'
import { ngon_closed_profile } from './index'
import { non_manifold_surface_shape_representation } from './index'
import { not_expression } from './index'
import { real_defined_function } from './index'
import { unary_numeric_expression } from './index'
import { real_numeric_variable } from './index'
import { object_role } from './index'
import { odd_function } from './index'
import { offset_surface } from './index'
import { one_direction_repeat_factor } from './index'
import { open_path_profile } from './index'
import { ordinate_dimension } from './index'
import { projection_directed_callout } from './index'
import { organization } from './index'
import { organization_relationship } from './index'
import { organization_role } from './index'
import { organizational_address } from './index'
import { organizational_project } from './index'
import { organizational_project_relationship } from './index'
import { organizational_project_role } from './index'
import { oriented_closed_shell } from './index'
import { oriented_open_shell } from './index'
import { oriented_path } from './index'
import { oriented_surface } from './index'
import { outer_boundary_curve } from './index'
import { package_product_concept_feature } from './index'
import { pair_actuator } from './index'
import { parallelism_tolerance } from './index'
import { parametric_representation_context } from './index'
import { partial_circular_profile } from './index'
import { path_feature_component } from './index'
import { path_shape_representation } from './index'
import { pattern_offset_membership } from './index'
import { pattern_omit_membership } from './index'
import { perpendicularity_tolerance } from './index'
import { person } from './index'
import { person_and_organization } from './index'
import { person_and_organization_address } from './index'
import { personal_address } from './index'
import { person_and_organization_role } from './index'
import { physically_modelled_product_definition } from './index'
import { product_definition_with_associated_documents } from './index'
import { placed_datum_target_feature } from './index'
import { placed_feature } from './index'
import { planar_box } from './index'
import { planar_extent } from './index'
import { planar_curve_pair } from './index'
import { planar_curve_pair_range } from './index'
import { planar_pair } from './index'
import { planar_pair_range } from './index'
import { planar_pair_value } from './index'
import { planar_shape_representation } from './index'
import { plane_angle_unit } from './index'
import { plus_minus_tolerance } from './index'
import { pocket } from './index'
import { pocket_bottom } from './index'
import { point_on_curve } from './index'
import { point_on_surface } from './index'
import { point_replica } from './index'
import { point_on_planar_curve_pair } from './index'
import { point_on_planar_curve_pair_range } from './index'
import { point_on_planar_curve_pair_value } from './index'
import { point_on_surface_pair } from './index'
import { point_on_surface_pair_range } from './index'
import { point_on_surface_pair_value } from './index'
import { point_placement_shape_representation } from './index'
import { point_style } from './index'
import { position_tolerance } from './index'
import { pre_defined_dimension_symbol } from './index'
import { pre_defined_symbol } from './index'
import { pre_defined_geometrical_tolerance_symbol } from './index'
import { pre_defined_marker } from './index'
import { pre_defined_point_marker_symbol } from './index'
import { pre_defined_presentation_style } from './index'
import { pre_defined_surface_condition_symbol } from './index'
import { pre_defined_terminator_symbol } from './index'
import { precision_qualifier } from './index'
import { presentation_representation } from './index'
import { presentation_layer_assignment } from './index'
import { presentation_view } from './index'
import { presentation_size } from './index'
import { presentation_style_assignment } from './index'
import { presentation_style_by_context } from './index'
import { presented_item_representation } from './index'
import { prismatic_pair } from './index'
import { prismatic_pair_range } from './index'
import { prismatic_pair_value } from './index'
import { process_operation } from './index'
import { process_plan } from './index'
import { process_product_association } from './index'
import { process_property_association } from './index'
import { product } from './index'
import { product_category } from './index'
import { product_category_relationship } from './index'
import { product_class } from './index'
import { product_concept } from './index'
import { product_concept_feature_association } from './index'
import { product_concept_feature_category_usage } from './index'
import { product_concept_relationship } from './index'
import { product_definition } from './index'
import { product_definition_context_association } from './index'
import { product_definition_context_role } from './index'
import { product_definition_formation } from './index'
import { product_definition_formation_relationship } from './index'
import { product_definition_formation_with_specified_source } from './index'
import { product_definition_occurrence_relationship } from './index'
import { product_definition_process } from './index'
import { product_definition_relationship } from './index'
import { product_definition_resource } from './index'
import { product_definition_substitute } from './index'
import { product_identification } from './index'
import { product_process_plan } from './index'
import { product_related_product_category } from './index'
import { product_specification } from './index'
import { projected_zone_definition } from './index'
import { tolerance_zone_definition } from './index'
import { projection_curve } from './index'
import { property_definition_relationship } from './index'
import { property_process } from './index'
import { qualified_representation_item } from './index'
import { qualitative_uncertainty } from './index'
import { uncertainty_qualifier } from './index'
import { quantified_assembly_component_usage } from './index'
import { rack_and_pinion_pair } from './index'
import { rack_and_pinion_pair_range } from './index'
import { rack_and_pinion_pair_value } from './index'
import { radius_dimension } from './index'
import { ratio_unit } from './index'
import { rational_b_spline_curve } from './index'
import { rational_b_spline_surface } from './index'
import { rectangular_closed_profile } from './index'
import { rectangular_pattern } from './index'
import { referenced_modified_datum } from './index'
import { relative_event_occurrence } from './index'
import { rep_item_group } from './index'
import { reparametrised_composite_curve_segment } from './index'
import { value_representation_item } from './index'
import { requirement_for_action_resource } from './index'
import { resource_property } from './index'
import { resource_property_representation } from './index'
import { resource_requirement_type } from './index'
import { resulting_path } from './index'
import { retention } from './index'
import { revolute_pair } from './index'
import { revolute_pair_range } from './index'
import { revolute_pair_value } from './index'
import { revolved_area_solid } from './index'
import { revolved_face_solid } from './index'
import { rib } from './index'
import { role_association } from './index'
import { rolling_curve_pair } from './index'
import { rolling_curve_pair_value } from './index'
import { rolling_surface_pair } from './index'
import { surface_pair } from './index'
import { rolling_surface_pair_value } from './index'
import { rotation_about_direction } from './index'
import { round_hole } from './index'
import { rounded_u_profile } from './index'
import { roundness_tolerance } from './index'
import { ruled_surface_swept_area_solid } from './index'
import { surface_curve_swept_area_solid } from './index'
import { runout_zone_definition } from './index'
import { runout_zone_orientation } from './index'
import { runout_zone_orientation_reference_direction } from './index'
import { screw_pair } from './index'
import { screw_pair_range } from './index'
import { screw_pair_value } from './index'
import { seam_curve } from './index'
import { seam_edge } from './index'
import { security_classification } from './index'
import { security_classification_level } from './index'
import { shape_aspect_associativity } from './index'
import { shape_aspect_deriving_relationship } from './index'
import { shape_aspect_transition } from './index'
import { shape_defining_relationship } from './index'
import { shape_definition_representation } from './index'
import { shape_dimension_representation } from './index'
import { shape_representation_relationship } from './index'
import { shape_representation_with_parameters } from './index'
import { simple_string_expression } from './index'
import { string_literal } from './index'
import { string_variable } from './index'
import { sin_function } from './index'
import { sliding_curve_pair } from './index'
import { sliding_curve_pair_value } from './index'
import { sliding_surface_pair } from './index'
import { sliding_surface_pair_value } from './index'
import { slot } from './index'
import { slot_end } from './index'
import { solid_angle_unit } from './index'
import { swept_disk_solid } from './index'
import { solid_replica } from './index'
import { spherical_pair } from './index'
import { spherical_pair_range } from './index'
import { spherical_pair_value } from './index'
import { sql_mappable_defined_function } from './index'
import { square_root_function } from './index'
import { square_u_profile } from './index'
import { standard_uncertainty } from './index'
import { straightness_tolerance } from './index'
import { substring_expression } from './index'
import { structured_dimension_callout } from './index'
import { swept_surface } from './index'
import { surface_replica } from './index'
import { surface_condition_callout } from './index'
import { surface_of_linear_extrusion } from './index'
import { surface_of_revolution } from './index'
import { surface_pair_range } from './index'
import { surface_patch } from './index'
import { surface_profile_tolerance } from './index'
import { surface_rendering_properties } from './index'
import { surface_side_style } from './index'
import { surface_style_boundary } from './index'
import { surface_style_control_grid } from './index'
import { surface_style_fill_area } from './index'
import { surface_style_parameter_line } from './index'
import { surface_style_reflectance_ambient } from './index'
import { surface_style_reflectance_ambient_diffuse } from './index'
import { surface_style_reflectance_ambient_diffuse_specular } from './index'
import { surface_style_rendering } from './index'
import { surface_style_rendering_with_properties } from './index'
import { surface_style_segmentation_curve } from './index'
import { surface_style_silhouette } from './index'
import { surface_style_transparent } from './index'
import { surface_style_usage } from './index'
import { surface_texture_representation } from './index'
import { symbol_colour } from './index'
import { symbol_representation_map } from './index'
import { symbol_style } from './index'
import { symbol_target } from './index'
import { symmetric_shape_aspect } from './index'
import { symmetry_tolerance } from './index'
import { tactile_appearance_representation } from './index'
import { tan_function } from './index'
import { taper } from './index'
import { tee_profile } from './index'
import { text_literal_with_associated_curves } from './index'
import { text_literal_with_blanking_box } from './index'
import { text_literal_with_extent } from './index'
import { text_string_representation } from './index'
import { text_style } from './index'
import { text_style_for_defined_font } from './index'
import { text_style_with_box_characteristics } from './index'
import { text_style_with_mirror } from './index'
import { text_style_with_spacing } from './index'
import { thermodynamic_temperature_unit } from './index'
import { thread } from './index'
import { time_interval } from './index'
import { time_interval_role } from './index'
import { time_interval_with_bounds } from './index'
import { time_unit } from './index'
import { tolerance_value } from './index'
import { tolerance_zone } from './index'
import { tolerance_zone_form } from './index'
import { vertex } from './index'
import { total_runout_tolerance } from './index'
import { two_direction_repeat_factor } from './index'
import { type_qualifier } from './index'
import { uncertainty_assigned_representation } from './index'
import { uncertainty_measure_with_unit } from './index'
import { unconstrained_pair } from './index'
import { unconstrained_pair_value } from './index'
import { universal_pair_range } from './index'
import { universal_pair_value } from './index'
import { value_range } from './index'
import { vector_style } from './index'
import { vee_profile } from './index'
import { versioned_action_request } from './index'
import { versioned_action_request_relationship } from './index'
import { view_volume } from './index'
import { visual_appearance_representation } from './index'
import { amount_of_substance_measure } from './index'
import { area_measure } from './index'
import { box_height } from './index'
import { box_rotate_angle } from './index'
import { box_slant_angle } from './index'
import { box_width } from './index'
import { celsius_temperature_measure } from './index'
import { context_dependent_measure } from './index'
import { count_measure } from './index'
import { curve_tolerance_deviation } from './index'
import { curve_tolerance_parameter } from './index'
import { day_in_month_number } from './index'
import { descriptive_measure } from './index'
import { dimension_count } from './index'
import { electric_current_measure } from './index'
import { hour_in_day } from './index'
import { identifier } from './index'
import { label } from './index'
import { length_measure } from './index'
import { list_of_reversible_topology_item } from './index'
import { list_representation_item } from './index'
import { luminous_intensity_measure } from './index'
import { mass_measure } from './index'
import { minute_in_hour } from './index'
import { month_in_year_number } from './index'
import { non_negative_length_measure } from './index'
import { numeric_measure } from './index'
import { parameter_value } from './index'
import { plane_angle_measure } from './index'
import { positive_length_measure } from './index'
import { positive_plane_angle_measure } from './index'
import { positive_ratio_measure } from './index'
import { presentable_text } from './index'
import { ratio_measure } from './index'
import { second_in_minute } from './index'
import { set_of_reversible_topology_item } from './index'
import { set_representation_item } from './index'
import { solid_angle_measure } from './index'
import { surface_tolerance_deviation } from './index'
import { surface_tolerance_parameter } from './index'
import { text } from './index'
import { text_alignment } from './index'
import { text_delineation } from './index'
import { thermodynamic_temperature_measure } from './index'
import { time_measure } from './index'
import { u_direction_count } from './index'
import { v_direction_count } from './index'
import { volume_measure } from './index'
import { year_number } from './index'
import { ypr_rotation } from './index'
import { ahead_or_behind } from './index'
import { angle_relator } from './index'
import { approximation_method } from './index'
import { b_spline_curve_form } from './index'
import { b_spline_surface_form } from './index'
import { boolean_operator } from './index'
import { central_or_parallel } from './index'
import { dimension_extent_usage } from './index'
import { interpolation_type } from './index'
import { knot_type } from './index'
import { limit_condition } from './index'
import { marker_type } from './index'
import { null_style } from './index'
import { preferred_surface_curve_representation } from './index'
import { product_or_presentation_space } from './index'
import { shading_curve_method } from './index'
import { shading_surface_method } from './index'
import { si_prefix } from './index'
import { si_unit_name } from './index'
import { source } from './index'
import { surface_side } from './index'
import { text_path } from './index'
import { transition_code } from './index'
import { trimming_preference } from './index'
import { unlimited_range } from './index'
import { ypr_enumeration } from './index'
let constructors : ( StepEntityConstructor< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > | undefined )[]  = [
  void 0,
  abs_function,
  void 0,
  acos_function,
  action,
  void 0,
  action_directive,
  action_method,
  action_method_relationship,
  action_property,
  action_property_representation,
  action_relationship,
  void 0,
  action_request_solution,
  action_request_status,
  action_resource,
  action_resource_requirement,
  action_resource_type,
  action_status,
  address,
  advanced_brep_shape_representation,
  shape_representation,
  advanced_face,
  face_surface,
  alternate_product_relationship,
  amount_of_substance_measure_with_unit,
  measure_with_unit,
  amount_of_substance_unit,
  named_unit,
  and_expression,
  void 0,
  angular_dimension,
  dimension_curve_directed_callout,
  angular_location,
  dimensional_location,
  angular_size,
  dimensional_size,
  angularity_tolerance,
  geometric_tolerance_with_datum_reference,
  annotation_curve_occurrence,
  annotation_occurrence,
  annotation_fill_area,
  geometric_representation_item,
  annotation_fill_area_occurrence,
  annotation_text_occurrence,
  annotation_symbol_occurrence,
  styled_item,
  annotation_occurrence_associativity,
  annotation_occurrence_relationship,
  annotation_plane,
  annotation_subfigure_occurrence,
  annotation_symbol,
  mapped_item,
  annotation_text,
  annotation_text_character,
  apex,
  derived_shape_aspect,
  application_context,
  application_context_element,
  product_concept_context,
  product_context,
  product_definition_context,
  application_context_relationship,
  application_protocol_definition,
  applied_action_assignment,
  applied_action_request_assignment,
  applied_approval_assignment,
  void 0,
  applied_area,
  shape_aspect,
  applied_certification_assignment,
  void 0,
  applied_classification_assignment,
  void 0,
  applied_contract_assignment,
  void 0,
  applied_date_and_time_assignment,
  void 0,
  applied_date_assignment,
  void 0,
  applied_document_reference,
  void 0,
  applied_document_usage_constraint_assignment,
  void 0,
  applied_effectivity_assignment,
  void 0,
  applied_event_occurrence_assignment,
  void 0,
  applied_external_identification_assignment,
  void 0,
  applied_group_assignment,
  void 0,
  applied_identification_assignment,
  void 0,
  applied_ineffectivity_assignment,
  applied_name_assignment,
  void 0,
  applied_organization_assignment,
  void 0,
  applied_organizational_project_assignment,
  void 0,
  applied_person_and_organization_assignment,
  void 0,
  applied_presented_item,
  void 0,
  applied_security_classification_assignment,
  void 0,
  applied_time_interval_assignment,
  void 0,
  approval,
  approval_date_time,
  approval_person_organization,
  approval_relationship,
  approval_role,
  approval_status,
  approximation_tolerance,
  founded_item,
  approximation_tolerance_deviation,
  approximation_tolerance_parameter,
  area_in_set,
  area_measure_with_unit,
  area_unit,
  derived_unit,
  asin_function,
  assembly_component_usage,
  next_assembly_usage_occurrence,
  specified_higher_usage_occurrence,
  promissory_usage_occurrence,
  product_definition_usage,
  assembly_component_usage_substitute,
  atan_function,
  void 0,
  void 0,
  attribute_language_assignment,
  void 0,
  attribute_value_role,
  axis1_placement,
  placement,
  axis2_placement_2d,
  axis2_placement_3d,
  b_spline_curve,
  uniform_curve,
  b_spline_curve_with_knots,
  quasi_uniform_curve,
  bezier_curve,
  bounded_curve,
  b_spline_surface,
  b_spline_surface_with_knots,
  uniform_surface,
  quasi_uniform_surface,
  bezier_surface,
  bounded_surface,
  background_colour,
  colour,
  barring_hole,
  feature_definition,
  bead,
  bead_end,
  void 0,
  xor_expression,
  equals_expression,
  void 0,
  void 0,
  void 0,
  void 0,
  minus_expression,
  div_expression,
  mod_expression,
  slash_expression,
  power_expression,
  void 0,
  block,
  void 0,
  void 0,
  void 0,
  void 0,
  void 0,
  interval_expression,
  void 0,
  boolean_literal,
  void 0,
  boolean_result,
  boolean_variable,
  void 0,
  boss,
  boss_top,
  boundary_curve,
  composite_curve_on_surface,
  polyline,
  trimmed_curve,
  bounded_pcurve,
  bounded_surface_curve,
  composite_curve,
  curve,
  pcurve,
  rectangular_trimmed_surface,
  curve_bounded_surface,
  rectangular_composite_surface,
  surface,
  surface_curve,
  box_domain,
  boxed_half_space,
  half_space_solid,
  brep_with_voids,
  manifold_solid_brep,
  calendar_date,
  date,
  camera_image,
  camera_image_2d_with_scale,
  camera_image_3d_with_scale,
  void 0,
  camera_model_d2,
  camera_model_d3,
  camera_model_d3_with_hlhsr,
  camera_usage,
  representation_map,
  cartesian_point,
  point,
  cartesian_transformation_operator,
  cartesian_transformation_operator_2d,
  cartesian_transformation_operator_3d,
  functionally_defined_transformation,
  celsius_temperature_measure_with_unit,
  centre_of_symmetry,
  certification,
  certification_type,
  chamfer,
  transition_feature,
  chamfer_offset,
  character_glyph_symbol,
  void 0,
  characterized_class,
  characterized_object,
  class_,
  circle,
  conic,
  circular_closed_profile,
  circular_pattern,
  replicate_feature,
  circular_runout_tolerance,
  group,
  class_system,
  class_usage_effectivity_context_assignment,
  void 0,
  classification_role,
  closed_path_profile,
  closed_shell,
  connected_face_set,
  coaxiality_tolerance,
  colour_rgb,
  colour_specification,
  common_datum,
  composite_shape_aspect,
  datum,
  comparison_equal,
  comparison_greater,
  comparison_greater_equal,
  comparison_less,
  comparison_less_equal,
  comparison_not_equal,
  like_expression,
  composite_curve_segment,
  composite_hole,
  compound_feature,
  composite_text,
  composite_text_with_associated_curves,
  composite_text_with_blanking_box,
  composite_text_with_extent,
  compound_representation_item,
  representation_item,
  compound_shape_representation,
  concat_expression,
  void 0,
  void 0,
  concentricity_tolerance,
  concept_feature_operator,
  concept_feature_relationship,
  concept_feature_relationship_with_condition,
  conditional_concept_feature,
  product_concept_feature,
  configurable_item,
  configuration_item,
  configuration_definition,
  configuration_design,
  configuration_effectivity,
  product_definition_effectivity,
  configuration_interpolation,
  configured_effectivity_assignment,
  configured_effectivity_context_assignment,
  ellipse,
  hyperbola,
  parabola,
  conical_surface,
  elementary_surface,
  connected_edge_set,
  topological_representation_item,
  open_shell,
  connected_face_sub_set,
  constructive_geometry_representation,
  representation,
  constructive_geometry_representation_relationship,
  representation_relationship,
  contact_ratio_representation,
  context_dependent_invisibility,
  invisibility,
  context_dependent_over_riding_styled_item,
  over_riding_styled_item,
  context_dependent_shape_representation,
  context_dependent_unit,
  contract,
  contract_type,
  conversion_based_unit,
  coordinated_universal_time_offset,
  cos_function,
  csg_shape_representation,
  csg_solid,
  solid_model,
  line,
  offset_curve_2d,
  offset_curve_3d,
  curve_replica,
  curve_dimension,
  curve_style,
  curve_style_font,
  curve_style_font_pattern,
  curve_style_rendering,
  curve_swept_solid_shape_representation,
  cylindrical_pair,
  kinematic_pair,
  cylindrical_pair_range,
  simple_pair_range,
  cylindrical_pair_value,
  pair_value,
  cylindrical_surface,
  cylindricity_tolerance,
  geometric_tolerance,
  data_environment,
  date_and_time,
  date_role,
  date_time_role,
  dated_effectivity,
  effectivity,
  datum_feature,
  datum_feature_callout,
  draughting_callout,
  datum_reference,
  datum_target,
  datum_target_callout,
  default_tolerance_table,
  default_tolerance_table_cell,
  defined_character_glyph,
  void 0,
  void 0,
  defined_symbol,
  definitional_representation,
  degenerate_pcurve,
  degenerate_toroidal_surface,
  toroidal_surface,
  geometric_alignment,
  geometric_intersection,
  parallel_offset,
  perpendicular_to,
  extension,
  tangent,
  volume_unit,
  derived_unit_element,
  derived_unit_variable,
  void 0,
  description_attribute,
  descriptive_representation_item,
  diameter_dimension,
  dimension_callout,
  dimension_callout_component_relationship,
  draughting_callout_relationship,
  dimension_callout_relationship,
  dimension_curve,
  dimension_curve_terminator,
  terminator_symbol,
  dimension_pair,
  dimension_related_tolerance_zone_element,
  dimension_text_associativity,
  text_literal,
  dimensional_characteristic_representation,
  dimensional_exponents,
  dimensional_location_with_path,
  shape_aspect_relationship,
  dimensional_size_with_path,
  directed_action,
  executed_action,
  directed_angle,
  directed_dimensional_location,
  direction,
  direction_shape_representation,
  document,
  document_file,
  document_product_association,
  document_product_equivalence,
  document_relationship,
  document_representation_type,
  document_type,
  document_usage_constraint,
  document_usage_role,
  draughting_annotation_occurrence,
  draughting_elements,
  draughting_model,
  draughting_model_item_association,
  item_identified_representation_usage,
  draughting_pre_defined_colour,
  pre_defined_colour,
  draughting_pre_defined_curve_font,
  pre_defined_curve_font,
  draughting_pre_defined_text_font,
  pre_defined_text_font,
  draughting_specification_reference,
  draughting_subfigure_representation,
  symbol_representation,
  draughting_symbol_representation,
  draughting_text_literal_with_delineation,
  text_literal_with_delineation,
  draughting_title,
  drawing_definition,
  drawing_revision,
  presentation_set,
  drawing_revision_sequence,
  drawing_sheet_layout,
  drawing_sheet_revision,
  presentation_area,
  drawing_sheet_revision_usage,
  edge,
  edge_curve,
  oriented_edge,
  subedge,
  edge_based_wireframe_model,
  edge_based_wireframe_shape_representation,
  edge_loop,
  loop,
  path,
  edge_round,
  serial_numbered_effectivity,
  lot_effectivity,
  time_interval_based_effectivity,
  effectivity_context_role,
  effectivity_relationship,
  electric_current_measure_with_unit,
  electric_current_unit,
  element_delivery,
  plane,
  spherical_surface,
  environment,
  evaluated_degenerate_pcurve,
  event_occurrence,
  void 0,
  event_occurrence_context_role,
  event_occurrence_role,
  exclusive_product_concept_feature_category,
  product_concept_feature_category,
  exp_function,
  expression_conversion_based_unit,
  external_source,
  externally_defined_character_glyph,
  externally_defined_item,
  externally_defined_class,
  externally_defined_curve_font,
  externally_defined_dimension_definition,
  externally_defined_feature_definition,
  externally_defined_general_property,
  general_property,
  externally_defined_hatch_style,
  externally_defined_item_relationship,
  externally_defined_style,
  externally_defined_symbol,
  externally_defined_text_font,
  externally_defined_tile_style,
  extruded_area_solid,
  swept_area_solid,
  extruded_face_solid,
  swept_face_solid,
  face,
  subface,
  oriented_face,
  face_based_surface_model,
  face_bound,
  face_outer_bound,
  face_shape_representation,
  faceted_brep,
  faceted_brep_shape_representation,
  feature_component_definition,
  feature_component_relationship,
  feature_in_panel,
  feature_pattern,
  featured_shape,
  product_definition_shape,
  fill_area_style,
  fill_area_style_colour,
  fill_area_style_hatching,
  fill_area_style_tile_symbol_with_style,
  fill_area_style_tiles,
  fillet,
  flatness_tolerance,
  format_function,
  founded_kinematic_path,
  fully_constrained_pair,
  gear_pair,
  gear_pair_range,
  gear_pair_value,
  general_feature,
  general_material_property,
  general_property_association,
  general_property_relationship,
  void 0,
  void 0,
  void 0,
  geometric_curve_set,
  geometric_set,
  geometric_item_specific_usage,
  geometric_representation_context,
  representation_context,
  vector,
  poly_loop,
  vertex_point,
  sphere,
  right_circular_cone,
  right_circular_cylinder,
  torus,
  right_angular_wedge,
  shell_based_surface_model,
  geometric_tolerance_relationship,
  geometric_tolerance_with_defined_unit,
  geometrical_tolerance_callout,
  geometrically_bounded_2d_wireframe_representation,
  geometrically_bounded_surface_shape_representation,
  geometrically_bounded_wireframe_shape_representation,
  global_uncertainty_assigned_context,
  global_unit_assigned_context,
  group_relationship,
  hardness_representation,
  hidden_element_over_riding_styled_item,
  hole_bottom,
  hole_in_panel,
  homokinetic_pair,
  universal_pair,
  id_attribute,
  identification_role,
  inclusion_product_concept_feature,
  index_expression,
  initial_state,
  instanced_feature,
  int_literal,
  void 0,
  int_numeric_variable,
  numeric_variable,
  int_value_function,
  value_function,
  void 0,
  interpolated_configuration_sequence,
  intersection_curve,
  item_defined_transformation,
  joggle,
  joggle_termination,
  kinematic_analysis_consistency,
  kinematic_analysis_result,
  kinematic_control,
  kinematic_frame_background_representation,
  kinematic_frame_background_representation_association,
  representation_relationship_with_transformation,
  kinematic_frame_based_transformation,
  kinematic_ground_representation,
  kinematic_joint,
  kinematic_link,
  kinematic_link_representation,
  kinematic_link_representation_association,
  kinematic_link_representation_relation,
  kinematic_path,
  kinematic_property_definition,
  property_definition,
  kinematic_property_representation_relation,
  property_definition_representation,
  kinematic_structure,
  known_source,
  pre_defined_item,
  language,
  language_assignment,
  leader_curve,
  leader_directed_callout,
  leader_directed_dimension,
  leader_terminator,
  length_function,
  length_measure_with_unit,
  length_unit,
  light_source,
  light_source_ambient,
  light_source_directional,
  light_source_positional,
  light_source_spot,
  limits_and_fits,
  line_profile_tolerance,
  linear_dimension,
  real_literal,
  void 0,
  local_time,
  location_shape_representation,
  locator,
  log10_function,
  log2_function,
  log_function,
  vertex_loop,
  luminous_intensity_measure_with_unit,
  luminous_intensity_unit,
  make_from_usage_option,
  manifold_subsurface_shape_representation,
  manifold_surface_shape_representation,
  mass_measure_with_unit,
  mass_unit,
  material_designation,
  material_designation_characterization,
  material_property,
  material_property_representation,
  maximum_function,
  void 0,
  measure_qualification,
  measure_representation_item,
  time_measure_with_unit,
  thermodynamic_temperature_measure_with_unit,
  plane_angle_measure_with_unit,
  solid_angle_measure_with_unit,
  volume_measure_with_unit,
  ratio_measure_with_unit,
  mechanical_design_geometric_presentation_area,
  mechanical_design_geometric_presentation_representation,
  mechanism,
  mechanism_base_placement,
  minimum_function,
  minus_function,
  modified_geometric_tolerance,
  modified_pattern,
  moments_of_inertia_representation,
  motion_link_relationship,
  mult_expression,
  void 0,
  multi_language_attribute_assignment,
  or_expression,
  plus_expression,
  name_attribute,
  si_unit,
  named_unit_variable,
  ngon_closed_profile,
  non_manifold_surface_shape_representation,
  not_expression,
  void 0,
  void 0,
  real_numeric_variable,
  object_role,
  odd_function,
  offset_surface,
  one_direction_repeat_factor,
  open_path_profile,
  ordinate_dimension,
  projection_directed_callout,
  organization,
  organization_relationship,
  organization_role,
  organizational_address,
  organizational_project,
  organizational_project_relationship,
  organizational_project_role,
  oriented_closed_shell,
  oriented_open_shell,
  oriented_path,
  oriented_surface,
  outer_boundary_curve,
  package_product_concept_feature,
  pair_actuator,
  parallelism_tolerance,
  parametric_representation_context,
  partial_circular_profile,
  path_feature_component,
  path_shape_representation,
  pattern_offset_membership,
  pattern_omit_membership,
  perpendicularity_tolerance,
  person,
  person_and_organization,
  person_and_organization_address,
  personal_address,
  person_and_organization_role,
  physically_modelled_product_definition,
  product_definition_with_associated_documents,
  placed_datum_target_feature,
  placed_feature,
  planar_box,
  planar_extent,
  planar_curve_pair,
  planar_curve_pair_range,
  planar_pair,
  planar_pair_range,
  planar_pair_value,
  planar_shape_representation,
  plane_angle_unit,
  plus_minus_tolerance,
  pocket,
  pocket_bottom,
  point_on_curve,
  point_on_surface,
  point_replica,
  point_on_planar_curve_pair,
  point_on_planar_curve_pair_range,
  point_on_planar_curve_pair_value,
  point_on_surface_pair,
  point_on_surface_pair_range,
  point_on_surface_pair_value,
  point_placement_shape_representation,
  point_style,
  position_tolerance,
  pre_defined_dimension_symbol,
  pre_defined_symbol,
  pre_defined_geometrical_tolerance_symbol,
  pre_defined_marker,
  pre_defined_point_marker_symbol,
  pre_defined_presentation_style,
  pre_defined_surface_condition_symbol,
  pre_defined_terminator_symbol,
  precision_qualifier,
  presentation_representation,
  presentation_layer_assignment,
  presentation_view,
  presentation_size,
  presentation_style_assignment,
  presentation_style_by_context,
  presented_item_representation,
  prismatic_pair,
  prismatic_pair_range,
  prismatic_pair_value,
  process_operation,
  process_plan,
  process_product_association,
  process_property_association,
  product,
  product_category,
  product_category_relationship,
  product_class,
  product_concept,
  product_concept_feature_association,
  product_concept_feature_category_usage,
  product_concept_relationship,
  product_definition,
  product_definition_context_association,
  product_definition_context_role,
  product_definition_formation,
  product_definition_formation_relationship,
  product_definition_formation_with_specified_source,
  product_definition_occurrence_relationship,
  product_definition_process,
  product_definition_relationship,
  product_definition_resource,
  product_definition_substitute,
  product_identification,
  product_process_plan,
  product_related_product_category,
  product_specification,
  projected_zone_definition,
  tolerance_zone_definition,
  projection_curve,
  property_definition_relationship,
  property_process,
  qualified_representation_item,
  qualitative_uncertainty,
  uncertainty_qualifier,
  quantified_assembly_component_usage,
  rack_and_pinion_pair,
  rack_and_pinion_pair_range,
  rack_and_pinion_pair_value,
  radius_dimension,
  ratio_unit,
  rational_b_spline_curve,
  rational_b_spline_surface,
  rectangular_closed_profile,
  rectangular_pattern,
  referenced_modified_datum,
  relative_event_occurrence,
  rep_item_group,
  reparametrised_composite_curve_segment,
  value_representation_item,
  requirement_for_action_resource,
  resource_property,
  resource_property_representation,
  resource_requirement_type,
  resulting_path,
  retention,
  revolute_pair,
  revolute_pair_range,
  revolute_pair_value,
  revolved_area_solid,
  revolved_face_solid,
  rib,
  role_association,
  rolling_curve_pair,
  rolling_curve_pair_value,
  rolling_surface_pair,
  surface_pair,
  rolling_surface_pair_value,
  rotation_about_direction,
  round_hole,
  rounded_u_profile,
  roundness_tolerance,
  ruled_surface_swept_area_solid,
  surface_curve_swept_area_solid,
  runout_zone_definition,
  runout_zone_orientation,
  runout_zone_orientation_reference_direction,
  screw_pair,
  screw_pair_range,
  screw_pair_value,
  seam_curve,
  seam_edge,
  security_classification,
  security_classification_level,
  shape_aspect_associativity,
  shape_aspect_deriving_relationship,
  shape_aspect_transition,
  shape_defining_relationship,
  shape_definition_representation,
  shape_dimension_representation,
  shape_representation_relationship,
  shape_representation_with_parameters,
  void 0,
  string_literal,
  string_variable,
  sin_function,
  sliding_curve_pair,
  sliding_curve_pair_value,
  sliding_surface_pair,
  sliding_surface_pair_value,
  slot,
  slot_end,
  solid_angle_unit,
  swept_disk_solid,
  solid_replica,
  spherical_pair,
  spherical_pair_range,
  spherical_pair_value,
  void 0,
  square_root_function,
  square_u_profile,
  standard_uncertainty,
  straightness_tolerance,
  substring_expression,
  structured_dimension_callout,
  swept_surface,
  surface_replica,
  surface_condition_callout,
  surface_of_linear_extrusion,
  surface_of_revolution,
  surface_pair_range,
  surface_patch,
  surface_profile_tolerance,
  surface_rendering_properties,
  surface_side_style,
  surface_style_boundary,
  surface_style_control_grid,
  surface_style_fill_area,
  surface_style_parameter_line,
  surface_style_reflectance_ambient,
  surface_style_reflectance_ambient_diffuse,
  surface_style_reflectance_ambient_diffuse_specular,
  surface_style_rendering,
  surface_style_rendering_with_properties,
  surface_style_segmentation_curve,
  surface_style_silhouette,
  surface_style_transparent,
  surface_style_usage,
  surface_texture_representation,
  symbol_colour,
  symbol_representation_map,
  symbol_style,
  symbol_target,
  symmetric_shape_aspect,
  symmetry_tolerance,
  tactile_appearance_representation,
  tan_function,
  taper,
  tee_profile,
  text_literal_with_associated_curves,
  text_literal_with_blanking_box,
  text_literal_with_extent,
  text_string_representation,
  text_style,
  text_style_for_defined_font,
  text_style_with_box_characteristics,
  text_style_with_mirror,
  text_style_with_spacing,
  thermodynamic_temperature_unit,
  thread,
  time_interval,
  time_interval_role,
  time_interval_with_bounds,
  time_unit,
  tolerance_value,
  tolerance_zone,
  tolerance_zone_form,
  vertex,
  total_runout_tolerance,
  two_direction_repeat_factor,
  type_qualifier,
  uncertainty_assigned_representation,
  uncertainty_measure_with_unit,
  unconstrained_pair,
  unconstrained_pair_value,
  universal_pair_range,
  universal_pair_value,
  value_range,
  vector_style,
  vee_profile,
  versioned_action_request,
  versioned_action_request_relationship,
  view_volume,
  visual_appearance_representation,
  amount_of_substance_measure,
  area_measure,
  box_height,
  box_rotate_angle,
  box_slant_angle,
  box_width,
  celsius_temperature_measure,
  context_dependent_measure,
  count_measure,
  curve_tolerance_deviation,
  curve_tolerance_parameter,
  day_in_month_number,
  descriptive_measure,
  dimension_count,
  electric_current_measure,
  hour_in_day,
  identifier,
  label,
  length_measure,
  list_of_reversible_topology_item,
  list_representation_item,
  luminous_intensity_measure,
  mass_measure,
  minute_in_hour,
  month_in_year_number,
  non_negative_length_measure,
  numeric_measure,
  parameter_value,
  plane_angle_measure,
  positive_length_measure,
  positive_plane_angle_measure,
  positive_ratio_measure,
  presentable_text,
  ratio_measure,
  second_in_minute,
  set_of_reversible_topology_item,
  set_representation_item,
  solid_angle_measure,
  surface_tolerance_deviation,
  surface_tolerance_parameter,
  text,
  text_alignment,
  text_delineation,
  thermodynamic_temperature_measure,
  time_measure,
  u_direction_count,
  v_direction_count,
  volume_measure,
  year_number,
  ypr_rotation,
]
const f = FieldDescriptionKind
const e = EntityTypesAP214
let queries : EntityTypesAP214[][] = [
  [ EntityTypesAP214.EXTERNALMAPPINGCONTAINER ],
  abs_function.query,
  unary_function_call.query,
  acos_function.query,
  action.query,
  action_assignment.query,
  action_directive.query,
  action_method.query,
  action_method_relationship.query,
  action_property.query,
  action_property_representation.query,
  action_relationship.query,
  action_request_assignment.query,
  action_request_solution.query,
  action_request_status.query,
  action_resource.query,
  action_resource_requirement.query,
  action_resource_type.query,
  action_status.query,
  address.query,
  advanced_brep_shape_representation.query,
  shape_representation.query,
  advanced_face.query,
  face_surface.query,
  alternate_product_relationship.query,
  amount_of_substance_measure_with_unit.query,
  measure_with_unit.query,
  amount_of_substance_unit.query,
  named_unit.query,
  and_expression.query,
  multiple_arity_boolean_expression.query,
  angular_dimension.query,
  dimension_curve_directed_callout.query,
  angular_location.query,
  dimensional_location.query,
  angular_size.query,
  dimensional_size.query,
  angularity_tolerance.query,
  geometric_tolerance_with_datum_reference.query,
  annotation_curve_occurrence.query,
  annotation_occurrence.query,
  annotation_fill_area.query,
  geometric_representation_item.query,
  annotation_fill_area_occurrence.query,
  annotation_text_occurrence.query,
  annotation_symbol_occurrence.query,
  styled_item.query,
  annotation_occurrence_associativity.query,
  annotation_occurrence_relationship.query,
  annotation_plane.query,
  annotation_subfigure_occurrence.query,
  annotation_symbol.query,
  mapped_item.query,
  annotation_text.query,
  annotation_text_character.query,
  apex.query,
  derived_shape_aspect.query,
  application_context.query,
  application_context_element.query,
  product_concept_context.query,
  product_context.query,
  product_definition_context.query,
  application_context_relationship.query,
  application_protocol_definition.query,
  applied_action_assignment.query,
  applied_action_request_assignment.query,
  applied_approval_assignment.query,
  approval_assignment.query,
  applied_area.query,
  shape_aspect.query,
  applied_certification_assignment.query,
  certification_assignment.query,
  applied_classification_assignment.query,
  classification_assignment.query,
  applied_contract_assignment.query,
  contract_assignment.query,
  applied_date_and_time_assignment.query,
  date_and_time_assignment.query,
  applied_date_assignment.query,
  date_assignment.query,
  applied_document_reference.query,
  document_reference.query,
  applied_document_usage_constraint_assignment.query,
  document_usage_constraint_assignment.query,
  applied_effectivity_assignment.query,
  effectivity_assignment.query,
  applied_event_occurrence_assignment.query,
  event_occurrence_assignment.query,
  applied_external_identification_assignment.query,
  external_identification_assignment.query,
  applied_group_assignment.query,
  group_assignment.query,
  applied_identification_assignment.query,
  identification_assignment.query,
  applied_ineffectivity_assignment.query,
  applied_name_assignment.query,
  name_assignment.query,
  applied_organization_assignment.query,
  organization_assignment.query,
  applied_organizational_project_assignment.query,
  organizational_project_assignment.query,
  applied_person_and_organization_assignment.query,
  person_and_organization_assignment.query,
  applied_presented_item.query,
  presented_item.query,
  applied_security_classification_assignment.query,
  security_classification_assignment.query,
  applied_time_interval_assignment.query,
  time_interval_assignment.query,
  approval.query,
  approval_date_time.query,
  approval_person_organization.query,
  approval_relationship.query,
  approval_role.query,
  approval_status.query,
  approximation_tolerance.query,
  founded_item.query,
  approximation_tolerance_deviation.query,
  approximation_tolerance_parameter.query,
  area_in_set.query,
  area_measure_with_unit.query,
  area_unit.query,
  derived_unit.query,
  asin_function.query,
  assembly_component_usage.query,
  next_assembly_usage_occurrence.query,
  specified_higher_usage_occurrence.query,
  promissory_usage_occurrence.query,
  product_definition_usage.query,
  assembly_component_usage_substitute.query,
  atan_function.query,
  binary_function_call.query,
  attribute_classification_assignment.query,
  attribute_language_assignment.query,
  attribute_value_assignment.query,
  attribute_value_role.query,
  axis1_placement.query,
  placement.query,
  axis2_placement_2d.query,
  axis2_placement_3d.query,
  b_spline_curve.query,
  uniform_curve.query,
  b_spline_curve_with_knots.query,
  quasi_uniform_curve.query,
  bezier_curve.query,
  bounded_curve.query,
  b_spline_surface.query,
  b_spline_surface_with_knots.query,
  uniform_surface.query,
  quasi_uniform_surface.query,
  bezier_surface.query,
  bounded_surface.query,
  background_colour.query,
  colour.query,
  barring_hole.query,
  feature_definition.query,
  bead.query,
  bead_end.query,
  binary_boolean_expression.query,
  xor_expression.query,
  equals_expression.query,
  boolean_expression.query,
  binary_generic_expression.query,
  binary_numeric_expression.query,
  generic_expression.query,
  minus_expression.query,
  div_expression.query,
  mod_expression.query,
  slash_expression.query,
  power_expression.query,
  numeric_expression.query,
  block.query,
  boolean_defined_function.query,
  defined_function.query,
  simple_boolean_expression.query,
  unary_boolean_expression.query,
  comparison_expression.query,
  interval_expression.query,
  expression.query,
  boolean_literal.query,
  generic_literal.query,
  boolean_result.query,
  boolean_variable.query,
  variable.query,
  boss.query,
  boss_top.query,
  boundary_curve.query,
  composite_curve_on_surface.query,
  polyline.query,
  trimmed_curve.query,
  bounded_pcurve.query,
  bounded_surface_curve.query,
  composite_curve.query,
  curve.query,
  pcurve.query,
  rectangular_trimmed_surface.query,
  curve_bounded_surface.query,
  rectangular_composite_surface.query,
  surface.query,
  surface_curve.query,
  box_domain.query,
  boxed_half_space.query,
  half_space_solid.query,
  brep_with_voids.query,
  manifold_solid_brep.query,
  calendar_date.query,
  date.query,
  camera_image.query,
  camera_image_2d_with_scale.query,
  camera_image_3d_with_scale.query,
  camera_model.query,
  camera_model_d2.query,
  camera_model_d3.query,
  camera_model_d3_with_hlhsr.query,
  camera_usage.query,
  representation_map.query,
  cartesian_point.query,
  point.query,
  cartesian_transformation_operator.query,
  cartesian_transformation_operator_2d.query,
  cartesian_transformation_operator_3d.query,
  functionally_defined_transformation.query,
  celsius_temperature_measure_with_unit.query,
  centre_of_symmetry.query,
  certification.query,
  certification_type.query,
  chamfer.query,
  transition_feature.query,
  chamfer_offset.query,
  character_glyph_symbol.query,
  generic_character_glyph_symbol.query,
  characterized_class.query,
  characterized_object.query,
  class_.query,
  circle.query,
  conic.query,
  circular_closed_profile.query,
  circular_pattern.query,
  replicate_feature.query,
  circular_runout_tolerance.query,
  group.query,
  class_system.query,
  class_usage_effectivity_context_assignment.query,
  effectivity_context_assignment.query,
  classification_role.query,
  closed_path_profile.query,
  closed_shell.query,
  connected_face_set.query,
  coaxiality_tolerance.query,
  colour_rgb.query,
  colour_specification.query,
  common_datum.query,
  composite_shape_aspect.query,
  datum.query,
  comparison_equal.query,
  comparison_greater.query,
  comparison_greater_equal.query,
  comparison_less.query,
  comparison_less_equal.query,
  comparison_not_equal.query,
  like_expression.query,
  composite_curve_segment.query,
  composite_hole.query,
  compound_feature.query,
  composite_text.query,
  composite_text_with_associated_curves.query,
  composite_text_with_blanking_box.query,
  composite_text_with_extent.query,
  compound_representation_item.query,
  representation_item.query,
  compound_shape_representation.query,
  concat_expression.query,
  string_expression.query,
  multiple_arity_generic_expression.query,
  concentricity_tolerance.query,
  concept_feature_operator.query,
  concept_feature_relationship.query,
  concept_feature_relationship_with_condition.query,
  conditional_concept_feature.query,
  product_concept_feature.query,
  configurable_item.query,
  configuration_item.query,
  configuration_definition.query,
  configuration_design.query,
  configuration_effectivity.query,
  product_definition_effectivity.query,
  configuration_interpolation.query,
  configured_effectivity_assignment.query,
  configured_effectivity_context_assignment.query,
  ellipse.query,
  hyperbola.query,
  parabola.query,
  conical_surface.query,
  elementary_surface.query,
  connected_edge_set.query,
  topological_representation_item.query,
  open_shell.query,
  connected_face_sub_set.query,
  constructive_geometry_representation.query,
  representation.query,
  constructive_geometry_representation_relationship.query,
  representation_relationship.query,
  contact_ratio_representation.query,
  context_dependent_invisibility.query,
  invisibility.query,
  context_dependent_over_riding_styled_item.query,
  over_riding_styled_item.query,
  context_dependent_shape_representation.query,
  context_dependent_unit.query,
  contract.query,
  contract_type.query,
  conversion_based_unit.query,
  coordinated_universal_time_offset.query,
  cos_function.query,
  csg_shape_representation.query,
  csg_solid.query,
  solid_model.query,
  line.query,
  offset_curve_2d.query,
  offset_curve_3d.query,
  curve_replica.query,
  curve_dimension.query,
  curve_style.query,
  curve_style_font.query,
  curve_style_font_pattern.query,
  curve_style_rendering.query,
  curve_swept_solid_shape_representation.query,
  cylindrical_pair.query,
  kinematic_pair.query,
  cylindrical_pair_range.query,
  simple_pair_range.query,
  cylindrical_pair_value.query,
  pair_value.query,
  cylindrical_surface.query,
  cylindricity_tolerance.query,
  geometric_tolerance.query,
  data_environment.query,
  date_and_time.query,
  date_role.query,
  date_time_role.query,
  dated_effectivity.query,
  effectivity.query,
  datum_feature.query,
  datum_feature_callout.query,
  draughting_callout.query,
  datum_reference.query,
  datum_target.query,
  datum_target_callout.query,
  default_tolerance_table.query,
  default_tolerance_table_cell.query,
  defined_character_glyph.query,
  numeric_defined_function.query,
  string_defined_function.query,
  defined_symbol.query,
  definitional_representation.query,
  degenerate_pcurve.query,
  degenerate_toroidal_surface.query,
  toroidal_surface.query,
  geometric_alignment.query,
  geometric_intersection.query,
  parallel_offset.query,
  perpendicular_to.query,
  extension.query,
  tangent.query,
  volume_unit.query,
  derived_unit_element.query,
  derived_unit_variable.query,
  variable_semantics.query,
  description_attribute.query,
  descriptive_representation_item.query,
  diameter_dimension.query,
  dimension_callout.query,
  dimension_callout_component_relationship.query,
  draughting_callout_relationship.query,
  dimension_callout_relationship.query,
  dimension_curve.query,
  dimension_curve_terminator.query,
  terminator_symbol.query,
  dimension_pair.query,
  dimension_related_tolerance_zone_element.query,
  dimension_text_associativity.query,
  text_literal.query,
  dimensional_characteristic_representation.query,
  dimensional_exponents.query,
  dimensional_location_with_path.query,
  shape_aspect_relationship.query,
  dimensional_size_with_path.query,
  directed_action.query,
  executed_action.query,
  directed_angle.query,
  directed_dimensional_location.query,
  direction.query,
  direction_shape_representation.query,
  document.query,
  document_file.query,
  document_product_association.query,
  document_product_equivalence.query,
  document_relationship.query,
  document_representation_type.query,
  document_type.query,
  document_usage_constraint.query,
  document_usage_role.query,
  draughting_annotation_occurrence.query,
  draughting_elements.query,
  draughting_model.query,
  draughting_model_item_association.query,
  item_identified_representation_usage.query,
  draughting_pre_defined_colour.query,
  pre_defined_colour.query,
  draughting_pre_defined_curve_font.query,
  pre_defined_curve_font.query,
  draughting_pre_defined_text_font.query,
  pre_defined_text_font.query,
  draughting_specification_reference.query,
  draughting_subfigure_representation.query,
  symbol_representation.query,
  draughting_symbol_representation.query,
  draughting_text_literal_with_delineation.query,
  text_literal_with_delineation.query,
  draughting_title.query,
  drawing_definition.query,
  drawing_revision.query,
  presentation_set.query,
  drawing_revision_sequence.query,
  drawing_sheet_layout.query,
  drawing_sheet_revision.query,
  presentation_area.query,
  drawing_sheet_revision_usage.query,
  edge.query,
  edge_curve.query,
  oriented_edge.query,
  subedge.query,
  edge_based_wireframe_model.query,
  edge_based_wireframe_shape_representation.query,
  edge_loop.query,
  loop.query,
  path.query,
  edge_round.query,
  serial_numbered_effectivity.query,
  lot_effectivity.query,
  time_interval_based_effectivity.query,
  effectivity_context_role.query,
  effectivity_relationship.query,
  electric_current_measure_with_unit.query,
  electric_current_unit.query,
  element_delivery.query,
  plane.query,
  spherical_surface.query,
  environment.query,
  evaluated_degenerate_pcurve.query,
  event_occurrence.query,
  event_occurrence_context_assignment.query,
  event_occurrence_context_role.query,
  event_occurrence_role.query,
  exclusive_product_concept_feature_category.query,
  product_concept_feature_category.query,
  exp_function.query,
  expression_conversion_based_unit.query,
  external_source.query,
  externally_defined_character_glyph.query,
  externally_defined_item.query,
  externally_defined_class.query,
  externally_defined_curve_font.query,
  externally_defined_dimension_definition.query,
  externally_defined_feature_definition.query,
  externally_defined_general_property.query,
  general_property.query,
  externally_defined_hatch_style.query,
  externally_defined_item_relationship.query,
  externally_defined_style.query,
  externally_defined_symbol.query,
  externally_defined_text_font.query,
  externally_defined_tile_style.query,
  extruded_area_solid.query,
  swept_area_solid.query,
  extruded_face_solid.query,
  swept_face_solid.query,
  face.query,
  subface.query,
  oriented_face.query,
  face_based_surface_model.query,
  face_bound.query,
  face_outer_bound.query,
  face_shape_representation.query,
  faceted_brep.query,
  faceted_brep_shape_representation.query,
  feature_component_definition.query,
  feature_component_relationship.query,
  feature_in_panel.query,
  feature_pattern.query,
  featured_shape.query,
  product_definition_shape.query,
  fill_area_style.query,
  fill_area_style_colour.query,
  fill_area_style_hatching.query,
  fill_area_style_tile_symbol_with_style.query,
  fill_area_style_tiles.query,
  fillet.query,
  flatness_tolerance.query,
  format_function.query,
  founded_kinematic_path.query,
  fully_constrained_pair.query,
  gear_pair.query,
  gear_pair_range.query,
  gear_pair_value.query,
  general_feature.query,
  general_material_property.query,
  general_property_association.query,
  general_property_relationship.query,
  simple_generic_expression.query,
  unary_generic_expression.query,
  generic_variable.query,
  geometric_curve_set.query,
  geometric_set.query,
  geometric_item_specific_usage.query,
  geometric_representation_context.query,
  representation_context.query,
  vector.query,
  poly_loop.query,
  vertex_point.query,
  sphere.query,
  right_circular_cone.query,
  right_circular_cylinder.query,
  torus.query,
  right_angular_wedge.query,
  shell_based_surface_model.query,
  geometric_tolerance_relationship.query,
  geometric_tolerance_with_defined_unit.query,
  geometrical_tolerance_callout.query,
  geometrically_bounded_2d_wireframe_representation.query,
  geometrically_bounded_surface_shape_representation.query,
  geometrically_bounded_wireframe_shape_representation.query,
  global_uncertainty_assigned_context.query,
  global_unit_assigned_context.query,
  group_relationship.query,
  hardness_representation.query,
  hidden_element_over_riding_styled_item.query,
  hole_bottom.query,
  hole_in_panel.query,
  homokinetic_pair.query,
  universal_pair.query,
  id_attribute.query,
  identification_role.query,
  inclusion_product_concept_feature.query,
  index_expression.query,
  initial_state.query,
  instanced_feature.query,
  int_literal.query,
  literal_number.query,
  int_numeric_variable.query,
  numeric_variable.query,
  int_value_function.query,
  value_function.query,
  integer_defined_function.query,
  interpolated_configuration_sequence.query,
  intersection_curve.query,
  item_defined_transformation.query,
  joggle.query,
  joggle_termination.query,
  kinematic_analysis_consistency.query,
  kinematic_analysis_result.query,
  kinematic_control.query,
  kinematic_frame_background_representation.query,
  kinematic_frame_background_representation_association.query,
  representation_relationship_with_transformation.query,
  kinematic_frame_based_transformation.query,
  kinematic_ground_representation.query,
  kinematic_joint.query,
  kinematic_link.query,
  kinematic_link_representation.query,
  kinematic_link_representation_association.query,
  kinematic_link_representation_relation.query,
  kinematic_path.query,
  kinematic_property_definition.query,
  property_definition.query,
  kinematic_property_representation_relation.query,
  property_definition_representation.query,
  kinematic_structure.query,
  known_source.query,
  pre_defined_item.query,
  language.query,
  language_assignment.query,
  leader_curve.query,
  leader_directed_callout.query,
  leader_directed_dimension.query,
  leader_terminator.query,
  length_function.query,
  length_measure_with_unit.query,
  length_unit.query,
  light_source.query,
  light_source_ambient.query,
  light_source_directional.query,
  light_source_positional.query,
  light_source_spot.query,
  limits_and_fits.query,
  line_profile_tolerance.query,
  linear_dimension.query,
  real_literal.query,
  simple_numeric_expression.query,
  local_time.query,
  location_shape_representation.query,
  locator.query,
  log10_function.query,
  log2_function.query,
  log_function.query,
  vertex_loop.query,
  luminous_intensity_measure_with_unit.query,
  luminous_intensity_unit.query,
  make_from_usage_option.query,
  manifold_subsurface_shape_representation.query,
  manifold_surface_shape_representation.query,
  mass_measure_with_unit.query,
  mass_unit.query,
  material_designation.query,
  material_designation_characterization.query,
  material_property.query,
  material_property_representation.query,
  maximum_function.query,
  multiple_arity_function_call.query,
  measure_qualification.query,
  measure_representation_item.query,
  time_measure_with_unit.query,
  thermodynamic_temperature_measure_with_unit.query,
  plane_angle_measure_with_unit.query,
  solid_angle_measure_with_unit.query,
  volume_measure_with_unit.query,
  ratio_measure_with_unit.query,
  mechanical_design_geometric_presentation_area.query,
  mechanical_design_geometric_presentation_representation.query,
  mechanism.query,
  mechanism_base_placement.query,
  minimum_function.query,
  minus_function.query,
  modified_geometric_tolerance.query,
  modified_pattern.query,
  moments_of_inertia_representation.query,
  motion_link_relationship.query,
  mult_expression.query,
  multiple_arity_numeric_expression.query,
  multi_language_attribute_assignment.query,
  or_expression.query,
  plus_expression.query,
  name_attribute.query,
  si_unit.query,
  named_unit_variable.query,
  ngon_closed_profile.query,
  non_manifold_surface_shape_representation.query,
  not_expression.query,
  real_defined_function.query,
  unary_numeric_expression.query,
  real_numeric_variable.query,
  object_role.query,
  odd_function.query,
  offset_surface.query,
  one_direction_repeat_factor.query,
  open_path_profile.query,
  ordinate_dimension.query,
  projection_directed_callout.query,
  organization.query,
  organization_relationship.query,
  organization_role.query,
  organizational_address.query,
  organizational_project.query,
  organizational_project_relationship.query,
  organizational_project_role.query,
  oriented_closed_shell.query,
  oriented_open_shell.query,
  oriented_path.query,
  oriented_surface.query,
  outer_boundary_curve.query,
  package_product_concept_feature.query,
  pair_actuator.query,
  parallelism_tolerance.query,
  parametric_representation_context.query,
  partial_circular_profile.query,
  path_feature_component.query,
  path_shape_representation.query,
  pattern_offset_membership.query,
  pattern_omit_membership.query,
  perpendicularity_tolerance.query,
  person.query,
  person_and_organization.query,
  person_and_organization_address.query,
  personal_address.query,
  person_and_organization_role.query,
  physically_modelled_product_definition.query,
  product_definition_with_associated_documents.query,
  placed_datum_target_feature.query,
  placed_feature.query,
  planar_box.query,
  planar_extent.query,
  planar_curve_pair.query,
  planar_curve_pair_range.query,
  planar_pair.query,
  planar_pair_range.query,
  planar_pair_value.query,
  planar_shape_representation.query,
  plane_angle_unit.query,
  plus_minus_tolerance.query,
  pocket.query,
  pocket_bottom.query,
  point_on_curve.query,
  point_on_surface.query,
  point_replica.query,
  point_on_planar_curve_pair.query,
  point_on_planar_curve_pair_range.query,
  point_on_planar_curve_pair_value.query,
  point_on_surface_pair.query,
  point_on_surface_pair_range.query,
  point_on_surface_pair_value.query,
  point_placement_shape_representation.query,
  point_style.query,
  position_tolerance.query,
  pre_defined_dimension_symbol.query,
  pre_defined_symbol.query,
  pre_defined_geometrical_tolerance_symbol.query,
  pre_defined_marker.query,
  pre_defined_point_marker_symbol.query,
  pre_defined_presentation_style.query,
  pre_defined_surface_condition_symbol.query,
  pre_defined_terminator_symbol.query,
  precision_qualifier.query,
  presentation_representation.query,
  presentation_layer_assignment.query,
  presentation_view.query,
  presentation_size.query,
  presentation_style_assignment.query,
  presentation_style_by_context.query,
  presented_item_representation.query,
  prismatic_pair.query,
  prismatic_pair_range.query,
  prismatic_pair_value.query,
  process_operation.query,
  process_plan.query,
  process_product_association.query,
  process_property_association.query,
  product.query,
  product_category.query,
  product_category_relationship.query,
  product_class.query,
  product_concept.query,
  product_concept_feature_association.query,
  product_concept_feature_category_usage.query,
  product_concept_relationship.query,
  product_definition.query,
  product_definition_context_association.query,
  product_definition_context_role.query,
  product_definition_formation.query,
  product_definition_formation_relationship.query,
  product_definition_formation_with_specified_source.query,
  product_definition_occurrence_relationship.query,
  product_definition_process.query,
  product_definition_relationship.query,
  product_definition_resource.query,
  product_definition_substitute.query,
  product_identification.query,
  product_process_plan.query,
  product_related_product_category.query,
  product_specification.query,
  projected_zone_definition.query,
  tolerance_zone_definition.query,
  projection_curve.query,
  property_definition_relationship.query,
  property_process.query,
  qualified_representation_item.query,
  qualitative_uncertainty.query,
  uncertainty_qualifier.query,
  quantified_assembly_component_usage.query,
  rack_and_pinion_pair.query,
  rack_and_pinion_pair_range.query,
  rack_and_pinion_pair_value.query,
  radius_dimension.query,
  ratio_unit.query,
  rational_b_spline_curve.query,
  rational_b_spline_surface.query,
  rectangular_closed_profile.query,
  rectangular_pattern.query,
  referenced_modified_datum.query,
  relative_event_occurrence.query,
  rep_item_group.query,
  reparametrised_composite_curve_segment.query,
  value_representation_item.query,
  requirement_for_action_resource.query,
  resource_property.query,
  resource_property_representation.query,
  resource_requirement_type.query,
  resulting_path.query,
  retention.query,
  revolute_pair.query,
  revolute_pair_range.query,
  revolute_pair_value.query,
  revolved_area_solid.query,
  revolved_face_solid.query,
  rib.query,
  role_association.query,
  rolling_curve_pair.query,
  rolling_curve_pair_value.query,
  rolling_surface_pair.query,
  surface_pair.query,
  rolling_surface_pair_value.query,
  rotation_about_direction.query,
  round_hole.query,
  rounded_u_profile.query,
  roundness_tolerance.query,
  ruled_surface_swept_area_solid.query,
  surface_curve_swept_area_solid.query,
  runout_zone_definition.query,
  runout_zone_orientation.query,
  runout_zone_orientation_reference_direction.query,
  screw_pair.query,
  screw_pair_range.query,
  screw_pair_value.query,
  seam_curve.query,
  seam_edge.query,
  security_classification.query,
  security_classification_level.query,
  shape_aspect_associativity.query,
  shape_aspect_deriving_relationship.query,
  shape_aspect_transition.query,
  shape_defining_relationship.query,
  shape_definition_representation.query,
  shape_dimension_representation.query,
  shape_representation_relationship.query,
  shape_representation_with_parameters.query,
  simple_string_expression.query,
  string_literal.query,
  string_variable.query,
  sin_function.query,
  sliding_curve_pair.query,
  sliding_curve_pair_value.query,
  sliding_surface_pair.query,
  sliding_surface_pair_value.query,
  slot.query,
  slot_end.query,
  solid_angle_unit.query,
  swept_disk_solid.query,
  solid_replica.query,
  spherical_pair.query,
  spherical_pair_range.query,
  spherical_pair_value.query,
  sql_mappable_defined_function.query,
  square_root_function.query,
  square_u_profile.query,
  standard_uncertainty.query,
  straightness_tolerance.query,
  substring_expression.query,
  structured_dimension_callout.query,
  swept_surface.query,
  surface_replica.query,
  surface_condition_callout.query,
  surface_of_linear_extrusion.query,
  surface_of_revolution.query,
  surface_pair_range.query,
  surface_patch.query,
  surface_profile_tolerance.query,
  surface_rendering_properties.query,
  surface_side_style.query,
  surface_style_boundary.query,
  surface_style_control_grid.query,
  surface_style_fill_area.query,
  surface_style_parameter_line.query,
  surface_style_reflectance_ambient.query,
  surface_style_reflectance_ambient_diffuse.query,
  surface_style_reflectance_ambient_diffuse_specular.query,
  surface_style_rendering.query,
  surface_style_rendering_with_properties.query,
  surface_style_segmentation_curve.query,
  surface_style_silhouette.query,
  surface_style_transparent.query,
  surface_style_usage.query,
  surface_texture_representation.query,
  symbol_colour.query,
  symbol_representation_map.query,
  symbol_style.query,
  symbol_target.query,
  symmetric_shape_aspect.query,
  symmetry_tolerance.query,
  tactile_appearance_representation.query,
  tan_function.query,
  taper.query,
  tee_profile.query,
  text_literal_with_associated_curves.query,
  text_literal_with_blanking_box.query,
  text_literal_with_extent.query,
  text_string_representation.query,
  text_style.query,
  text_style_for_defined_font.query,
  text_style_with_box_characteristics.query,
  text_style_with_mirror.query,
  text_style_with_spacing.query,
  thermodynamic_temperature_unit.query,
  thread.query,
  time_interval.query,
  time_interval_role.query,
  time_interval_with_bounds.query,
  time_unit.query,
  tolerance_value.query,
  tolerance_zone.query,
  tolerance_zone_form.query,
  vertex.query,
  total_runout_tolerance.query,
  two_direction_repeat_factor.query,
  type_qualifier.query,
  uncertainty_assigned_representation.query,
  uncertainty_measure_with_unit.query,
  unconstrained_pair.query,
  unconstrained_pair_value.query,
  universal_pair_range.query,
  universal_pair_value.query,
  value_range.query,
  vector_style.query,
  vee_profile.query,
  versioned_action_request.query,
  versioned_action_request_relationship.query,
  view_volume.query,
  visual_appearance_representation.query,
  amount_of_substance_measure.query,
  area_measure.query,
  box_height.query,
  box_rotate_angle.query,
  box_slant_angle.query,
  box_width.query,
  celsius_temperature_measure.query,
  context_dependent_measure.query,
  count_measure.query,
  curve_tolerance_deviation.query,
  curve_tolerance_parameter.query,
  day_in_month_number.query,
  descriptive_measure.query,
  dimension_count.query,
  electric_current_measure.query,
  hour_in_day.query,
  identifier.query,
  label.query,
  length_measure.query,
  list_of_reversible_topology_item.query,
  list_representation_item.query,
  luminous_intensity_measure.query,
  mass_measure.query,
  minute_in_hour.query,
  month_in_year_number.query,
  non_negative_length_measure.query,
  numeric_measure.query,
  parameter_value.query,
  plane_angle_measure.query,
  positive_length_measure.query,
  positive_plane_angle_measure.query,
  positive_ratio_measure.query,
  presentable_text.query,
  ratio_measure.query,
  second_in_minute.query,
  set_of_reversible_topology_item.query,
  set_representation_item.query,
  solid_angle_measure.query,
  surface_tolerance_deviation.query,
  surface_tolerance_parameter.query,
  text.query,
  text_alignment.query,
  text_delineation.query,
  thermodynamic_temperature_measure.query,
  time_measure.query,
  u_direction_count.query,
  v_direction_count.query,
  volume_measure.query,
  year_number.query,
  ypr_rotation.query,
]
let descriptions : EntityDescription< EntityTypesAP214 >[] = [
  {
    fields: {
    },
    depth: 0,
    typeId: e.EXTERNALMAPPINGCONTAINER,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.ABS_FUNCTION,
    depth: 5,
    isAbstract: false,
    superType: e.UNARY_FUNCTION_CALL,
  },
  {
    fields: {
    },
    typeId: e.UNARY_FUNCTION_CALL,
    depth: 4,
    isAbstract: true,
    superType: e.UNARY_NUMERIC_EXPRESSION,
    subTypes: [
       e.ABS_FUNCTION,
       e.MINUS_FUNCTION,
       e.SIN_FUNCTION,
       e.COS_FUNCTION,
       e.TAN_FUNCTION,
       e.ASIN_FUNCTION,
       e.ACOS_FUNCTION,
       e.EXP_FUNCTION,
       e.LOG_FUNCTION,
       e.LOG2_FUNCTION,
       e.LOG10_FUNCTION,
       e.SQUARE_ROOT_FUNCTION,
    ],
  },
  {
    fields: {
    },
    typeId: e.ACOS_FUNCTION,
    depth: 5,
    isAbstract: false,
    superType: e.UNARY_FUNCTION_CALL,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
      chosen_method: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.ACTION_METHOD,
      },
      id: {
        kind: f.STRING,
        optional: false,
        derived: true,
      },
    },
    typeId: e.ACTION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      assigned_action: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.ACTION,
      },
      role: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: true,
        type: e.OBJECT_ROLE,
      },
    },
    typeId: e.ACTION_ASSIGNMENT,
    depth: 0,
    isAbstract: true,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
      analysis: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 2,
      },
      comment: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 3,
      },
      requests: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 4,
        type: e.VERSIONED_ACTION_REQUEST,
      },
    },
    typeId: e.ACTION_DIRECTIVE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
      consequence: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 2,
      },
      purpose: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 3,
      },
    },
    typeId: e.ACTION_METHOD,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
      relating_method: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.ACTION_METHOD,
      },
      related_method: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.ACTION_METHOD,
      },
    },
    typeId: e.ACTION_METHOD_RELATIONSHIP,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      definition: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_METHOD,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_METHOD_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_RELATIONSHIP,
          },
        ],
      },
    },
    typeId: e.ACTION_PROPERTY,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      property: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.ACTION_PROPERTY,
      },
      representation: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.REPRESENTATION,
      },
    },
    typeId: e.ACTION_PROPERTY_REPRESENTATION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
      relating_action: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.ACTION,
      },
      related_action: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.ACTION,
      },
    },
    typeId: e.ACTION_RELATIONSHIP,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      assigned_action_request: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.VERSIONED_ACTION_REQUEST,
      },
      role: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: true,
        type: e.OBJECT_ROLE,
      },
    },
    typeId: e.ACTION_REQUEST_ASSIGNMENT,
    depth: 0,
    isAbstract: true,
  },
  {
    fields: {
      method: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.ACTION_METHOD,
      },
      request: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.VERSIONED_ACTION_REQUEST,
      },
      description: {
        kind: f.STRING,
        optional: false,
        derived: true,
      },
      name: {
        kind: f.STRING,
        optional: false,
        derived: true,
      },
    },
    typeId: e.ACTION_REQUEST_SOLUTION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      status: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      assigned_request: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.VERSIONED_ACTION_REQUEST,
      },
    },
    typeId: e.ACTION_REQUEST_STATUS,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
      usage: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_DIRECTIVE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_METHOD,
          },
        ],
      },
      kind: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.ACTION_RESOURCE_TYPE,
      },
    },
    typeId: e.ACTION_RESOURCE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      kind: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.RESOURCE_REQUIREMENT_TYPE,
      },
      OPERATIONS: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 3,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_METHOD,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_METHOD_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_RELATIONSHIP,
          },
        ],
      },
    },
    typeId: e.ACTION_RESOURCE_REQUIREMENT,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.ACTION_RESOURCE_TYPE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      status: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      assigned_action: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.EXECUTED_ACTION,
      },
    },
    typeId: e.ACTION_STATUS,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      internal_location: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 0,
      },
      street_number: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
      street: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 2,
      },
      postal_box: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 3,
      },
      town: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 4,
      },
      region: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 5,
      },
      postal_code: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 6,
      },
      country: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 7,
      },
      facsimile_number: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 8,
      },
      telephone_number: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 9,
      },
      electronic_mail_address: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 10,
      },
      telex_number: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 11,
      },
      name: {
        kind: f.STRING,
        optional: false,
        derived: true,
      },
      url: {
        kind: f.STRING,
        optional: false,
        derived: true,
      },
    },
    typeId: e.ADDRESS,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.ADVANCED_BREP_SHAPE_REPRESENTATION,
    depth: 2,
    isAbstract: false,
    superType: e.SHAPE_REPRESENTATION,
  },
  {
    fields: {
    },
    typeId: e.SHAPE_REPRESENTATION,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION,
  },
  {
    fields: {
    },
    typeId: e.ADVANCED_FACE,
    depth: 4,
    isAbstract: false,
    superType: e.FACE_SURFACE,
  },
  {
    fields: {
      face_geometry: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.SURFACE,
      },
      same_sense: {
        kind: f.BOOLEAN,
        optional: false,
        derived: false,
        offset: 3,
      },
    },
    typeId: e.FACE_SURFACE,
    depth: 3,
    isAbstract: false,
    superType: e.FACE,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      definition: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
      alternate: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.PRODUCT,
      },
      base: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.PRODUCT,
      },
      basis: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 4,
      },
    },
    typeId: e.ALTERNATE_PRODUCT_RELATIONSHIP,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.AMOUNT_OF_SUBSTANCE_MEASURE_WITH_UNIT,
    depth: 1,
    isAbstract: false,
    superType: e.MEASURE_WITH_UNIT,
  },
  {
    fields: {
      value_component: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 0,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.AMOUNT_OF_SUBSTANCE_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.AREA_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CELSIUS_TEMPERATURE_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONTEXT_DEPENDENT_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.COUNT_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DESCRIPTIVE_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ELECTRIC_CURRENT_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.LENGTH_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.LUMINOUS_INTENSITY_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MASS_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.NUMERIC_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.NON_NEGATIVE_LENGTH_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PARAMETER_VALUE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.POSITIVE_LENGTH_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.POSITIVE_PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.POSITIVE_RATIO_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.RATIO_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SOLID_ANGLE_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.THERMODYNAMIC_TEMPERATURE_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.TIME_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.VOLUME_MEASURE,
          },
        ],
      },
      unit_component: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DERIVED_UNIT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.NAMED_UNIT,
          },
        ],
      },
    },
    typeId: e.MEASURE_WITH_UNIT,
    depth: 0,
    isAbstract: false,
    subTypes: [
       e.LENGTH_MEASURE_WITH_UNIT,
       e.MASS_MEASURE_WITH_UNIT,
       e.TIME_MEASURE_WITH_UNIT,
       e.ELECTRIC_CURRENT_MEASURE_WITH_UNIT,
       e.THERMODYNAMIC_TEMPERATURE_MEASURE_WITH_UNIT,
       e.CELSIUS_TEMPERATURE_MEASURE_WITH_UNIT,
       e.AMOUNT_OF_SUBSTANCE_MEASURE_WITH_UNIT,
       e.LUMINOUS_INTENSITY_MEASURE_WITH_UNIT,
       e.PLANE_ANGLE_MEASURE_WITH_UNIT,
       e.SOLID_ANGLE_MEASURE_WITH_UNIT,
       e.AREA_MEASURE_WITH_UNIT,
       e.VOLUME_MEASURE_WITH_UNIT,
       e.RATIO_MEASURE_WITH_UNIT,
    ],
  },
  {
    fields: {
    },
    typeId: e.AMOUNT_OF_SUBSTANCE_UNIT,
    depth: 1,
    isAbstract: false,
    superType: e.NAMED_UNIT,
  },
  {
    fields: {
      dimensions: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.DIMENSIONAL_EXPONENTS,
      },
    },
    typeId: e.NAMED_UNIT,
    depth: 0,
    isAbstract: false,
    subTypes: [
       e.SI_UNIT,
       e.CONVERSION_BASED_UNIT,
       e.CONTEXT_DEPENDENT_UNIT,
    ],
  },
  {
    fields: {
    },
    typeId: e.AND_EXPRESSION,
    depth: 4,
    isAbstract: false,
    superType: e.MULTIPLE_ARITY_BOOLEAN_EXPRESSION,
  },
  {
    fields: {
      operands: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 0,
        type: e.BOOLEAN_EXPRESSION,
      },
    },
    typeId: e.MULTIPLE_ARITY_BOOLEAN_EXPRESSION,
    depth: 3,
    isAbstract: true,
    superType: e.BOOLEAN_EXPRESSION,
    subTypes: [
       e.AND_EXPRESSION,
       e.OR_EXPRESSION,
    ],
  },
  {
    fields: {
    },
    typeId: e.ANGULAR_DIMENSION,
    depth: 4,
    isAbstract: false,
    superType: e.DIMENSION_CURVE_DIRECTED_CALLOUT,
  },
  {
    fields: {
    },
    typeId: e.DIMENSION_CURVE_DIRECTED_CALLOUT,
    depth: 3,
    isAbstract: false,
    superType: e.DRAUGHTING_CALLOUT,
  },
  {
    fields: {
      angle_selection: {
        kind: f.ENUM,
        optional: false,
        derived: false,
        offset: 4,
        type: angle_relator,
      },
    },
    typeId: e.ANGULAR_LOCATION,
    depth: 2,
    isAbstract: false,
    superType: e.DIMENSIONAL_LOCATION,
  },
  {
    fields: {
    },
    typeId: e.DIMENSIONAL_LOCATION,
    depth: 1,
    isAbstract: false,
    superType: e.SHAPE_ASPECT_RELATIONSHIP,
    subTypes: [
       e.ANGULAR_LOCATION,
       e.DIMENSIONAL_LOCATION_WITH_PATH,
    ],
  },
  {
    fields: {
      angle_selection: {
        kind: f.ENUM,
        optional: false,
        derived: false,
        offset: 2,
        type: angle_relator,
      },
    },
    typeId: e.ANGULAR_SIZE,
    depth: 1,
    isAbstract: false,
    superType: e.DIMENSIONAL_SIZE,
  },
  {
    fields: {
      applies_to: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.SHAPE_ASPECT,
      },
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
    },
    typeId: e.DIMENSIONAL_SIZE,
    depth: 0,
    isAbstract: false,
    subTypes: [
       e.ANGULAR_SIZE,
       e.DIMENSIONAL_SIZE_WITH_PATH,
    ],
  },
  {
    fields: {
    },
    typeId: e.ANGULARITY_TOLERANCE,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_TOLERANCE_WITH_DATUM_REFERENCE,
  },
  {
    fields: {
      datum_system: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 4,
        type: e.DATUM_REFERENCE,
      },
    },
    typeId: e.GEOMETRIC_TOLERANCE_WITH_DATUM_REFERENCE,
    depth: 1,
    isAbstract: false,
    superType: e.GEOMETRIC_TOLERANCE,
  },
  {
    fields: {
      item: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.CURVE,
      },
    },
    typeId: e.ANNOTATION_CURVE_OCCURRENCE,
    depth: 3,
    isAbstract: false,
    superType: e.ANNOTATION_OCCURRENCE,
  },
  {
    fields: {
    },
    typeId: e.ANNOTATION_OCCURRENCE,
    depth: 2,
    isAbstract: false,
    superType: e.STYLED_ITEM,
    subTypes: [
       e.ANNOTATION_CURVE_OCCURRENCE,
       e.ANNOTATION_FILL_AREA_OCCURRENCE,
       e.ANNOTATION_TEXT_OCCURRENCE,
       e.ANNOTATION_SYMBOL_OCCURRENCE,
    ],
  },
  {
    fields: {
      boundaries: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        type: e.CURVE,
      },
    },
    typeId: e.ANNOTATION_FILL_AREA,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_REPRESENTATION_ITEM,
  },
  {
    fields: {
      dim: {
        kind: f.NUMBER,
        optional: false,
        derived: true,
      },
    },
    typeId: e.GEOMETRIC_REPRESENTATION_ITEM,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION_ITEM,
    subTypes: [
       e.POINT,
       e.DIRECTION,
       e.VECTOR,
       e.PLACEMENT,
       e.CARTESIAN_TRANSFORMATION_OPERATOR,
       e.CURVE,
       e.SURFACE,
       e.EDGE_CURVE,
       e.FACE_SURFACE,
       e.POLY_LOOP,
       e.VERTEX_POINT,
       e.SOLID_MODEL,
       e.BOOLEAN_RESULT,
       e.SPHERE,
       e.RIGHT_CIRCULAR_CONE,
       e.RIGHT_CIRCULAR_CYLINDER,
       e.TORUS,
       e.BLOCK,
       e.RIGHT_ANGULAR_WEDGE,
       e.HALF_SPACE_SOLID,
       e.SHELL_BASED_SURFACE_MODEL,
       e.FACE_BASED_SURFACE_MODEL,
       e.EDGE_BASED_WIREFRAME_MODEL,
       e.GEOMETRIC_SET,
    ],
  },
  {
    fields: {
      fill_style_target: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.POINT,
      },
      item: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 4,
        type: e.ANNOTATION_FILL_AREA,
      },
    },
    typeId: e.ANNOTATION_FILL_AREA_OCCURRENCE,
    depth: 3,
    isAbstract: false,
    superType: e.ANNOTATION_OCCURRENCE,
  },
  {
    fields: {
      item: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 3,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.TEXT_LITERAL,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ANNOTATION_TEXT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ANNOTATION_TEXT_CHARACTER,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DEFINED_CHARACTER_GLYPH,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.COMPOSITE_TEXT,
          },
        ],
      },
    },
    typeId: e.ANNOTATION_TEXT_OCCURRENCE,
    depth: 3,
    isAbstract: false,
    superType: e.ANNOTATION_OCCURRENCE,
  },
  {
    fields: {
      item: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 3,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ANNOTATION_SYMBOL,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DEFINED_SYMBOL,
          },
        ],
      },
    },
    typeId: e.ANNOTATION_SYMBOL_OCCURRENCE,
    depth: 3,
    isAbstract: false,
    superType: e.ANNOTATION_OCCURRENCE,
  },
  {
    fields: {
      styles: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        type: e.PRESENTATION_STYLE_ASSIGNMENT,
      },
      item: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.REPRESENTATION_ITEM,
      },
    },
    typeId: e.STYLED_ITEM,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION_ITEM,
  },
  {
    fields: {
    },
    typeId: e.ANNOTATION_OCCURRENCE_ASSOCIATIVITY,
    depth: 1,
    isAbstract: false,
    superType: e.ANNOTATION_OCCURRENCE_RELATIONSHIP,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      relating_annotation_occurrence: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.ANNOTATION_OCCURRENCE,
      },
      related_annotation_occurrence: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.ANNOTATION_OCCURRENCE,
      },
    },
    typeId: e.ANNOTATION_OCCURRENCE_RELATIONSHIP,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      elements: {
        kind: f.SELECT,
        rank: 1,
        optional: true,
        derived: false,
        offset: 3,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DRAUGHTING_CALLOUT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.STYLED_ITEM,
          },
        ],
      },
      item: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 4,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANAR_BOX,
          },
        ],
      },
    },
    typeId: e.ANNOTATION_PLANE,
    depth: 3,
    isAbstract: false,
    superType: e.ANNOTATION_OCCURRENCE,
  },
  {
    fields: {
    },
    typeId: e.ANNOTATION_SUBFIGURE_OCCURRENCE,
    depth: 4,
    isAbstract: false,
    superType: e.ANNOTATION_SYMBOL_OCCURRENCE,
  },
  {
    fields: {
      mapping_source: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.SYMBOL_REPRESENTATION_MAP,
      },
      mapping_target: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 4,
        type: e.SYMBOL_TARGET,
      },
    },
    typeId: e.ANNOTATION_SYMBOL,
    depth: 2,
    isAbstract: false,
    superType: e.MAPPED_ITEM,
  },
  {
    fields: {
      mapping_source: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.REPRESENTATION_MAP,
      },
      mapping_target: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.REPRESENTATION_ITEM,
      },
    },
    typeId: e.MAPPED_ITEM,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION_ITEM,
  },
  {
    fields: {
      mapping_target: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 3,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.AXIS2_PLACEMENT_2D,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.AXIS2_PLACEMENT_3D,
          },
        ],
      },
    },
    typeId: e.ANNOTATION_TEXT,
    depth: 2,
    isAbstract: false,
    superType: e.MAPPED_ITEM,
  },
  {
    fields: {
      alignment: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 3,
      },
      mapping_target: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 4,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.AXIS2_PLACEMENT_2D,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.AXIS2_PLACEMENT_3D,
          },
        ],
      },
    },
    typeId: e.ANNOTATION_TEXT_CHARACTER,
    depth: 2,
    isAbstract: false,
    superType: e.MAPPED_ITEM,
  },
  {
    fields: {
    },
    typeId: e.APEX,
    depth: 2,
    isAbstract: false,
    superType: e.DERIVED_SHAPE_ASPECT,
  },
  {
    fields: {
      deriving_relationships: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 4,
        type: e.SHAPE_ASPECT_RELATIONSHIP,
      },
    },
    typeId: e.DERIVED_SHAPE_ASPECT,
    depth: 1,
    isAbstract: false,
    superType: e.SHAPE_ASPECT,
    subTypes: [
       e.APEX,
       e.CENTRE_OF_SYMMETRY,
       e.GEOMETRIC_ALIGNMENT,
       e.GEOMETRIC_INTERSECTION,
       e.PARALLEL_OFFSET,
       e.PERPENDICULAR_TO,
       e.EXTENSION,
       e.TANGENT,
    ],
  },
  {
    fields: {
      application: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: false,
        derived: true,
      },
      id: {
        kind: f.STRING,
        optional: false,
        derived: true,
      },
      context_elements: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 3,
        type: e.APPLICATION_CONTEXT_ELEMENT,
      },
    },
    typeId: e.APPLICATION_CONTEXT,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      frame_of_reference: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.APPLICATION_CONTEXT,
      },
    },
    typeId: e.APPLICATION_CONTEXT_ELEMENT,
    depth: 0,
    isAbstract: false,
    subTypes: [
       e.PRODUCT_CONCEPT_CONTEXT,
       e.PRODUCT_CONTEXT,
       e.PRODUCT_DEFINITION_CONTEXT,
    ],
  },
  {
    fields: {
      market_segment_type: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 2,
      },
    },
    typeId: e.PRODUCT_CONCEPT_CONTEXT,
    depth: 1,
    isAbstract: false,
    superType: e.APPLICATION_CONTEXT_ELEMENT,
  },
  {
    fields: {
      discipline_type: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 2,
      },
    },
    typeId: e.PRODUCT_CONTEXT,
    depth: 1,
    isAbstract: false,
    superType: e.APPLICATION_CONTEXT_ELEMENT,
  },
  {
    fields: {
      life_cycle_stage: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 2,
      },
    },
    typeId: e.PRODUCT_DEFINITION_CONTEXT,
    depth: 1,
    isAbstract: false,
    superType: e.APPLICATION_CONTEXT_ELEMENT,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
      relating_context: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.APPLICATION_CONTEXT,
      },
      related_context: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.APPLICATION_CONTEXT,
      },
    },
    typeId: e.APPLICATION_CONTEXT_RELATIONSHIP,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      status: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      application_interpreted_model_schema_name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      application_protocol_year: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
      application: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.APPLICATION_CONTEXT,
      },
    },
    typeId: e.APPLICATION_PROTOCOL_DEFINITION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      items: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_DIRECTIVE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_METHOD,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_REQUEST_SOLUTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ALTERNATE_PRODUCT_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPLIED_ACTION_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPLIED_CLASSIFICATION_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPLIED_PERSON_AND_ORGANIZATION_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPROVAL_STATUS,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ASSEMBLY_COMPONENT_USAGE_SUBSTITUTE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CERTIFICATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CLASS_,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CLASS_SYSTEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_DESIGN,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_EFFECTIVITY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_ITEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURED_EFFECTIVITY_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONTRACT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DOCUMENT_FILE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DRAUGHTING_MODEL,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DRAWING_REVISION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EXECUTED_ACTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.GENERAL_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MATERIAL_DESIGNATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MECHANICAL_DESIGN_GEOMETRIC_PRESENTATION_REPRESENTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ORGANIZATION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ORGANIZATIONAL_PROJECT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PERSON_AND_ORGANIZATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRESENTATION_AREA,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_ASSOCIATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_CATEGORY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_CATEGORY_USAGE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_SUBSTITUTE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PROPERTY_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.REQUIREMENT_FOR_ACTION_RESOURCE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.RESOURCE_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SECURITY_CLASSIFICATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SECURITY_CLASSIFICATION_LEVEL,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_ASPECT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_REPRESENTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.VERSIONED_ACTION_REQUEST,
          },
        ],
      },
    },
    typeId: e.APPLIED_ACTION_ASSIGNMENT,
    depth: 1,
    isAbstract: false,
    superType: e.ACTION_ASSIGNMENT,
  },
  {
    fields: {
      items: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_METHOD,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ALTERNATE_PRODUCT_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ASSEMBLY_COMPONENT_USAGE_SUBSTITUTE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_DESIGN,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_EFFECTIVITY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_ITEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURED_EFFECTIVITY_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DOCUMENT_FILE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DRAUGHTING_MODEL,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DRAWING_REVISION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.GENERAL_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MATERIAL_DESIGNATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MECHANICAL_DESIGN_GEOMETRIC_PRESENTATION_REPRESENTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ORGANIZATIONAL_PROJECT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRESENTATION_AREA,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_ASSOCIATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_CATEGORY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_CATEGORY_USAGE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_SUBSTITUTE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PROPERTY_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.RESOURCE_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_ASPECT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_REPRESENTATION,
          },
        ],
      },
    },
    typeId: e.APPLIED_ACTION_REQUEST_ASSIGNMENT,
    depth: 1,
    isAbstract: false,
    superType: e.ACTION_REQUEST_ASSIGNMENT,
  },
  {
    fields: {
      items: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_DIRECTIVE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_REQUEST_SOLUTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ALTERNATE_PRODUCT_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPLIED_ACTION_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPLIED_CLASSIFICATION_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ASSEMBLY_COMPONENT_USAGE_SUBSTITUTE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CERTIFICATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CLASS_,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CLASS_SYSTEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_DESIGN,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_EFFECTIVITY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURED_EFFECTIVITY_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONTRACT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DOCUMENT_FILE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DRAUGHTING_MODEL,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DRAWING_REVISION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EXECUTED_ACTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.GENERAL_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MATERIAL_DESIGNATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MECHANICAL_DESIGN_GEOMETRIC_PRESENTATION_REPRESENTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ORGANIZATIONAL_PROJECT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRESENTATION_AREA,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_ASSOCIATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_CATEGORY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_CATEGORY_USAGE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_SUBSTITUTE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PROPERTY_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.RESOURCE_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_REPRESENTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.VERSIONED_ACTION_REQUEST,
          },
        ],
      },
    },
    typeId: e.APPLIED_APPROVAL_ASSIGNMENT,
    depth: 1,
    isAbstract: false,
    superType: e.APPROVAL_ASSIGNMENT,
  },
  {
    fields: {
      assigned_approval: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.APPROVAL,
      },
      role: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: true,
        type: e.OBJECT_ROLE,
      },
    },
    typeId: e.APPROVAL_ASSIGNMENT,
    depth: 0,
    isAbstract: true,
  },
  {
    fields: {
    },
    typeId: e.APPLIED_AREA,
    depth: 1,
    isAbstract: false,
    superType: e.SHAPE_ASPECT,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
      of_shape: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.PRODUCT_DEFINITION_SHAPE,
      },
      product_definitional: {
        kind: f.BOOLEAN,
        optional: false,
        derived: false,
        offset: 3,
      },
      id: {
        kind: f.STRING,
        optional: false,
        derived: true,
      },
    },
    typeId: e.SHAPE_ASPECT,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      items: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_RELATIONSHIP,
          },
        ],
      },
    },
    typeId: e.APPLIED_CERTIFICATION_ASSIGNMENT,
    depth: 1,
    isAbstract: false,
    superType: e.CERTIFICATION_ASSIGNMENT,
  },
  {
    fields: {
      assigned_certification: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.CERTIFICATION,
      },
      role: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: true,
        type: e.OBJECT_ROLE,
      },
    },
    typeId: e.CERTIFICATION_ASSIGNMENT,
    depth: 0,
    isAbstract: true,
  },
  {
    fields: {
      items: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_DIRECTIVE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_METHOD,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPROVAL_STATUS,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CLASS_,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_ITEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONTRACT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DESCRIPTIVE_REPRESENTATION_ITEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DOCUMENT_FILE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DOCUMENT_TYPE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EFFECTIVITY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EXECUTED_ACTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.FEATURE_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.GENERAL_FEATURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.GENERAL_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MATERIAL_DESIGNATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ORGANIZATIONAL_PROJECT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLUS_MINUS_TOLERANCE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PROCESS_OPERATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_CATEGORY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PROPERTY_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.RESOURCE_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SECURITY_CLASSIFICATION_LEVEL,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_ASPECT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.VERSIONED_ACTION_REQUEST,
          },
        ],
      },
    },
    typeId: e.APPLIED_CLASSIFICATION_ASSIGNMENT,
    depth: 1,
    isAbstract: false,
    superType: e.CLASSIFICATION_ASSIGNMENT,
  },
  {
    fields: {
      assigned_class: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.GROUP,
      },
      role: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.CLASSIFICATION_ROLE,
      },
    },
    typeId: e.CLASSIFICATION_ASSIGNMENT,
    depth: 0,
    isAbstract: true,
  },
  {
    fields: {
      items: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DRAWING_REVISION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EXECUTED_ACTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION,
          },
        ],
      },
    },
    typeId: e.APPLIED_CONTRACT_ASSIGNMENT,
    depth: 1,
    isAbstract: false,
    superType: e.CONTRACT_ASSIGNMENT,
  },
  {
    fields: {
      assigned_contract: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.CONTRACT,
      },
      role: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: true,
        type: e.OBJECT_ROLE,
      },
    },
    typeId: e.CONTRACT_ASSIGNMENT,
    depth: 0,
    isAbstract: true,
  },
  {
    fields: {
      items: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_DIRECTIVE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_METHOD,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_REQUEST_SOLUTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ALTERNATE_PRODUCT_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPLIED_ACTION_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPLIED_CLASSIFICATION_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPLIED_ORGANIZATION_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPLIED_PERSON_AND_ORGANIZATION_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPROVAL_PERSON_ORGANIZATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPROVAL_STATUS,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ASSEMBLY_COMPONENT_USAGE_SUBSTITUTE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CERTIFICATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CLASS_,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CLASS_SYSTEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_DESIGN,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_ITEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURED_EFFECTIVITY_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONTRACT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DOCUMENT_FILE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DRAUGHTING_MODEL,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DRAWING_REVISION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EFFECTIVITY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EVENT_OCCURRENCE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EXECUTED_ACTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.GENERAL_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MATERIAL_DESIGNATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MECHANICAL_DESIGN_GEOMETRIC_PRESENTATION_REPRESENTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ORGANIZATION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ORGANIZATIONAL_PROJECT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PERSON_AND_ORGANIZATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRESENTATION_AREA,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_ASSOCIATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_CATEGORY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_CATEGORY_USAGE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_SUBSTITUTE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PROPERTY_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.REQUIREMENT_FOR_ACTION_RESOURCE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.RESOURCE_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SECURITY_CLASSIFICATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SECURITY_CLASSIFICATION_LEVEL,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_REPRESENTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.VERSIONED_ACTION_REQUEST,
          },
        ],
      },
    },
    typeId: e.APPLIED_DATE_AND_TIME_ASSIGNMENT,
    depth: 1,
    isAbstract: false,
    superType: e.DATE_AND_TIME_ASSIGNMENT,
  },
  {
    fields: {
      assigned_date_and_time: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.DATE_AND_TIME,
      },
      role: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.DATE_TIME_ROLE,
      },
    },
    typeId: e.DATE_AND_TIME_ASSIGNMENT,
    depth: 0,
    isAbstract: true,
  },
  {
    fields: {
      items: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_DIRECTIVE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_METHOD,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_REQUEST_SOLUTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ALTERNATE_PRODUCT_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPLIED_ACTION_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPLIED_CLASSIFICATION_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPLIED_ORGANIZATION_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPLIED_PERSON_AND_ORGANIZATION_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPROVAL_PERSON_ORGANIZATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPROVAL_STATUS,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ASSEMBLY_COMPONENT_USAGE_SUBSTITUTE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CERTIFICATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CLASS_,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CLASS_SYSTEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_DESIGN,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_ITEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURED_EFFECTIVITY_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONTRACT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DOCUMENT_FILE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DRAUGHTING_MODEL,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DRAWING_REVISION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EFFECTIVITY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EVENT_OCCURRENCE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EXECUTED_ACTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.GENERAL_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MATERIAL_DESIGNATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MECHANICAL_DESIGN_GEOMETRIC_PRESENTATION_REPRESENTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ORGANIZATION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ORGANIZATIONAL_PROJECT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PERSON_AND_ORGANIZATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRESENTATION_AREA,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_ASSOCIATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_CATEGORY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_CATEGORY_USAGE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_SUBSTITUTE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PROPERTY_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.REQUIREMENT_FOR_ACTION_RESOURCE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.RESOURCE_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SECURITY_CLASSIFICATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SECURITY_CLASSIFICATION_LEVEL,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_REPRESENTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.VERSIONED_ACTION_REQUEST,
          },
        ],
      },
    },
    typeId: e.APPLIED_DATE_ASSIGNMENT,
    depth: 1,
    isAbstract: false,
    superType: e.DATE_ASSIGNMENT,
  },
  {
    fields: {
      assigned_date: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.DATE,
      },
      role: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.DATE_ROLE,
      },
    },
    typeId: e.DATE_ASSIGNMENT,
    depth: 0,
    isAbstract: true,
  },
  {
    fields: {
      items: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_DIRECTIVE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_METHOD,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPLIED_ACTION_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPROVAL,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CERTIFICATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CLASS_,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CLASS_SYSTEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_DESIGN,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_ITEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONTRACT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DESCRIPTIVE_REPRESENTATION_ITEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EXECUTED_ACTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EXTERNALLY_DEFINED_DIMENSION_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.FEATURE_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.GENERAL_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MATERIAL_DESIGNATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ORGANIZATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ORGANIZATIONAL_PROJECT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PERSON,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRESENTATION_AREA,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PROCESS_PLAN,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_CATEGORY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_PROCESS,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_SUBSTITUTE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_RELATED_PRODUCT_CATEGORY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PROPERTY_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.REPRESENTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.RESOURCE_REQUIREMENT_TYPE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.RETENTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SECURITY_CLASSIFICATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_ASPECT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_ASPECT_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.VERSIONED_ACTION_REQUEST,
          },
        ],
      },
    },
    typeId: e.APPLIED_DOCUMENT_REFERENCE,
    depth: 1,
    isAbstract: false,
    superType: e.DOCUMENT_REFERENCE,
  },
  {
    fields: {
      assigned_document: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.DOCUMENT,
      },
      source: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      role: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: true,
        type: e.OBJECT_ROLE,
      },
    },
    typeId: e.DOCUMENT_REFERENCE,
    depth: 0,
    isAbstract: true,
  },
  {
    fields: {
      items: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_DIRECTIVE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_METHOD,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPLIED_ACTION_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPROVAL,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CERTIFICATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CLASS_,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CLASS_SYSTEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_DESIGN,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_ITEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONTRACT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DESCRIPTIVE_REPRESENTATION_ITEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EXECUTED_ACTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EXTERNALLY_DEFINED_DIMENSION_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.FEATURE_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.GENERAL_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MATERIAL_DESIGNATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ORGANIZATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ORGANIZATIONAL_PROJECT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PERSON,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRESENTATION_AREA,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PROCESS_PLAN,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_CATEGORY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_PROCESS,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_SUBSTITUTE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_RELATED_PRODUCT_CATEGORY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PROPERTY_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.REPRESENTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.RESOURCE_REQUIREMENT_TYPE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.RETENTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SECURITY_CLASSIFICATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_ASPECT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_ASPECT_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.VERSIONED_ACTION_REQUEST,
          },
        ],
      },
    },
    typeId: e.APPLIED_DOCUMENT_USAGE_CONSTRAINT_ASSIGNMENT,
    depth: 1,
    isAbstract: false,
    superType: e.DOCUMENT_USAGE_CONSTRAINT_ASSIGNMENT,
  },
  {
    fields: {
      assigned_document_usage: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.DOCUMENT_USAGE_CONSTRAINT,
      },
      role: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.DOCUMENT_USAGE_ROLE,
      },
    },
    typeId: e.DOCUMENT_USAGE_CONSTRAINT_ASSIGNMENT,
    depth: 0,
    isAbstract: true,
  },
  {
    fields: {
      items: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_METHOD,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_METHOD_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ASSEMBLY_COMPONENT_USAGE_SUBSTITUTE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CLASS_,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CLASS_SYSTEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_DESIGN,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_ITEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURED_EFFECTIVITY_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DOCUMENT_FILE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DRAUGHTING_MODEL,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DRAWING_REVISION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.GENERAL_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MATERIAL_DESIGNATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MECHANICAL_DESIGN_GEOMETRIC_PRESENTATION_REPRESENTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRESENTATION_AREA,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_ASSOCIATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_CATEGORY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_CATEGORY_USAGE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_SUBSTITUTE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PROPERTY_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.REQUIREMENT_FOR_ACTION_RESOURCE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.RESOURCE_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SECURITY_CLASSIFICATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_ASPECT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_REPRESENTATION,
          },
        ],
      },
    },
    typeId: e.APPLIED_EFFECTIVITY_ASSIGNMENT,
    depth: 1,
    isAbstract: false,
    superType: e.EFFECTIVITY_ASSIGNMENT,
  },
  {
    fields: {
      assigned_effectivity: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.EFFECTIVITY,
      },
      role: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: true,
        type: e.OBJECT_ROLE,
      },
    },
    typeId: e.EFFECTIVITY_ASSIGNMENT,
    depth: 0,
    isAbstract: true,
  },
  {
    fields: {
      items: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_DIRECTIVE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_METHOD,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_REQUEST_SOLUTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ALTERNATE_PRODUCT_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPLIED_ACTION_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPLIED_CLASSIFICATION_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPLIED_PERSON_AND_ORGANIZATION_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPROVAL_STATUS,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ASSEMBLY_COMPONENT_USAGE_SUBSTITUTE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CERTIFICATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CLASS_,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CLASS_SYSTEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_DESIGN,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_EFFECTIVITY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_ITEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURED_EFFECTIVITY_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONTRACT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DOCUMENT_FILE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DRAUGHTING_MODEL,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DRAWING_REVISION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EXECUTED_ACTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.GENERAL_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MATERIAL_DESIGNATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MECHANICAL_DESIGN_GEOMETRIC_PRESENTATION_REPRESENTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ORGANIZATION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ORGANIZATIONAL_PROJECT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PERSON_AND_ORGANIZATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRESENTATION_AREA,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_ASSOCIATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_CATEGORY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_CATEGORY_USAGE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_SUBSTITUTE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PROPERTY_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.REQUIREMENT_FOR_ACTION_RESOURCE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.RESOURCE_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SECURITY_CLASSIFICATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SECURITY_CLASSIFICATION_LEVEL,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_REPRESENTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.VERSIONED_ACTION_REQUEST,
          },
        ],
      },
    },
    typeId: e.APPLIED_EVENT_OCCURRENCE_ASSIGNMENT,
    depth: 1,
    isAbstract: false,
    superType: e.EVENT_OCCURRENCE_ASSIGNMENT,
  },
  {
    fields: {
      assigned_event_occurrence: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.EVENT_OCCURRENCE,
      },
      role: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.EVENT_OCCURRENCE_ROLE,
      },
    },
    typeId: e.EVENT_OCCURRENCE_ASSIGNMENT,
    depth: 0,
    isAbstract: true,
  },
  {
    fields: {
      items: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 3,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DOCUMENT_FILE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EXTERNALLY_DEFINED_CLASS,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EXTERNALLY_DEFINED_GENERAL_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION,
          },
        ],
      },
    },
    typeId: e.APPLIED_EXTERNAL_IDENTIFICATION_ASSIGNMENT,
    depth: 2,
    isAbstract: false,
    superType: e.EXTERNAL_IDENTIFICATION_ASSIGNMENT,
  },
  {
    fields: {
      source: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.EXTERNAL_SOURCE,
      },
    },
    typeId: e.EXTERNAL_IDENTIFICATION_ASSIGNMENT,
    depth: 1,
    isAbstract: true,
    superType: e.IDENTIFICATION_ASSIGNMENT,
  },
  {
    fields: {
      items: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.GEOMETRIC_REPRESENTATION_ITEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MAPPED_ITEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_ASPECT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.STYLED_ITEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.TOPOLOGICAL_REPRESENTATION_ITEM,
          },
        ],
      },
    },
    typeId: e.APPLIED_GROUP_ASSIGNMENT,
    depth: 1,
    isAbstract: false,
    superType: e.GROUP_ASSIGNMENT,
  },
  {
    fields: {
      assigned_group: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.GROUP,
      },
      role: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: true,
        type: e.OBJECT_ROLE,
      },
    },
    typeId: e.GROUP_ASSIGNMENT,
    depth: 0,
    isAbstract: true,
  },
  {
    fields: {
      items: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_DIRECTIVE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_METHOD,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPLIED_IDENTIFICATION_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPROVAL_STATUS,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CLASS_,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CLASS_SYSTEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_ITEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DIMENSIONAL_SIZE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DOCUMENT_FILE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DOCUMENT_TYPE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DRAUGHTING_MODEL,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EFFECTIVITY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.GENERAL_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MEASURE_REPRESENTATION_ITEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MECHANICAL_DESIGN_GEOMETRIC_PRESENTATION_REPRESENTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ORGANIZATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ORGANIZATIONAL_PROJECT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PERSON_AND_ORGANIZATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRESENTATION_AREA,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_CATEGORY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PROPERTY_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PROPERTY_DEFINITION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SECURITY_CLASSIFICATION_LEVEL,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_ASPECT_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_REPRESENTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.VERSIONED_ACTION_REQUEST,
          },
        ],
      },
    },
    typeId: e.APPLIED_IDENTIFICATION_ASSIGNMENT,
    depth: 1,
    isAbstract: false,
    superType: e.IDENTIFICATION_ASSIGNMENT,
  },
  {
    fields: {
      assigned_id: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      role: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.IDENTIFICATION_ROLE,
      },
    },
    typeId: e.IDENTIFICATION_ASSIGNMENT,
    depth: 0,
    isAbstract: true,
  },
  {
    fields: {
      items: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_METHOD,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_METHOD_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ASSEMBLY_COMPONENT_USAGE_SUBSTITUTE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CLASS_,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CLASS_SYSTEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_DESIGN,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_ITEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURED_EFFECTIVITY_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DOCUMENT_FILE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DRAUGHTING_MODEL,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DRAWING_REVISION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.GENERAL_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MATERIAL_DESIGNATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MECHANICAL_DESIGN_GEOMETRIC_PRESENTATION_REPRESENTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRESENTATION_AREA,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_ASSOCIATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_CATEGORY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_CATEGORY_USAGE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_SUBSTITUTE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PROPERTY_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.REQUIREMENT_FOR_ACTION_RESOURCE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.RESOURCE_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SECURITY_CLASSIFICATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_ASPECT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_REPRESENTATION,
          },
        ],
      },
    },
    typeId: e.APPLIED_INEFFECTIVITY_ASSIGNMENT,
    depth: 1,
    isAbstract: false,
    superType: e.EFFECTIVITY_ASSIGNMENT,
  },
  {
    fields: {
      items: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.KINEMATIC_JOINT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.KINEMATIC_LINK,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.KINEMATIC_STRUCTURE,
          },
        ],
      },
    },
    typeId: e.APPLIED_NAME_ASSIGNMENT,
    depth: 1,
    isAbstract: false,
    superType: e.NAME_ASSIGNMENT,
  },
  {
    fields: {
      assigned_name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      role: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: true,
        type: e.OBJECT_ROLE,
      },
    },
    typeId: e.NAME_ASSIGNMENT,
    depth: 0,
    isAbstract: true,
  },
  {
    fields: {
      items: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_DIRECTIVE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_METHOD,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_REQUEST_SOLUTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ALTERNATE_PRODUCT_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPLIED_ACTION_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPLIED_CLASSIFICATION_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPLIED_IDENTIFICATION_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPLIED_ORGANIZATION_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPLIED_PERSON_AND_ORGANIZATION_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPROVAL,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPROVAL_STATUS,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ASSEMBLY_COMPONENT_USAGE_SUBSTITUTE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CERTIFICATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CLASS_,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CLASS_SYSTEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_DESIGN,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_EFFECTIVITY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_ITEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURED_EFFECTIVITY_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONTRACT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DOCUMENT_FILE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DOCUMENT_TYPE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DRAUGHTING_MODEL,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DRAWING_REVISION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EFFECTIVITY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EVENT_OCCURRENCE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EXECUTED_ACTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.GENERAL_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MATERIAL_DESIGNATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MECHANICAL_DESIGN_GEOMETRIC_PRESENTATION_REPRESENTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ORGANIZATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ORGANIZATION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ORGANIZATIONAL_PROJECT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PERSON_AND_ORGANIZATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRESENTATION_AREA,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_ASSOCIATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_CATEGORY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_CATEGORY_USAGE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_SUBSTITUTE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PROPERTY_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.REQUIREMENT_FOR_ACTION_RESOURCE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.RESOURCE_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SECURITY_CLASSIFICATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SECURITY_CLASSIFICATION_LEVEL,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_REPRESENTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.VERSIONED_ACTION_REQUEST,
          },
        ],
      },
    },
    typeId: e.APPLIED_ORGANIZATION_ASSIGNMENT,
    depth: 1,
    isAbstract: false,
    superType: e.ORGANIZATION_ASSIGNMENT,
  },
  {
    fields: {
      assigned_organization: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.ORGANIZATION,
      },
      role: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.ORGANIZATION_ROLE,
      },
    },
    typeId: e.ORGANIZATION_ASSIGNMENT,
    depth: 0,
    isAbstract: true,
  },
  {
    fields: {
      items: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ASSEMBLY_COMPONENT_USAGE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_ITEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EXECUTED_ACTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION,
          },
        ],
      },
    },
    typeId: e.APPLIED_ORGANIZATIONAL_PROJECT_ASSIGNMENT,
    depth: 1,
    isAbstract: false,
    superType: e.ORGANIZATIONAL_PROJECT_ASSIGNMENT,
  },
  {
    fields: {
      assigned_organizational_project: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.ORGANIZATIONAL_PROJECT,
      },
      role: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.ORGANIZATIONAL_PROJECT_ROLE,
      },
    },
    typeId: e.ORGANIZATIONAL_PROJECT_ASSIGNMENT,
    depth: 0,
    isAbstract: true,
  },
  {
    fields: {
      items: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_DIRECTIVE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_METHOD,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_REQUEST_SOLUTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ALTERNATE_PRODUCT_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPLIED_ACTION_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPLIED_CLASSIFICATION_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPLIED_ORGANIZATION_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPLIED_PERSON_AND_ORGANIZATION_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPROVAL_STATUS,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ASSEMBLY_COMPONENT_USAGE_SUBSTITUTE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CERTIFICATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CLASS_,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CLASS_SYSTEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_DESIGN,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_EFFECTIVITY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_ITEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURED_EFFECTIVITY_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONTRACT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DOCUMENT_FILE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DOCUMENT_TYPE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DRAUGHTING_MODEL,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DRAWING_REVISION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EVENT_OCCURRENCE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EXECUTED_ACTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.GENERAL_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MATERIAL_DESIGNATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MECHANICAL_DESIGN_GEOMETRIC_PRESENTATION_REPRESENTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ORGANIZATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ORGANIZATION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ORGANIZATIONAL_PROJECT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PERSON_AND_ORGANIZATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRESENTATION_AREA,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_ASSOCIATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_CATEGORY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_CATEGORY_USAGE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_SUBSTITUTE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PROPERTY_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.REQUIREMENT_FOR_ACTION_RESOURCE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.RESOURCE_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SECURITY_CLASSIFICATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SECURITY_CLASSIFICATION_LEVEL,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_REPRESENTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.VERSIONED_ACTION_REQUEST,
          },
        ],
      },
    },
    typeId: e.APPLIED_PERSON_AND_ORGANIZATION_ASSIGNMENT,
    depth: 1,
    isAbstract: false,
    superType: e.PERSON_AND_ORGANIZATION_ASSIGNMENT,
  },
  {
    fields: {
      assigned_person_and_organization: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.PERSON_AND_ORGANIZATION,
      },
      role: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.PERSON_AND_ORGANIZATION_ROLE,
      },
    },
    typeId: e.PERSON_AND_ORGANIZATION_ASSIGNMENT,
    depth: 0,
    isAbstract: true,
  },
  {
    fields: {
      items: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 0,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_METHOD,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_CATEGORY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_RELATIONSHIP,
          },
        ],
      },
    },
    typeId: e.APPLIED_PRESENTED_ITEM,
    depth: 1,
    isAbstract: false,
    superType: e.PRESENTED_ITEM,
  },
  {
    fields: {
    },
    typeId: e.PRESENTED_ITEM,
    depth: 0,
    isAbstract: true,
  },
  {
    fields: {
      items: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_DIRECTIVE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPLIED_ACTION_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ASSEMBLY_COMPONENT_USAGE_SUBSTITUTE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CLASS_SYSTEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_DESIGN,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_EFFECTIVITY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURED_EFFECTIVITY_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DOCUMENT_FILE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DRAUGHTING_MODEL,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DRAWING_REVISION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EXECUTED_ACTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.GENERAL_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MATERIAL_DESIGNATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MECHANICAL_DESIGN_GEOMETRIC_PRESENTATION_REPRESENTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ORGANIZATIONAL_PROJECT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRESENTATION_AREA,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_CATEGORY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PROPERTY_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.RESOURCE_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_REPRESENTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.VERSIONED_ACTION_REQUEST,
          },
        ],
      },
    },
    typeId: e.APPLIED_SECURITY_CLASSIFICATION_ASSIGNMENT,
    depth: 1,
    isAbstract: false,
    superType: e.SECURITY_CLASSIFICATION_ASSIGNMENT,
  },
  {
    fields: {
      assigned_security_classification: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.SECURITY_CLASSIFICATION,
      },
      role: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: true,
        type: e.OBJECT_ROLE,
      },
    },
    typeId: e.SECURITY_CLASSIFICATION_ASSIGNMENT,
    depth: 0,
    isAbstract: true,
  },
  {
    fields: {
      items: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_DIRECTIVE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_METHOD,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_REQUEST_SOLUTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ALTERNATE_PRODUCT_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPLIED_ACTION_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPLIED_CLASSIFICATION_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPLIED_PERSON_AND_ORGANIZATION_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPROVAL_STATUS,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ASSEMBLY_COMPONENT_USAGE_SUBSTITUTE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CERTIFICATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CLASS_,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CLASS_SYSTEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_DESIGN,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_EFFECTIVITY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_ITEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURED_EFFECTIVITY_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONTRACT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DOCUMENT_FILE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DRAUGHTING_MODEL,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DRAWING_REVISION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EXECUTED_ACTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.GENERAL_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MATERIAL_DESIGNATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MECHANICAL_DESIGN_GEOMETRIC_PRESENTATION_REPRESENTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ORGANIZATION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ORGANIZATIONAL_PROJECT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PERSON_AND_ORGANIZATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRESENTATION_AREA,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_ASSOCIATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_CATEGORY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_CATEGORY_USAGE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_SUBSTITUTE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PROPERTY_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.REQUIREMENT_FOR_ACTION_RESOURCE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.RESOURCE_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SECURITY_CLASSIFICATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SECURITY_CLASSIFICATION_LEVEL,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_REPRESENTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.VERSIONED_ACTION_REQUEST,
          },
        ],
      },
    },
    typeId: e.APPLIED_TIME_INTERVAL_ASSIGNMENT,
    depth: 1,
    isAbstract: false,
    superType: e.TIME_INTERVAL_ASSIGNMENT,
  },
  {
    fields: {
      assigned_time_interval: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.TIME_INTERVAL,
      },
      role: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.TIME_INTERVAL_ROLE,
      },
    },
    typeId: e.TIME_INTERVAL_ASSIGNMENT,
    depth: 0,
    isAbstract: true,
  },
  {
    fields: {
      status: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.APPROVAL_STATUS,
      },
      level: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
    },
    typeId: e.APPROVAL,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      date_time: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 0,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DATE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DATE_AND_TIME,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.LOCAL_TIME,
          },
        ],
      },
      dated_approval: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.APPROVAL,
      },
      role: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: true,
        type: e.OBJECT_ROLE,
      },
    },
    typeId: e.APPROVAL_DATE_TIME,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      person_organization: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 0,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PERSON,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ORGANIZATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PERSON_AND_ORGANIZATION,
          },
        ],
      },
      authorized_approval: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.APPROVAL,
      },
      role: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.APPROVAL_ROLE,
      },
    },
    typeId: e.APPROVAL_PERSON_ORGANIZATION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
      relating_approval: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.APPROVAL,
      },
      related_approval: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.APPROVAL,
      },
    },
    typeId: e.APPROVAL_RELATIONSHIP,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      role: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: false,
        derived: true,
      },
    },
    typeId: e.APPROVAL_ROLE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.APPROVAL_STATUS,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      tolerance: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 0,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPROXIMATION_TOLERANCE_DEVIATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPROXIMATION_TOLERANCE_PARAMETER,
          },
        ],
      },
    },
    typeId: e.APPROXIMATION_TOLERANCE,
    depth: 1,
    isAbstract: false,
    superType: e.FOUNDED_ITEM,
  },
  {
    fields: {
    },
    typeId: e.FOUNDED_ITEM,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      tessellation_type: {
        kind: f.ENUM,
        optional: false,
        derived: false,
        offset: 0,
        type: approximation_method,
      },
      tolerances: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CURVE_TOLERANCE_DEVIATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SURFACE_TOLERANCE_DEVIATION,
          },
        ],
      },
      definition_space: {
        kind: f.ENUM,
        optional: false,
        derived: false,
        offset: 2,
        type: product_or_presentation_space,
      },
    },
    typeId: e.APPROXIMATION_TOLERANCE_DEVIATION,
    depth: 1,
    isAbstract: false,
    superType: e.FOUNDED_ITEM,
  },
  {
    fields: {
      tolerances: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 0,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CURVE_TOLERANCE_PARAMETER,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SURFACE_TOLERANCE_PARAMETER,
          },
        ],
      },
    },
    typeId: e.APPROXIMATION_TOLERANCE_PARAMETER,
    depth: 1,
    isAbstract: false,
    superType: e.FOUNDED_ITEM,
  },
  {
    fields: {
      area: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.PRESENTATION_AREA,
      },
      in_set: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.PRESENTATION_SET,
      },
    },
    typeId: e.AREA_IN_SET,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.AREA_MEASURE_WITH_UNIT,
    depth: 1,
    isAbstract: false,
    superType: e.MEASURE_WITH_UNIT,
  },
  {
    fields: {
    },
    typeId: e.AREA_UNIT,
    depth: 1,
    isAbstract: false,
    superType: e.DERIVED_UNIT,
  },
  {
    fields: {
      elements: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 0,
        type: e.DERIVED_UNIT_ELEMENT,
      },
      name: {
        kind: f.STRING,
        optional: false,
        derived: true,
      },
    },
    typeId: e.DERIVED_UNIT,
    depth: 0,
    isAbstract: false,
    subTypes: [
       e.AREA_UNIT,
       e.VOLUME_UNIT,
    ],
  },
  {
    fields: {
    },
    typeId: e.ASIN_FUNCTION,
    depth: 5,
    isAbstract: false,
    superType: e.UNARY_FUNCTION_CALL,
  },
  {
    fields: {
      reference_designator: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 5,
      },
    },
    typeId: e.ASSEMBLY_COMPONENT_USAGE,
    depth: 2,
    isAbstract: false,
    superType: e.PRODUCT_DEFINITION_USAGE,
    subTypes: [
       e.NEXT_ASSEMBLY_USAGE_OCCURRENCE,
       e.SPECIFIED_HIGHER_USAGE_OCCURRENCE,
       e.PROMISSORY_USAGE_OCCURRENCE,
    ],
  },
  {
    fields: {
    },
    typeId: e.NEXT_ASSEMBLY_USAGE_OCCURRENCE,
    depth: 3,
    isAbstract: false,
    superType: e.ASSEMBLY_COMPONENT_USAGE,
  },
  {
    fields: {
      upper_usage: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 6,
        type: e.ASSEMBLY_COMPONENT_USAGE,
      },
      next_usage: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 7,
        type: e.NEXT_ASSEMBLY_USAGE_OCCURRENCE,
      },
    },
    typeId: e.SPECIFIED_HIGHER_USAGE_OCCURRENCE,
    depth: 3,
    isAbstract: false,
    superType: e.ASSEMBLY_COMPONENT_USAGE,
  },
  {
    fields: {
    },
    typeId: e.PROMISSORY_USAGE_OCCURRENCE,
    depth: 3,
    isAbstract: false,
    superType: e.ASSEMBLY_COMPONENT_USAGE,
  },
  {
    fields: {
    },
    typeId: e.PRODUCT_DEFINITION_USAGE,
    depth: 1,
    isAbstract: false,
    superType: e.PRODUCT_DEFINITION_RELATIONSHIP,
    subTypes: [
       e.MAKE_FROM_USAGE_OPTION,
       e.ASSEMBLY_COMPONENT_USAGE,
    ],
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      definition: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
      base: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.ASSEMBLY_COMPONENT_USAGE,
      },
      substitute: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.ASSEMBLY_COMPONENT_USAGE,
      },
    },
    typeId: e.ASSEMBLY_COMPONENT_USAGE_SUBSTITUTE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.ATAN_FUNCTION,
    depth: 5,
    isAbstract: false,
    superType: e.BINARY_FUNCTION_CALL,
  },
  {
    fields: {
    },
    typeId: e.BINARY_FUNCTION_CALL,
    depth: 4,
    isAbstract: true,
    superType: e.BINARY_NUMERIC_EXPRESSION,
    subTypes: [
       e.ATAN_FUNCTION,
    ],
  },
  {
    fields: {
      assigned_class: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.GROUP,
      },
      attribute_name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      role: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.CLASSIFICATION_ROLE,
      },
    },
    typeId: e.ATTRIBUTE_CLASSIFICATION_ASSIGNMENT,
    depth: 0,
    isAbstract: true,
  },
  {
    fields: {
      items: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 3,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_DIRECTIVE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_METHOD,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ALTERNATE_PRODUCT_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPLICATION_CONTEXT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPROVAL_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ASSEMBLY_COMPONENT_USAGE_SUBSTITUTE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ATTRIBUTE_VALUE_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CERTIFICATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_DESIGN,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_ITEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONTRACT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DATA_ENVIRONMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DATE_ROLE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DATE_TIME_ROLE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DESCRIPTIVE_REPRESENTATION_ITEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DOCUMENT_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DRAUGHTING_TITLE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EFFECTIVITY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EFFECTIVITY_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EVENT_OCCURRENCE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EXTERNAL_SOURCE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.GENERAL_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.GENERAL_PROPERTY_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.GEOMETRIC_REPRESENTATION_ITEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.GEOMETRIC_TOLERANCE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.GROUP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.GROUP_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.IDENTIFICATION_ROLE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.KINEMATIC_PAIR,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MAPPED_ITEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.NAME_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ORGANIZATION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ORGANIZATION_ROLE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ORGANIZATIONAL_PROJECT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ORGANIZATIONAL_PROJECT_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PAIR_ACTUATOR,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PERSON_AND_ORGANIZATION_ROLE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRESENTATION_LAYER_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PROCESS_PRODUCT_ASSOCIATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_ASSOCIATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_SUBSTITUTE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_RELATED_PRODUCT_CATEGORY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PROPERTY_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PROPERTY_DEFINITION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.REPRESENTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.REPRESENTATION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.REQUIREMENT_FOR_ACTION_RESOURCE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.RESOURCE_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.RESOURCE_REQUIREMENT_TYPE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SECURITY_CLASSIFICATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_ASPECT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_ASPECT_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.STYLED_ITEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.TIME_INTERVAL_ROLE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.TOPOLOGICAL_REPRESENTATION_ITEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.UNCERTAINTY_MEASURE_WITH_UNIT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.UNCERTAINTY_QUALIFIER,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.VERSIONED_ACTION_REQUEST,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.VERSIONED_ACTION_REQUEST_RELATIONSHIP,
          },
        ],
      },
      language: {
        kind: f.STRING,
        optional: false,
        derived: true,
      },
    },
    typeId: e.ATTRIBUTE_LANGUAGE_ASSIGNMENT,
    depth: 1,
    isAbstract: false,
    superType: e.ATTRIBUTE_CLASSIFICATION_ASSIGNMENT,
  },
  {
    fields: {
      attribute_name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      attribute_value: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.LABEL,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.TEXT,
          },
        ],
      },
      role: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.ATTRIBUTE_VALUE_ROLE,
      },
    },
    typeId: e.ATTRIBUTE_VALUE_ASSIGNMENT,
    depth: 0,
    isAbstract: true,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
    },
    typeId: e.ATTRIBUTE_VALUE_ROLE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      axis: {
        kind: f.STEP_REFERENCE,
        optional: true,
        derived: false,
        offset: 2,
        type: e.DIRECTION,
      },
      z: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: true,
        type: e.DIRECTION,
      },
    },
    typeId: e.AXIS1_PLACEMENT,
    depth: 3,
    isAbstract: false,
    superType: e.PLACEMENT,
  },
  {
    fields: {
      location: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.CARTESIAN_POINT,
      },
    },
    typeId: e.PLACEMENT,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_REPRESENTATION_ITEM,
    subTypes: [
       e.AXIS1_PLACEMENT,
       e.AXIS2_PLACEMENT_2D,
       e.AXIS2_PLACEMENT_3D,
    ],
  },
  {
    fields: {
      ref_direction: {
        kind: f.STEP_REFERENCE,
        optional: true,
        derived: false,
        offset: 2,
        type: e.DIRECTION,
      },
      p: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: true,
        type: e.DIRECTION,
      },
    },
    typeId: e.AXIS2_PLACEMENT_2D,
    depth: 3,
    isAbstract: false,
    superType: e.PLACEMENT,
  },
  {
    fields: {
      axis: {
        kind: f.STEP_REFERENCE,
        optional: true,
        derived: false,
        offset: 2,
        type: e.DIRECTION,
      },
      ref_direction: {
        kind: f.STEP_REFERENCE,
        optional: true,
        derived: false,
        offset: 3,
        type: e.DIRECTION,
      },
      p: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: true,
        type: e.DIRECTION,
      },
    },
    typeId: e.AXIS2_PLACEMENT_3D,
    depth: 3,
    isAbstract: false,
    superType: e.PLACEMENT,
  },
  {
    fields: {
      degree: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 1,
      },
      control_points_list: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 2,
        type: e.CARTESIAN_POINT,
      },
      curve_form: {
        kind: f.ENUM,
        optional: false,
        derived: false,
        offset: 3,
        type: b_spline_curve_form,
      },
      closed_curve: {
        kind: f.BOOLEAN,
        optional: false,
        derived: false,
        offset: 4,
      },
      self_intersect: {
        kind: f.BOOLEAN,
        optional: false,
        derived: false,
        offset: 5,
      },
      upper_index_on_control_points: {
        kind: f.NUMBER,
        optional: false,
        derived: true,
      },
      control_points: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: true,
        type: e.CARTESIAN_POINT,
      },
    },
    typeId: e.B_SPLINE_CURVE,
    depth: 4,
    isAbstract: false,
    superType: e.BOUNDED_CURVE,
    subTypes: [
       e.UNIFORM_CURVE,
       e.B_SPLINE_CURVE_WITH_KNOTS,
       e.QUASI_UNIFORM_CURVE,
       e.BEZIER_CURVE,
    ],
  },
  {
    fields: {
    },
    typeId: e.UNIFORM_CURVE,
    depth: 5,
    isAbstract: false,
    superType: e.B_SPLINE_CURVE,
  },
  {
    fields: {
      knot_multiplicities: {
        kind: f.NUMBER,
        rank: 1,
        optional: false,
        derived: false,
        offset: 6,
      },
      knots: {
        kind: f.NUMBER,
        rank: 1,
        optional: false,
        derived: false,
        offset: 7,
      },
      knot_spec: {
        kind: f.ENUM,
        optional: false,
        derived: false,
        offset: 8,
        type: knot_type,
      },
      upper_index_on_knots: {
        kind: f.NUMBER,
        optional: false,
        derived: true,
      },
    },
    typeId: e.B_SPLINE_CURVE_WITH_KNOTS,
    depth: 5,
    isAbstract: false,
    superType: e.B_SPLINE_CURVE,
  },
  {
    fields: {
    },
    typeId: e.QUASI_UNIFORM_CURVE,
    depth: 5,
    isAbstract: false,
    superType: e.B_SPLINE_CURVE,
  },
  {
    fields: {
    },
    typeId: e.BEZIER_CURVE,
    depth: 5,
    isAbstract: false,
    superType: e.B_SPLINE_CURVE,
  },
  {
    fields: {
    },
    typeId: e.BOUNDED_CURVE,
    depth: 3,
    isAbstract: false,
    superType: e.CURVE,
    subTypes: [
       e.POLYLINE,
       e.B_SPLINE_CURVE,
       e.TRIMMED_CURVE,
       e.BOUNDED_PCURVE,
       e.BOUNDED_SURFACE_CURVE,
       e.COMPOSITE_CURVE,
    ],
  },
  {
    fields: {
      u_degree: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 1,
      },
      v_degree: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
      control_points_list: {
        kind: f.STEP_REFERENCE,
        rank: 2,
        optional: false,
        derived: false,
        offset: 3,
        type: e.CARTESIAN_POINT,
      },
      surface_form: {
        kind: f.ENUM,
        optional: false,
        derived: false,
        offset: 4,
        type: b_spline_surface_form,
      },
      u_closed: {
        kind: f.BOOLEAN,
        optional: false,
        derived: false,
        offset: 5,
      },
      v_closed: {
        kind: f.BOOLEAN,
        optional: false,
        derived: false,
        offset: 6,
      },
      self_intersect: {
        kind: f.BOOLEAN,
        optional: false,
        derived: false,
        offset: 7,
      },
      u_upper: {
        kind: f.NUMBER,
        optional: false,
        derived: true,
      },
      v_upper: {
        kind: f.NUMBER,
        optional: false,
        derived: true,
      },
      control_points: {
        kind: f.STEP_REFERENCE,
        rank: 2,
        optional: false,
        derived: true,
        type: e.CARTESIAN_POINT,
      },
    },
    typeId: e.B_SPLINE_SURFACE,
    depth: 4,
    isAbstract: false,
    superType: e.BOUNDED_SURFACE,
    subTypes: [
       e.B_SPLINE_SURFACE_WITH_KNOTS,
       e.UNIFORM_SURFACE,
       e.QUASI_UNIFORM_SURFACE,
       e.BEZIER_SURFACE,
    ],
  },
  {
    fields: {
      u_multiplicities: {
        kind: f.NUMBER,
        rank: 1,
        optional: false,
        derived: false,
        offset: 8,
      },
      v_multiplicities: {
        kind: f.NUMBER,
        rank: 1,
        optional: false,
        derived: false,
        offset: 9,
      },
      u_knots: {
        kind: f.NUMBER,
        rank: 1,
        optional: false,
        derived: false,
        offset: 10,
      },
      v_knots: {
        kind: f.NUMBER,
        rank: 1,
        optional: false,
        derived: false,
        offset: 11,
      },
      knot_spec: {
        kind: f.ENUM,
        optional: false,
        derived: false,
        offset: 12,
        type: knot_type,
      },
      knot_u_upper: {
        kind: f.NUMBER,
        optional: false,
        derived: true,
      },
      knot_v_upper: {
        kind: f.NUMBER,
        optional: false,
        derived: true,
      },
    },
    typeId: e.B_SPLINE_SURFACE_WITH_KNOTS,
    depth: 5,
    isAbstract: false,
    superType: e.B_SPLINE_SURFACE,
  },
  {
    fields: {
    },
    typeId: e.UNIFORM_SURFACE,
    depth: 5,
    isAbstract: false,
    superType: e.B_SPLINE_SURFACE,
  },
  {
    fields: {
    },
    typeId: e.QUASI_UNIFORM_SURFACE,
    depth: 5,
    isAbstract: false,
    superType: e.B_SPLINE_SURFACE,
  },
  {
    fields: {
    },
    typeId: e.BEZIER_SURFACE,
    depth: 5,
    isAbstract: false,
    superType: e.B_SPLINE_SURFACE,
  },
  {
    fields: {
    },
    typeId: e.BOUNDED_SURFACE,
    depth: 3,
    isAbstract: false,
    superType: e.SURFACE,
    subTypes: [
       e.B_SPLINE_SURFACE,
       e.RECTANGULAR_TRIMMED_SURFACE,
       e.CURVE_BOUNDED_SURFACE,
       e.RECTANGULAR_COMPOSITE_SURFACE,
    ],
  },
  {
    fields: {
      presentation: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 0,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRESENTATION_AREA,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRESENTATION_VIEW,
          },
        ],
      },
    },
    typeId: e.BACKGROUND_COLOUR,
    depth: 1,
    isAbstract: false,
    superType: e.COLOUR,
  },
  {
    fields: {
    },
    typeId: e.COLOUR,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.BARRING_HOLE,
    depth: 2,
    isAbstract: false,
    superType: e.FEATURE_DEFINITION,
  },
  {
    fields: {
    },
    typeId: e.FEATURE_DEFINITION,
    depth: 1,
    isAbstract: false,
    superType: e.CHARACTERIZED_OBJECT,
  },
  {
    fields: {
    },
    typeId: e.BEAD,
    depth: 2,
    isAbstract: false,
    superType: e.FEATURE_DEFINITION,
  },
  {
    fields: {
    },
    typeId: e.BEAD_END,
    depth: 1,
    isAbstract: false,
    superType: e.SHAPE_ASPECT,
  },
  {
    fields: {
    },
    typeId: e.BINARY_BOOLEAN_EXPRESSION,
    depth: 3,
    isAbstract: true,
    superType: e.BOOLEAN_EXPRESSION,
    subTypes: [
       e.XOR_EXPRESSION,
       e.EQUALS_EXPRESSION,
    ],
  },
  {
    fields: {
      operands: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 0,
        type: e.BOOLEAN_EXPRESSION,
      },
    },
    typeId: e.XOR_EXPRESSION,
    depth: 4,
    isAbstract: false,
    superType: e.BINARY_BOOLEAN_EXPRESSION,
  },
  {
    fields: {
    },
    typeId: e.EQUALS_EXPRESSION,
    depth: 4,
    isAbstract: false,
    superType: e.BINARY_BOOLEAN_EXPRESSION,
  },
  {
    fields: {
    },
    typeId: e.BOOLEAN_EXPRESSION,
    depth: 2,
    isAbstract: true,
    superType: e.EXPRESSION,
    subTypes: [
       e.SIMPLE_BOOLEAN_EXPRESSION,
       e.UNARY_BOOLEAN_EXPRESSION,
       e.BINARY_BOOLEAN_EXPRESSION,
       e.MULTIPLE_ARITY_BOOLEAN_EXPRESSION,
       e.COMPARISON_EXPRESSION,
       e.INTERVAL_EXPRESSION,
       e.BOOLEAN_DEFINED_FUNCTION,
    ],
  },
  {
    fields: {
      operands: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 0,
        type: e.GENERIC_EXPRESSION,
      },
    },
    typeId: e.BINARY_GENERIC_EXPRESSION,
    depth: 1,
    isAbstract: true,
    superType: e.GENERIC_EXPRESSION,
  },
  {
    fields: {
      operands: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 0,
        type: e.NUMERIC_EXPRESSION,
      },
    },
    typeId: e.BINARY_NUMERIC_EXPRESSION,
    depth: 3,
    isAbstract: true,
    superType: e.NUMERIC_EXPRESSION,
    subTypes: [
       e.MINUS_EXPRESSION,
       e.DIV_EXPRESSION,
       e.MOD_EXPRESSION,
       e.SLASH_EXPRESSION,
       e.POWER_EXPRESSION,
       e.BINARY_FUNCTION_CALL,
    ],
  },
  {
    fields: {
    },
    typeId: e.GENERIC_EXPRESSION,
    depth: 0,
    isAbstract: true,
    subTypes: [
       e.SIMPLE_GENERIC_EXPRESSION,
       e.UNARY_GENERIC_EXPRESSION,
       e.BINARY_GENERIC_EXPRESSION,
       e.MULTIPLE_ARITY_GENERIC_EXPRESSION,
    ],
  },
  {
    fields: {
    },
    typeId: e.MINUS_EXPRESSION,
    depth: 4,
    isAbstract: false,
    superType: e.BINARY_NUMERIC_EXPRESSION,
  },
  {
    fields: {
    },
    typeId: e.DIV_EXPRESSION,
    depth: 4,
    isAbstract: false,
    superType: e.BINARY_NUMERIC_EXPRESSION,
  },
  {
    fields: {
    },
    typeId: e.MOD_EXPRESSION,
    depth: 4,
    isAbstract: false,
    superType: e.BINARY_NUMERIC_EXPRESSION,
  },
  {
    fields: {
    },
    typeId: e.SLASH_EXPRESSION,
    depth: 4,
    isAbstract: false,
    superType: e.BINARY_NUMERIC_EXPRESSION,
  },
  {
    fields: {
    },
    typeId: e.POWER_EXPRESSION,
    depth: 4,
    isAbstract: false,
    superType: e.BINARY_NUMERIC_EXPRESSION,
  },
  {
    fields: {
      is_int: {
        kind: f.BOOLEAN,
        optional: false,
        derived: true,
      },
      sql_mappable: {
        kind: f.BOOLEAN,
        optional: false,
        derived: true,
      },
    },
    typeId: e.NUMERIC_EXPRESSION,
    depth: 2,
    isAbstract: true,
    superType: e.EXPRESSION,
    subTypes: [
       e.SIMPLE_NUMERIC_EXPRESSION,
       e.UNARY_NUMERIC_EXPRESSION,
       e.BINARY_NUMERIC_EXPRESSION,
       e.MULTIPLE_ARITY_NUMERIC_EXPRESSION,
       e.LENGTH_FUNCTION,
       e.VALUE_FUNCTION,
       e.NUMERIC_DEFINED_FUNCTION,
    ],
  },
  {
    fields: {
      position: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.AXIS2_PLACEMENT_3D,
      },
      x: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
      y: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 3,
      },
      z: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 4,
      },
    },
    typeId: e.BLOCK,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_REPRESENTATION_ITEM,
  },
  {
    fields: {
    },
    typeId: e.BOOLEAN_DEFINED_FUNCTION,
    depth: 1,
    isAbstract: true,
    superType: e.DEFINED_FUNCTION,
  },
  {
    fields: {
    },
    typeId: e.DEFINED_FUNCTION,
    depth: 0,
    isAbstract: true,
    subTypes: [
       e.NUMERIC_DEFINED_FUNCTION,
       e.STRING_DEFINED_FUNCTION,
       e.BOOLEAN_DEFINED_FUNCTION,
    ],
  },
  {
    fields: {
    },
    typeId: e.SIMPLE_BOOLEAN_EXPRESSION,
    depth: 3,
    isAbstract: true,
    superType: e.BOOLEAN_EXPRESSION,
    subTypes: [
       e.BOOLEAN_LITERAL,
       e.BOOLEAN_VARIABLE,
    ],
  },
  {
    fields: {
    },
    typeId: e.UNARY_BOOLEAN_EXPRESSION,
    depth: 3,
    isAbstract: true,
    superType: e.BOOLEAN_EXPRESSION,
    subTypes: [
       e.NOT_EXPRESSION,
       e.ODD_FUNCTION,
    ],
  },
  {
    fields: {
      operands: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 0,
        type: e.EXPRESSION,
      },
    },
    typeId: e.COMPARISON_EXPRESSION,
    depth: 3,
    isAbstract: true,
    superType: e.BOOLEAN_EXPRESSION,
    subTypes: [
       e.COMPARISON_EQUAL,
       e.COMPARISON_GREATER,
       e.COMPARISON_GREATER_EQUAL,
       e.COMPARISON_LESS,
       e.COMPARISON_LESS_EQUAL,
       e.COMPARISON_NOT_EQUAL,
       e.LIKE_EXPRESSION,
    ],
  },
  {
    fields: {
      interval_low: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: true,
        type: e.GENERIC_EXPRESSION,
      },
      interval_item: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: true,
        type: e.GENERIC_EXPRESSION,
      },
      interval_high: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: true,
        type: e.GENERIC_EXPRESSION,
      },
    },
    typeId: e.INTERVAL_EXPRESSION,
    depth: 3,
    isAbstract: false,
    superType: e.BOOLEAN_EXPRESSION,
  },
  {
    fields: {
    },
    typeId: e.EXPRESSION,
    depth: 1,
    isAbstract: true,
    superType: e.GENERIC_EXPRESSION,
    subTypes: [
       e.NUMERIC_EXPRESSION,
       e.BOOLEAN_EXPRESSION,
       e.STRING_EXPRESSION,
    ],
  },
  {
    fields: {
      the_value: {
        kind: f.BOOLEAN,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.BOOLEAN_LITERAL,
    depth: 4,
    isAbstract: false,
    superType: e.SIMPLE_BOOLEAN_EXPRESSION,
  },
  {
    fields: {
    },
    typeId: e.GENERIC_LITERAL,
    depth: 2,
    isAbstract: true,
    superType: e.SIMPLE_GENERIC_EXPRESSION,
  },
  {
    fields: {
      operator: {
        kind: f.ENUM,
        optional: false,
        derived: false,
        offset: 1,
        type: boolean_operator,
      },
      first_operand: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SOLID_MODEL,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.HALF_SPACE_SOLID,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SPHERE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.BLOCK,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.RIGHT_ANGULAR_WEDGE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.TORUS,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.RIGHT_CIRCULAR_CONE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.RIGHT_CIRCULAR_CYLINDER,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.BOOLEAN_RESULT,
          },
        ],
      },
      second_operand: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 3,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SOLID_MODEL,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.HALF_SPACE_SOLID,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SPHERE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.BLOCK,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.RIGHT_ANGULAR_WEDGE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.TORUS,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.RIGHT_CIRCULAR_CONE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.RIGHT_CIRCULAR_CYLINDER,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.BOOLEAN_RESULT,
          },
        ],
      },
    },
    typeId: e.BOOLEAN_RESULT,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_REPRESENTATION_ITEM,
  },
  {
    fields: {
    },
    typeId: e.BOOLEAN_VARIABLE,
    depth: 4,
    isAbstract: false,
    superType: e.SIMPLE_BOOLEAN_EXPRESSION,
  },
  {
    fields: {
    },
    typeId: e.VARIABLE,
    depth: 3,
    isAbstract: true,
    superType: e.GENERIC_VARIABLE,
    subTypes: [
       e.NUMERIC_VARIABLE,
       e.BOOLEAN_VARIABLE,
       e.STRING_VARIABLE,
    ],
  },
  {
    fields: {
    },
    typeId: e.BOSS,
    depth: 2,
    isAbstract: false,
    superType: e.FEATURE_DEFINITION,
  },
  {
    fields: {
    },
    typeId: e.BOSS_TOP,
    depth: 1,
    isAbstract: false,
    superType: e.SHAPE_ASPECT,
  },
  {
    fields: {
    },
    typeId: e.BOUNDARY_CURVE,
    depth: 6,
    isAbstract: false,
    superType: e.COMPOSITE_CURVE_ON_SURFACE,
  },
  {
    fields: {
      basis_surface: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: true,
        type: e.SURFACE,
      },
    },
    typeId: e.COMPOSITE_CURVE_ON_SURFACE,
    depth: 5,
    isAbstract: false,
    superType: e.COMPOSITE_CURVE,
  },
  {
    fields: {
      points: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        type: e.CARTESIAN_POINT,
      },
    },
    typeId: e.POLYLINE,
    depth: 4,
    isAbstract: false,
    superType: e.BOUNDED_CURVE,
  },
  {
    fields: {
      basis_curve: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.CURVE,
      },
      trim_1: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CARTESIAN_POINT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PARAMETER_VALUE,
          },
        ],
      },
      trim_2: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 3,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CARTESIAN_POINT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PARAMETER_VALUE,
          },
        ],
      },
      sense_agreement: {
        kind: f.BOOLEAN,
        optional: false,
        derived: false,
        offset: 4,
      },
      master_representation: {
        kind: f.ENUM,
        optional: false,
        derived: false,
        offset: 5,
        type: trimming_preference,
      },
    },
    typeId: e.TRIMMED_CURVE,
    depth: 4,
    isAbstract: false,
    superType: e.BOUNDED_CURVE,
  },
  {
    fields: {
    },
    typeId: e.BOUNDED_PCURVE,
    depth: 4,
    isAbstract: false,
    superType: e.PCURVE,
  },
  {
    fields: {
    },
    typeId: e.BOUNDED_SURFACE_CURVE,
    depth: 4,
    isAbstract: false,
    superType: e.SURFACE_CURVE,
  },
  {
    fields: {
      segments: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        type: e.COMPOSITE_CURVE_SEGMENT,
      },
      self_intersect: {
        kind: f.BOOLEAN,
        optional: false,
        derived: false,
        offset: 2,
      },
      n_segments: {
        kind: f.NUMBER,
        optional: false,
        derived: true,
      },
      closed_curve: {
        kind: f.BOOLEAN,
        optional: false,
        derived: true,
      },
    },
    typeId: e.COMPOSITE_CURVE,
    depth: 4,
    isAbstract: false,
    superType: e.BOUNDED_CURVE,
  },
  {
    fields: {
    },
    typeId: e.CURVE,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_REPRESENTATION_ITEM,
    subTypes: [
       e.LINE,
       e.CONIC,
       e.PCURVE,
       e.SURFACE_CURVE,
       e.OFFSET_CURVE_2D,
       e.OFFSET_CURVE_3D,
       e.CURVE_REPLICA,
    ],
  },
  {
    fields: {
      basis_surface: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.SURFACE,
      },
      reference_to_curve: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.DEFINITIONAL_REPRESENTATION,
      },
    },
    typeId: e.PCURVE,
    depth: 3,
    isAbstract: false,
    superType: e.CURVE,
  },
  {
    fields: {
      basis_surface: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.SURFACE,
      },
      u1: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
      u2: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 3,
      },
      v1: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 4,
      },
      v2: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 5,
      },
      usense: {
        kind: f.BOOLEAN,
        optional: false,
        derived: false,
        offset: 6,
      },
      vsense: {
        kind: f.BOOLEAN,
        optional: false,
        derived: false,
        offset: 7,
      },
    },
    typeId: e.RECTANGULAR_TRIMMED_SURFACE,
    depth: 4,
    isAbstract: false,
    superType: e.BOUNDED_SURFACE,
  },
  {
    fields: {
      basis_surface: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.SURFACE,
      },
      boundaries: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 2,
        type: e.BOUNDARY_CURVE,
      },
      implicit_outer: {
        kind: f.BOOLEAN,
        optional: false,
        derived: false,
        offset: 3,
      },
    },
    typeId: e.CURVE_BOUNDED_SURFACE,
    depth: 4,
    isAbstract: false,
    superType: e.BOUNDED_SURFACE,
  },
  {
    fields: {
      segments: {
        kind: f.STEP_REFERENCE,
        rank: 2,
        optional: false,
        derived: false,
        offset: 1,
        type: e.SURFACE_PATCH,
      },
      n_u: {
        kind: f.NUMBER,
        optional: false,
        derived: true,
      },
      n_v: {
        kind: f.NUMBER,
        optional: false,
        derived: true,
      },
    },
    typeId: e.RECTANGULAR_COMPOSITE_SURFACE,
    depth: 4,
    isAbstract: false,
    superType: e.BOUNDED_SURFACE,
  },
  {
    fields: {
    },
    typeId: e.SURFACE,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_REPRESENTATION_ITEM,
    subTypes: [
       e.ELEMENTARY_SURFACE,
       e.SWEPT_SURFACE,
       e.BOUNDED_SURFACE,
       e.OFFSET_SURFACE,
       e.SURFACE_REPLICA,
    ],
  },
  {
    fields: {
      curve_3d: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.CURVE,
      },
      associated_geometry: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PCURVE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SURFACE,
          },
        ],
      },
      master_representation: {
        kind: f.ENUM,
        optional: false,
        derived: false,
        offset: 3,
        type: preferred_surface_curve_representation,
      },
      basis_surface: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: true,
        type: e.SURFACE,
      },
    },
    typeId: e.SURFACE_CURVE,
    depth: 3,
    isAbstract: false,
    superType: e.CURVE,
    subTypes: [
       e.INTERSECTION_CURVE,
       e.SEAM_CURVE,
    ],
  },
  {
    fields: {
      corner: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.CARTESIAN_POINT,
      },
      xlength: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 1,
      },
      ylength: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
      zlength: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 3,
      },
    },
    typeId: e.BOX_DOMAIN,
    depth: 1,
    isAbstract: false,
    superType: e.FOUNDED_ITEM,
  },
  {
    fields: {
      enclosure: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.BOX_DOMAIN,
      },
    },
    typeId: e.BOXED_HALF_SPACE,
    depth: 3,
    isAbstract: false,
    superType: e.HALF_SPACE_SOLID,
  },
  {
    fields: {
      base_surface: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.SURFACE,
      },
      agreement_flag: {
        kind: f.BOOLEAN,
        optional: false,
        derived: false,
        offset: 2,
      },
    },
    typeId: e.HALF_SPACE_SOLID,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_REPRESENTATION_ITEM,
  },
  {
    fields: {
      voids: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 2,
        type: e.ORIENTED_CLOSED_SHELL,
      },
    },
    typeId: e.BREP_WITH_VOIDS,
    depth: 4,
    isAbstract: false,
    superType: e.MANIFOLD_SOLID_BREP,
  },
  {
    fields: {
      outer: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.CLOSED_SHELL,
      },
    },
    typeId: e.MANIFOLD_SOLID_BREP,
    depth: 3,
    isAbstract: false,
    superType: e.SOLID_MODEL,
  },
  {
    fields: {
      day_component: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 1,
      },
      month_component: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
    },
    typeId: e.CALENDAR_DATE,
    depth: 1,
    isAbstract: false,
    superType: e.DATE,
  },
  {
    fields: {
      year_component: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.DATE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      mapping_source: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.CAMERA_USAGE,
      },
      mapping_target: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 4,
        type: e.PLANAR_BOX,
      },
    },
    typeId: e.CAMERA_IMAGE,
    depth: 2,
    isAbstract: false,
    superType: e.MAPPED_ITEM,
  },
  {
    fields: {
      scale: {
        kind: f.NUMBER,
        optional: false,
        derived: true,
      },
    },
    typeId: e.CAMERA_IMAGE_2D_WITH_SCALE,
    depth: 3,
    isAbstract: false,
    superType: e.CAMERA_IMAGE,
  },
  {
    fields: {
      scale: {
        kind: f.NUMBER,
        optional: false,
        derived: true,
      },
    },
    typeId: e.CAMERA_IMAGE_3D_WITH_SCALE,
    depth: 3,
    isAbstract: false,
    superType: e.CAMERA_IMAGE,
  },
  {
    fields: {
    },
    typeId: e.CAMERA_MODEL,
    depth: 2,
    isAbstract: true,
    superType: e.GEOMETRIC_REPRESENTATION_ITEM,
    subTypes: [
       e.CAMERA_MODEL_D2,
       e.CAMERA_MODEL_D3,
    ],
  },
  {
    fields: {
      view_window: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.PLANAR_BOX,
      },
      view_window_clipping: {
        kind: f.BOOLEAN,
        optional: false,
        derived: false,
        offset: 2,
      },
    },
    typeId: e.CAMERA_MODEL_D2,
    depth: 3,
    isAbstract: false,
    superType: e.CAMERA_MODEL,
  },
  {
    fields: {
      view_reference_system: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.AXIS2_PLACEMENT_3D,
      },
      perspective_of_volume: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.VIEW_VOLUME,
      },
    },
    typeId: e.CAMERA_MODEL_D3,
    depth: 3,
    isAbstract: false,
    superType: e.CAMERA_MODEL,
  },
  {
    fields: {
      hidden_line_surface_removal: {
        kind: f.BOOLEAN,
        optional: false,
        derived: false,
        offset: 3,
      },
    },
    typeId: e.CAMERA_MODEL_D3_WITH_HLHSR,
    depth: 4,
    isAbstract: false,
    superType: e.CAMERA_MODEL_D3,
  },
  {
    fields: {
      mapping_origin: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.CAMERA_MODEL,
      },
    },
    typeId: e.CAMERA_USAGE,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION_MAP,
  },
  {
    fields: {
      mapping_origin: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.REPRESENTATION_ITEM,
      },
      mapped_representation: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.REPRESENTATION,
      },
      map_usage: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 2,
        type: e.MAPPED_ITEM,
      },
    },
    typeId: e.REPRESENTATION_MAP,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      coordinates: {
        kind: f.NUMBER,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
      },
    },
    typeId: e.CARTESIAN_POINT,
    depth: 3,
    isAbstract: false,
    superType: e.POINT,
  },
  {
    fields: {
    },
    typeId: e.POINT,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_REPRESENTATION_ITEM,
    subTypes: [
       e.CARTESIAN_POINT,
       e.POINT_ON_CURVE,
       e.POINT_ON_SURFACE,
       e.POINT_REPLICA,
       e.DEGENERATE_PCURVE,
    ],
  },
  {
    fields: {
      axis1: {
        kind: f.STEP_REFERENCE,
        optional: true,
        derived: false,
        offset: 1,
        type: e.DIRECTION,
      },
      axis2: {
        kind: f.STEP_REFERENCE,
        optional: true,
        derived: false,
        offset: 2,
        type: e.DIRECTION,
      },
      local_origin: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.CARTESIAN_POINT,
      },
      scale: {
        kind: f.NUMBER,
        optional: true,
        derived: false,
        offset: 4,
      },
      scl: {
        kind: f.NUMBER,
        optional: false,
        derived: true,
      },
    },
    typeId: e.CARTESIAN_TRANSFORMATION_OPERATOR,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_REPRESENTATION_ITEM,
    subTypes: [
       e.CARTESIAN_TRANSFORMATION_OPERATOR_2D,
       e.CARTESIAN_TRANSFORMATION_OPERATOR_3D,
    ],
  },
  {
    fields: {
      u: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: true,
        type: e.DIRECTION,
      },
    },
    typeId: e.CARTESIAN_TRANSFORMATION_OPERATOR_2D,
    depth: 3,
    isAbstract: false,
    superType: e.CARTESIAN_TRANSFORMATION_OPERATOR,
  },
  {
    fields: {
      axis3: {
        kind: f.STEP_REFERENCE,
        optional: true,
        derived: false,
        offset: 5,
        type: e.DIRECTION,
      },
      u: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: true,
        type: e.DIRECTION,
      },
    },
    typeId: e.CARTESIAN_TRANSFORMATION_OPERATOR_3D,
    depth: 3,
    isAbstract: false,
    superType: e.CARTESIAN_TRANSFORMATION_OPERATOR,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
    },
    typeId: e.FUNCTIONALLY_DEFINED_TRANSFORMATION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.CELSIUS_TEMPERATURE_MEASURE_WITH_UNIT,
    depth: 1,
    isAbstract: false,
    superType: e.MEASURE_WITH_UNIT,
  },
  {
    fields: {
    },
    typeId: e.CENTRE_OF_SYMMETRY,
    depth: 2,
    isAbstract: false,
    superType: e.DERIVED_SHAPE_ASPECT,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      purpose: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      kind: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.CERTIFICATION_TYPE,
      },
    },
    typeId: e.CERTIFICATION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      description: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.CERTIFICATION_TYPE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.CHAMFER,
    depth: 2,
    isAbstract: false,
    superType: e.TRANSITION_FEATURE,
  },
  {
    fields: {
    },
    typeId: e.TRANSITION_FEATURE,
    depth: 1,
    isAbstract: false,
    superType: e.SHAPE_ASPECT,
  },
  {
    fields: {
    },
    typeId: e.CHAMFER_OFFSET,
    depth: 1,
    isAbstract: false,
    superType: e.SHAPE_ASPECT,
  },
  {
    fields: {
      character_box: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.PLANAR_EXTENT,
      },
      baseline_ratio: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 4,
      },
      box_height: {
        kind: f.NUMBER,
        optional: false,
        derived: true,
      },
    },
    typeId: e.CHARACTER_GLYPH_SYMBOL,
    depth: 3,
    isAbstract: false,
    superType: e.GENERIC_CHARACTER_GLYPH_SYMBOL,
  },
  {
    fields: {
    },
    typeId: e.GENERIC_CHARACTER_GLYPH_SYMBOL,
    depth: 2,
    isAbstract: true,
    superType: e.SYMBOL_REPRESENTATION,
  },
  {
    fields: {
    },
    typeId: e.CHARACTERIZED_CLASS,
    depth: 1,
    isAbstract: false,
    superType: e.CHARACTERIZED_OBJECT,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
    },
    typeId: e.CHARACTERIZED_OBJECT,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.CLASS_,
    depth: 1,
    isAbstract: false,
    superType: e.GROUP,
  },
  {
    fields: {
      radius: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
    },
    typeId: e.CIRCLE,
    depth: 4,
    isAbstract: false,
    superType: e.CONIC,
  },
  {
    fields: {
      position: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.AXIS2_PLACEMENT_2D,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.AXIS2_PLACEMENT_3D,
          },
        ],
      },
    },
    typeId: e.CONIC,
    depth: 3,
    isAbstract: false,
    superType: e.CURVE,
    subTypes: [
       e.CIRCLE,
       e.ELLIPSE,
       e.HYPERBOLA,
       e.PARABOLA,
    ],
  },
  {
    fields: {
    },
    typeId: e.CIRCULAR_CLOSED_PROFILE,
    depth: 1,
    isAbstract: false,
    superType: e.SHAPE_ASPECT,
  },
  {
    fields: {
    },
    typeId: e.CIRCULAR_PATTERN,
    depth: 3,
    isAbstract: false,
    superType: e.REPLICATE_FEATURE,
  },
  {
    fields: {
    },
    typeId: e.REPLICATE_FEATURE,
    depth: 2,
    isAbstract: false,
    superType: e.FEATURE_DEFINITION,
  },
  {
    fields: {
    },
    typeId: e.CIRCULAR_RUNOUT_TOLERANCE,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_TOLERANCE_WITH_DATUM_REFERENCE,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
      id: {
        kind: f.STRING,
        optional: false,
        derived: true,
      },
    },
    typeId: e.GROUP,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.CLASS_SYSTEM,
    depth: 1,
    isAbstract: false,
    superType: e.GROUP,
  },
  {
    fields: {
      items: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION,
          },
        ],
      },
    },
    typeId: e.CLASS_USAGE_EFFECTIVITY_CONTEXT_ASSIGNMENT,
    depth: 1,
    isAbstract: false,
    superType: e.EFFECTIVITY_CONTEXT_ASSIGNMENT,
  },
  {
    fields: {
      assigned_effectivity_assignment: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.EFFECTIVITY_ASSIGNMENT,
      },
      role: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.EFFECTIVITY_CONTEXT_ROLE,
      },
    },
    typeId: e.EFFECTIVITY_CONTEXT_ASSIGNMENT,
    depth: 0,
    isAbstract: true,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
    },
    typeId: e.CLASSIFICATION_ROLE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.CLOSED_PATH_PROFILE,
    depth: 1,
    isAbstract: false,
    superType: e.SHAPE_ASPECT,
  },
  {
    fields: {
    },
    typeId: e.CLOSED_SHELL,
    depth: 3,
    isAbstract: false,
    superType: e.CONNECTED_FACE_SET,
  },
  {
    fields: {
      cfs_faces: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        type: e.FACE,
      },
    },
    typeId: e.CONNECTED_FACE_SET,
    depth: 2,
    isAbstract: false,
    superType: e.TOPOLOGICAL_REPRESENTATION_ITEM,
    subTypes: [
       e.CLOSED_SHELL,
       e.OPEN_SHELL,
    ],
  },
  {
    fields: {
    },
    typeId: e.COAXIALITY_TOLERANCE,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_TOLERANCE_WITH_DATUM_REFERENCE,
  },
  {
    fields: {
      red: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 1,
      },
      green: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
      blue: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 3,
      },
    },
    typeId: e.COLOUR_RGB,
    depth: 2,
    isAbstract: false,
    superType: e.COLOUR_SPECIFICATION,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.COLOUR_SPECIFICATION,
    depth: 1,
    isAbstract: false,
    superType: e.COLOUR,
  },
  {
    fields: {
    },
    typeId: e.COMMON_DATUM,
    depth: 2,
    isAbstract: false,
    superType: e.COMPOSITE_SHAPE_ASPECT,
  },
  {
    fields: {
      component_relationships: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 4,
        type: e.SHAPE_ASPECT_RELATIONSHIP,
      },
    },
    typeId: e.COMPOSITE_SHAPE_ASPECT,
    depth: 1,
    isAbstract: false,
    superType: e.SHAPE_ASPECT,
  },
  {
    fields: {
      identification: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 4,
      },
      established_by_relationships: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 5,
        type: e.SHAPE_ASPECT_RELATIONSHIP,
      },
    },
    typeId: e.DATUM,
    depth: 1,
    isAbstract: false,
    superType: e.SHAPE_ASPECT,
  },
  {
    fields: {
    },
    typeId: e.COMPARISON_EQUAL,
    depth: 4,
    isAbstract: false,
    superType: e.COMPARISON_EXPRESSION,
  },
  {
    fields: {
    },
    typeId: e.COMPARISON_GREATER,
    depth: 4,
    isAbstract: false,
    superType: e.COMPARISON_EXPRESSION,
  },
  {
    fields: {
    },
    typeId: e.COMPARISON_GREATER_EQUAL,
    depth: 4,
    isAbstract: false,
    superType: e.COMPARISON_EXPRESSION,
  },
  {
    fields: {
    },
    typeId: e.COMPARISON_LESS,
    depth: 4,
    isAbstract: false,
    superType: e.COMPARISON_EXPRESSION,
  },
  {
    fields: {
    },
    typeId: e.COMPARISON_LESS_EQUAL,
    depth: 4,
    isAbstract: false,
    superType: e.COMPARISON_EXPRESSION,
  },
  {
    fields: {
    },
    typeId: e.COMPARISON_NOT_EQUAL,
    depth: 4,
    isAbstract: false,
    superType: e.COMPARISON_EXPRESSION,
  },
  {
    fields: {
    },
    typeId: e.LIKE_EXPRESSION,
    depth: 4,
    isAbstract: false,
    superType: e.COMPARISON_EXPRESSION,
  },
  {
    fields: {
      transition: {
        kind: f.ENUM,
        optional: false,
        derived: false,
        offset: 0,
        type: transition_code,
      },
      same_sense: {
        kind: f.BOOLEAN,
        optional: false,
        derived: false,
        offset: 1,
      },
      parent_curve: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.CURVE,
      },
      using_curves: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 3,
        type: e.COMPOSITE_CURVE,
      },
    },
    typeId: e.COMPOSITE_CURVE_SEGMENT,
    depth: 1,
    isAbstract: false,
    superType: e.FOUNDED_ITEM,
  },
  {
    fields: {
    },
    typeId: e.COMPOSITE_HOLE,
    depth: 3,
    isAbstract: false,
    superType: e.COMPOUND_FEATURE,
  },
  {
    fields: {
    },
    typeId: e.COMPOUND_FEATURE,
    depth: 2,
    isAbstract: false,
    superType: e.FEATURE_DEFINITION,
  },
  {
    fields: {
      collected_text: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ANNOTATION_TEXT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ANNOTATION_TEXT_CHARACTER,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DEFINED_CHARACTER_GLYPH,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.COMPOSITE_TEXT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.TEXT_LITERAL,
          },
        ],
      },
    },
    typeId: e.COMPOSITE_TEXT,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_REPRESENTATION_ITEM,
  },
  {
    fields: {
      associated_curves: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 2,
        type: e.CURVE,
      },
    },
    typeId: e.COMPOSITE_TEXT_WITH_ASSOCIATED_CURVES,
    depth: 3,
    isAbstract: false,
    superType: e.COMPOSITE_TEXT,
  },
  {
    fields: {
      blanking: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.PLANAR_BOX,
      },
    },
    typeId: e.COMPOSITE_TEXT_WITH_BLANKING_BOX,
    depth: 3,
    isAbstract: false,
    superType: e.COMPOSITE_TEXT,
  },
  {
    fields: {
      extent: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.PLANAR_EXTENT,
      },
    },
    typeId: e.COMPOSITE_TEXT_WITH_EXTENT,
    depth: 3,
    isAbstract: false,
    superType: e.COMPOSITE_TEXT,
  },
  {
    fields: {
      item_element: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.LIST_REPRESENTATION_ITEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SET_REPRESENTATION_ITEM,
          },
        ],
      },
    },
    typeId: e.COMPOUND_REPRESENTATION_ITEM,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION_ITEM,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.REPRESENTATION_ITEM,
    depth: 0,
    isAbstract: false,
    subTypes: [
       e.COMPOUND_REPRESENTATION_ITEM,
       e.MAPPED_ITEM,
       e.VALUE_REPRESENTATION_ITEM,
    ],
  },
  {
    fields: {
    },
    typeId: e.COMPOUND_SHAPE_REPRESENTATION,
    depth: 2,
    isAbstract: false,
    superType: e.SHAPE_REPRESENTATION,
  },
  {
    fields: {
      operands: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 0,
        type: e.STRING_EXPRESSION,
      },
    },
    typeId: e.CONCAT_EXPRESSION,
    depth: 3,
    isAbstract: false,
    superType: e.STRING_EXPRESSION,
  },
  {
    fields: {
    },
    typeId: e.STRING_EXPRESSION,
    depth: 2,
    isAbstract: true,
    superType: e.EXPRESSION,
    subTypes: [
       e.SIMPLE_STRING_EXPRESSION,
       e.INDEX_EXPRESSION,
       e.SUBSTRING_EXPRESSION,
       e.CONCAT_EXPRESSION,
       e.FORMAT_FUNCTION,
       e.STRING_DEFINED_FUNCTION,
    ],
  },
  {
    fields: {
      operands: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 0,
        type: e.GENERIC_EXPRESSION,
      },
    },
    typeId: e.MULTIPLE_ARITY_GENERIC_EXPRESSION,
    depth: 1,
    isAbstract: true,
    superType: e.GENERIC_EXPRESSION,
  },
  {
    fields: {
    },
    typeId: e.CONCENTRICITY_TOLERANCE,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_TOLERANCE_WITH_DATUM_REFERENCE,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
    },
    typeId: e.CONCEPT_FEATURE_OPERATOR,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
      relating_product_concept_feature: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.PRODUCT_CONCEPT_FEATURE,
      },
      related_product_concept_feature: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.PRODUCT_CONCEPT_FEATURE,
      },
    },
    typeId: e.CONCEPT_FEATURE_RELATIONSHIP,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      conditional_operator: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 4,
        type: e.CONCEPT_FEATURE_OPERATOR,
      },
    },
    typeId: e.CONCEPT_FEATURE_RELATIONSHIP_WITH_CONDITION,
    depth: 1,
    isAbstract: false,
    superType: e.CONCEPT_FEATURE_RELATIONSHIP,
  },
  {
    fields: {
      condition: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.CONCEPT_FEATURE_RELATIONSHIP_WITH_CONDITION,
      },
    },
    typeId: e.CONDITIONAL_CONCEPT_FEATURE,
    depth: 1,
    isAbstract: false,
    superType: e.PRODUCT_CONCEPT_FEATURE,
  },
  {
    fields: {
      id: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 2,
      },
    },
    typeId: e.PRODUCT_CONCEPT_FEATURE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      item_concept_feature: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 5,
        type: e.PRODUCT_CONCEPT_FEATURE_ASSOCIATION,
      },
    },
    typeId: e.CONFIGURABLE_ITEM,
    depth: 1,
    isAbstract: false,
    superType: e.CONFIGURATION_ITEM,
  },
  {
    fields: {
      id: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 2,
      },
      item_concept: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.PRODUCT_CONCEPT,
      },
      purpose: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 4,
      },
    },
    typeId: e.CONFIGURATION_ITEM,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      pair_values: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 0,
        type: e.PAIR_VALUE,
      },
      t_parameter: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PARAMETER_VALUE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MEASURE_WITH_UNIT,
          },
        ],
      },
    },
    typeId: e.CONFIGURATION_DEFINITION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      configuration: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.CONFIGURATION_ITEM,
      },
      design: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION,
          },
        ],
      },
      name: {
        kind: f.STRING,
        optional: false,
        derived: true,
      },
      description: {
        kind: f.STRING,
        optional: false,
        derived: true,
      },
    },
    typeId: e.CONFIGURATION_DESIGN,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      configuration: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.CONFIGURATION_DESIGN,
      },
    },
    typeId: e.CONFIGURATION_EFFECTIVITY,
    depth: 2,
    isAbstract: false,
    superType: e.PRODUCT_DEFINITION_EFFECTIVITY,
  },
  {
    fields: {
      usage: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.PRODUCT_DEFINITION_RELATIONSHIP,
      },
    },
    typeId: e.PRODUCT_DEFINITION_EFFECTIVITY,
    depth: 1,
    isAbstract: false,
    superType: e.EFFECTIVITY,
  },
  {
    fields: {
      previous_configuration_definition: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.CONFIGURATION_DEFINITION,
      },
      next_configuration_definition: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.CONFIGURATION_DEFINITION,
      },
      interpolation: {
        kind: f.ENUM,
        optional: false,
        derived: false,
        offset: 2,
        type: interpolation_type,
      },
    },
    typeId: e.CONFIGURATION_INTERPOLATION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      items: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PROCESS_PLAN,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_PROCESS_PLAN,
          },
        ],
      },
    },
    typeId: e.CONFIGURED_EFFECTIVITY_ASSIGNMENT,
    depth: 1,
    isAbstract: false,
    superType: e.EFFECTIVITY_ASSIGNMENT,
  },
  {
    fields: {
      items: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_ASSOCIATION,
          },
        ],
      },
    },
    typeId: e.CONFIGURED_EFFECTIVITY_CONTEXT_ASSIGNMENT,
    depth: 1,
    isAbstract: false,
    superType: e.EFFECTIVITY_CONTEXT_ASSIGNMENT,
  },
  {
    fields: {
      semi_axis_1: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
      semi_axis_2: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 3,
      },
    },
    typeId: e.ELLIPSE,
    depth: 4,
    isAbstract: false,
    superType: e.CONIC,
  },
  {
    fields: {
      semi_axis: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
      semi_imag_axis: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 3,
      },
    },
    typeId: e.HYPERBOLA,
    depth: 4,
    isAbstract: false,
    superType: e.CONIC,
  },
  {
    fields: {
      focal_dist: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
    },
    typeId: e.PARABOLA,
    depth: 4,
    isAbstract: false,
    superType: e.CONIC,
  },
  {
    fields: {
      radius: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
      semi_angle: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 3,
      },
    },
    typeId: e.CONICAL_SURFACE,
    depth: 4,
    isAbstract: false,
    superType: e.ELEMENTARY_SURFACE,
  },
  {
    fields: {
      position: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.AXIS2_PLACEMENT_3D,
      },
    },
    typeId: e.ELEMENTARY_SURFACE,
    depth: 3,
    isAbstract: false,
    superType: e.SURFACE,
    subTypes: [
       e.PLANE,
       e.CYLINDRICAL_SURFACE,
       e.CONICAL_SURFACE,
       e.SPHERICAL_SURFACE,
       e.TOROIDAL_SURFACE,
    ],
  },
  {
    fields: {
      ces_edges: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        type: e.EDGE,
      },
    },
    typeId: e.CONNECTED_EDGE_SET,
    depth: 2,
    isAbstract: false,
    superType: e.TOPOLOGICAL_REPRESENTATION_ITEM,
  },
  {
    fields: {
    },
    typeId: e.TOPOLOGICAL_REPRESENTATION_ITEM,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION_ITEM,
    subTypes: [
       e.VERTEX,
       e.EDGE,
       e.FACE_BOUND,
       e.FACE,
       e.CONNECTED_EDGE_SET,
       e.CONNECTED_FACE_SET,
       e.LOOP,
    ],
  },
  {
    fields: {
    },
    typeId: e.OPEN_SHELL,
    depth: 3,
    isAbstract: false,
    superType: e.CONNECTED_FACE_SET,
  },
  {
    fields: {
      parent_face_set: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.CONNECTED_FACE_SET,
      },
    },
    typeId: e.CONNECTED_FACE_SUB_SET,
    depth: 3,
    isAbstract: false,
    superType: e.CONNECTED_FACE_SET,
  },
  {
    fields: {
    },
    typeId: e.CONSTRUCTIVE_GEOMETRY_REPRESENTATION,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      items: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        type: e.REPRESENTATION_ITEM,
      },
      context_of_items: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.REPRESENTATION_CONTEXT,
      },
      id: {
        kind: f.STRING,
        optional: false,
        derived: true,
      },
      description: {
        kind: f.STRING,
        optional: false,
        derived: true,
      },
    },
    typeId: e.REPRESENTATION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.CONSTRUCTIVE_GEOMETRY_REPRESENTATION_RELATIONSHIP,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION_RELATIONSHIP,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
      rep_1: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.REPRESENTATION,
      },
      rep_2: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.REPRESENTATION,
      },
    },
    typeId: e.REPRESENTATION_RELATIONSHIP,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.CONTACT_RATIO_REPRESENTATION,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION,
  },
  {
    fields: {
      presentation_context: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRESENTATION_REPRESENTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRESENTATION_SET,
          },
        ],
      },
    },
    typeId: e.CONTEXT_DEPENDENT_INVISIBILITY,
    depth: 1,
    isAbstract: false,
    superType: e.INVISIBILITY,
  },
  {
    fields: {
      invisible_items: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 0,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DRAUGHTING_CALLOUT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRESENTATION_LAYER_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.REPRESENTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.STYLED_ITEM,
          },
        ],
      },
    },
    typeId: e.INVISIBILITY,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      style_context: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 4,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.GROUP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRESENTATION_LAYER_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRESENTATION_SET,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.REPRESENTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.REPRESENTATION_ITEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_REPRESENTATION_RELATIONSHIP,
          },
        ],
      },
    },
    typeId: e.CONTEXT_DEPENDENT_OVER_RIDING_STYLED_ITEM,
    depth: 3,
    isAbstract: false,
    superType: e.OVER_RIDING_STYLED_ITEM,
  },
  {
    fields: {
      over_ridden_style: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.STYLED_ITEM,
      },
    },
    typeId: e.OVER_RIDING_STYLED_ITEM,
    depth: 2,
    isAbstract: false,
    superType: e.STYLED_ITEM,
  },
  {
    fields: {
      representation_relation: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.SHAPE_REPRESENTATION_RELATIONSHIP,
      },
      represented_product_relation: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.PRODUCT_DEFINITION_SHAPE,
      },
      description: {
        kind: f.STRING,
        optional: false,
        derived: true,
      },
      name: {
        kind: f.STRING,
        optional: false,
        derived: true,
      },
    },
    typeId: e.CONTEXT_DEPENDENT_SHAPE_REPRESENTATION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
    },
    typeId: e.CONTEXT_DEPENDENT_UNIT,
    depth: 1,
    isAbstract: false,
    superType: e.NAMED_UNIT,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      purpose: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      kind: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.CONTRACT_TYPE,
      },
    },
    typeId: e.CONTRACT,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      description: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.CONTRACT_TYPE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      conversion_factor: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.MEASURE_WITH_UNIT,
      },
      dimensions: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: true,
        type: e.DIMENSIONAL_EXPONENTS,
      },
    },
    typeId: e.CONVERSION_BASED_UNIT,
    depth: 1,
    isAbstract: false,
    superType: e.NAMED_UNIT,
  },
  {
    fields: {
      hour_offset: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
      minute_offset: {
        kind: f.NUMBER,
        optional: true,
        derived: false,
        offset: 1,
      },
      sense: {
        kind: f.ENUM,
        optional: false,
        derived: false,
        offset: 2,
        type: ahead_or_behind,
      },
      actual_minute_offset: {
        kind: f.NUMBER,
        optional: false,
        derived: true,
      },
    },
    typeId: e.COORDINATED_UNIVERSAL_TIME_OFFSET,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.COS_FUNCTION,
    depth: 5,
    isAbstract: false,
    superType: e.UNARY_FUNCTION_CALL,
  },
  {
    fields: {
    },
    typeId: e.CSG_SHAPE_REPRESENTATION,
    depth: 2,
    isAbstract: false,
    superType: e.SHAPE_REPRESENTATION,
  },
  {
    fields: {
      tree_root_expression: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.BOOLEAN_RESULT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SPHERE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.BLOCK,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.RIGHT_ANGULAR_WEDGE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.TORUS,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.RIGHT_CIRCULAR_CONE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.RIGHT_CIRCULAR_CYLINDER,
          },
        ],
      },
    },
    typeId: e.CSG_SOLID,
    depth: 3,
    isAbstract: false,
    superType: e.SOLID_MODEL,
  },
  {
    fields: {
    },
    typeId: e.SOLID_MODEL,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_REPRESENTATION_ITEM,
    subTypes: [
       e.CSG_SOLID,
       e.MANIFOLD_SOLID_BREP,
       e.SWEPT_FACE_SOLID,
       e.SWEPT_AREA_SOLID,
       e.SWEPT_DISK_SOLID,
       e.SOLID_REPLICA,
    ],
  },
  {
    fields: {
      pnt: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.CARTESIAN_POINT,
      },
      dir: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.VECTOR,
      },
    },
    typeId: e.LINE,
    depth: 3,
    isAbstract: false,
    superType: e.CURVE,
  },
  {
    fields: {
      basis_curve: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.CURVE,
      },
      distance: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
      self_intersect: {
        kind: f.BOOLEAN,
        optional: false,
        derived: false,
        offset: 3,
      },
    },
    typeId: e.OFFSET_CURVE_2D,
    depth: 3,
    isAbstract: false,
    superType: e.CURVE,
  },
  {
    fields: {
      basis_curve: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.CURVE,
      },
      distance: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
      self_intersect: {
        kind: f.BOOLEAN,
        optional: false,
        derived: false,
        offset: 3,
      },
      ref_direction: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 4,
        type: e.DIRECTION,
      },
    },
    typeId: e.OFFSET_CURVE_3D,
    depth: 3,
    isAbstract: false,
    superType: e.CURVE,
  },
  {
    fields: {
      parent_curve: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.CURVE,
      },
      transformation: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.CARTESIAN_TRANSFORMATION_OPERATOR,
      },
    },
    typeId: e.CURVE_REPLICA,
    depth: 3,
    isAbstract: false,
    superType: e.CURVE,
  },
  {
    fields: {
    },
    typeId: e.CURVE_DIMENSION,
    depth: 4,
    isAbstract: false,
    superType: e.DIMENSION_CURVE_DIRECTED_CALLOUT,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      curve_font: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CURVE_STYLE_FONT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRE_DEFINED_CURVE_FONT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EXTERNALLY_DEFINED_CURVE_FONT,
          },
        ],
      },
      curve_width: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.POSITIVE_LENGTH_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MEASURE_WITH_UNIT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DESCRIPTIVE_MEASURE,
          },
        ],
      },
      curve_colour: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.COLOUR,
      },
    },
    typeId: e.CURVE_STYLE,
    depth: 1,
    isAbstract: false,
    superType: e.FOUNDED_ITEM,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      pattern_list: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        type: e.CURVE_STYLE_FONT_PATTERN,
      },
    },
    typeId: e.CURVE_STYLE_FONT,
    depth: 1,
    isAbstract: false,
    superType: e.FOUNDED_ITEM,
  },
  {
    fields: {
      visible_segment_length: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
      invisible_segment_length: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 1,
      },
    },
    typeId: e.CURVE_STYLE_FONT_PATTERN,
    depth: 1,
    isAbstract: false,
    superType: e.FOUNDED_ITEM,
  },
  {
    fields: {
      rendering_method: {
        kind: f.ENUM,
        optional: false,
        derived: false,
        offset: 0,
        type: shading_curve_method,
      },
      rendering_properties: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.SURFACE_RENDERING_PROPERTIES,
      },
    },
    typeId: e.CURVE_STYLE_RENDERING,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.CURVE_SWEPT_SOLID_SHAPE_REPRESENTATION,
    depth: 2,
    isAbstract: false,
    superType: e.SHAPE_REPRESENTATION,
  },
  {
    fields: {
    },
    typeId: e.CYLINDRICAL_PAIR,
    depth: 2,
    isAbstract: false,
    superType: e.KINEMATIC_PAIR,
  },
  {
    fields: {
      joint: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 4,
        type: e.KINEMATIC_JOINT,
      },
      pair_placement_in_first_link_context: {
        kind: f.SELECT,
        optional: false,
        derived: true,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.AXIS2_PLACEMENT_3D,
          },
        ],
      },
      pair_placement_in_second_link_context: {
        kind: f.SELECT,
        optional: false,
        derived: true,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.AXIS2_PLACEMENT_3D,
          },
        ],
      },
    },
    typeId: e.KINEMATIC_PAIR,
    depth: 1,
    isAbstract: false,
    superType: e.ITEM_DEFINED_TRANSFORMATION,
  },
  {
    fields: {
      applies_to_pair: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.CYLINDRICAL_PAIR,
      },
      lower_limit_actual_translation: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.LENGTH_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
      upper_limit_actual_translation: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 3,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.LENGTH_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
      lower_limit_actual_rotation: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 4,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
      upper_limit_actual_rotation: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 5,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
    },
    typeId: e.CYLINDRICAL_PAIR_RANGE,
    depth: 1,
    isAbstract: false,
    superType: e.SIMPLE_PAIR_RANGE,
  },
  {
    fields: {
      applies_to_pair: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.KINEMATIC_PAIR,
      },
    },
    typeId: e.SIMPLE_PAIR_RANGE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      applies_to_pair: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.CYLINDRICAL_PAIR,
      },
      actual_translation: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
      actual_rotation: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 3,
      },
    },
    typeId: e.CYLINDRICAL_PAIR_VALUE,
    depth: 1,
    isAbstract: false,
    superType: e.PAIR_VALUE,
  },
  {
    fields: {
      applies_to_pair: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.KINEMATIC_PAIR,
      },
    },
    typeId: e.PAIR_VALUE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      radius: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
    },
    typeId: e.CYLINDRICAL_SURFACE,
    depth: 4,
    isAbstract: false,
    superType: e.ELEMENTARY_SURFACE,
  },
  {
    fields: {
    },
    typeId: e.CYLINDRICITY_TOLERANCE,
    depth: 1,
    isAbstract: false,
    superType: e.GEOMETRIC_TOLERANCE,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      magnitude: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.MEASURE_WITH_UNIT,
      },
      toleranced_shape_aspect: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.SHAPE_ASPECT,
      },
    },
    typeId: e.GEOMETRIC_TOLERANCE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      elements: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 2,
        type: e.PROPERTY_DEFINITION_REPRESENTATION,
      },
    },
    typeId: e.DATA_ENVIRONMENT,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      date_component: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.DATE,
      },
      time_component: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.LOCAL_TIME,
      },
    },
    typeId: e.DATE_AND_TIME,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: false,
        derived: true,
      },
    },
    typeId: e.DATE_ROLE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: false,
        derived: true,
      },
    },
    typeId: e.DATE_TIME_ROLE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      effectivity_end_date: {
        kind: f.SELECT,
        optional: true,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DATE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DATE_AND_TIME,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.LOCAL_TIME,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EVENT_OCCURRENCE,
          },
        ],
      },
      effectivity_start_date: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DATE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DATE_AND_TIME,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.LOCAL_TIME,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EVENT_OCCURRENCE,
          },
        ],
      },
    },
    typeId: e.DATED_EFFECTIVITY,
    depth: 1,
    isAbstract: false,
    superType: e.EFFECTIVITY,
  },
  {
    fields: {
      id: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      name: {
        kind: f.STRING,
        optional: false,
        derived: true,
      },
      description: {
        kind: f.STRING,
        optional: false,
        derived: true,
      },
    },
    typeId: e.EFFECTIVITY,
    depth: 0,
    isAbstract: false,
    subTypes: [
       e.SERIAL_NUMBERED_EFFECTIVITY,
       e.DATED_EFFECTIVITY,
       e.LOT_EFFECTIVITY,
       e.TIME_INTERVAL_BASED_EFFECTIVITY,
    ],
  },
  {
    fields: {
      feature_basis_relationship: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 4,
        type: e.SHAPE_ASPECT_RELATIONSHIP,
      },
    },
    typeId: e.DATUM_FEATURE,
    depth: 1,
    isAbstract: false,
    superType: e.SHAPE_ASPECT,
  },
  {
    fields: {
    },
    typeId: e.DATUM_FEATURE_CALLOUT,
    depth: 3,
    isAbstract: false,
    superType: e.DRAUGHTING_CALLOUT,
  },
  {
    fields: {
      contents: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ANNOTATION_TEXT_OCCURRENCE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ANNOTATION_SYMBOL_OCCURRENCE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ANNOTATION_CURVE_OCCURRENCE,
          },
        ],
      },
    },
    typeId: e.DRAUGHTING_CALLOUT,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_REPRESENTATION_ITEM,
  },
  {
    fields: {
      precedence: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
      referenced_datum: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.DATUM,
      },
    },
    typeId: e.DATUM_REFERENCE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      target_id: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 4,
      },
      target_basis_relationship: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 5,
        type: e.SHAPE_ASPECT_RELATIONSHIP,
      },
    },
    typeId: e.DATUM_TARGET,
    depth: 1,
    isAbstract: false,
    superType: e.SHAPE_ASPECT,
  },
  {
    fields: {
    },
    typeId: e.DATUM_TARGET_CALLOUT,
    depth: 3,
    isAbstract: false,
    superType: e.DRAUGHTING_CALLOUT,
  },
  {
    fields: {
    },
    typeId: e.DEFAULT_TOLERANCE_TABLE,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION,
  },
  {
    fields: {
    },
    typeId: e.DEFAULT_TOLERANCE_TABLE_CELL,
    depth: 2,
    isAbstract: false,
    superType: e.COMPOUND_REPRESENTATION_ITEM,
  },
  {
    fields: {
      definition: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EXTERNALLY_DEFINED_CHARACTER_GLYPH,
          },
        ],
      },
      placement: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.AXIS2_PLACEMENT_2D,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.AXIS2_PLACEMENT_3D,
          },
        ],
      },
    },
    typeId: e.DEFINED_CHARACTER_GLYPH,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_REPRESENTATION_ITEM,
  },
  {
    fields: {
    },
    typeId: e.NUMERIC_DEFINED_FUNCTION,
    depth: 3,
    isAbstract: true,
    superType: e.NUMERIC_EXPRESSION,
    subTypes: [
       e.INTEGER_DEFINED_FUNCTION,
       e.REAL_DEFINED_FUNCTION,
    ],
  },
  {
    fields: {
    },
    typeId: e.STRING_DEFINED_FUNCTION,
    depth: 1,
    isAbstract: true,
    superType: e.DEFINED_FUNCTION,
  },
  {
    fields: {
      definition: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRE_DEFINED_SYMBOL,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EXTERNALLY_DEFINED_SYMBOL,
          },
        ],
      },
      target: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.SYMBOL_TARGET,
      },
    },
    typeId: e.DEFINED_SYMBOL,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_REPRESENTATION_ITEM,
  },
  {
    fields: {
    },
    typeId: e.DEFINITIONAL_REPRESENTATION,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION,
  },
  {
    fields: {
      basis_surface: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.SURFACE,
      },
      reference_to_curve: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.DEFINITIONAL_REPRESENTATION,
      },
    },
    typeId: e.DEGENERATE_PCURVE,
    depth: 3,
    isAbstract: false,
    superType: e.POINT,
  },
  {
    fields: {
      select_outer: {
        kind: f.BOOLEAN,
        optional: false,
        derived: false,
        offset: 4,
      },
    },
    typeId: e.DEGENERATE_TOROIDAL_SURFACE,
    depth: 5,
    isAbstract: false,
    superType: e.TOROIDAL_SURFACE,
  },
  {
    fields: {
      major_radius: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
      minor_radius: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 3,
      },
    },
    typeId: e.TOROIDAL_SURFACE,
    depth: 4,
    isAbstract: false,
    superType: e.ELEMENTARY_SURFACE,
  },
  {
    fields: {
    },
    typeId: e.GEOMETRIC_ALIGNMENT,
    depth: 2,
    isAbstract: false,
    superType: e.DERIVED_SHAPE_ASPECT,
  },
  {
    fields: {
    },
    typeId: e.GEOMETRIC_INTERSECTION,
    depth: 2,
    isAbstract: false,
    superType: e.DERIVED_SHAPE_ASPECT,
  },
  {
    fields: {
      offset: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 4,
        type: e.MEASURE_WITH_UNIT,
      },
    },
    typeId: e.PARALLEL_OFFSET,
    depth: 2,
    isAbstract: false,
    superType: e.DERIVED_SHAPE_ASPECT,
  },
  {
    fields: {
    },
    typeId: e.PERPENDICULAR_TO,
    depth: 2,
    isAbstract: false,
    superType: e.DERIVED_SHAPE_ASPECT,
  },
  {
    fields: {
    },
    typeId: e.EXTENSION,
    depth: 2,
    isAbstract: false,
    superType: e.DERIVED_SHAPE_ASPECT,
  },
  {
    fields: {
    },
    typeId: e.TANGENT,
    depth: 2,
    isAbstract: false,
    superType: e.DERIVED_SHAPE_ASPECT,
  },
  {
    fields: {
    },
    typeId: e.VOLUME_UNIT,
    depth: 1,
    isAbstract: false,
    superType: e.DERIVED_UNIT,
  },
  {
    fields: {
      unit: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.NAMED_UNIT,
      },
      exponent: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 1,
      },
    },
    typeId: e.DERIVED_UNIT_ELEMENT,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      associated_variable_environment: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.ENVIRONMENT,
      },
    },
    typeId: e.DERIVED_UNIT_VARIABLE,
    depth: 1,
    isAbstract: false,
    superType: e.DERIVED_UNIT,
  },
  {
    fields: {
    },
    typeId: e.VARIABLE_SEMANTICS,
    depth: 0,
    isAbstract: true,
  },
  {
    fields: {
      attribute_value: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      described_item: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_REQUEST_SOLUTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPLICATION_CONTEXT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPROVAL_ROLE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_DESIGN,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DATE_ROLE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DATE_TIME_ROLE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONTEXT_DEPENDENT_SHAPE_REPRESENTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EFFECTIVITY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EXTERNAL_SOURCE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ORGANIZATION_ROLE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PERSON_AND_ORGANIZATION_ROLE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PERSON_AND_ORGANIZATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PROPERTY_DEFINITION_REPRESENTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.REPRESENTATION,
          },
        ],
      },
    },
    typeId: e.DESCRIPTION_ATTRIBUTE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      description: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
    },
    typeId: e.DESCRIPTIVE_REPRESENTATION_ITEM,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION_ITEM,
  },
  {
    fields: {
    },
    typeId: e.DIAMETER_DIMENSION,
    depth: 4,
    isAbstract: false,
    superType: e.DIMENSION_CURVE_DIRECTED_CALLOUT,
  },
  {
    fields: {
    },
    typeId: e.DIMENSION_CALLOUT,
    depth: 3,
    isAbstract: false,
    superType: e.DRAUGHTING_CALLOUT,
  },
  {
    fields: {
    },
    typeId: e.DIMENSION_CALLOUT_COMPONENT_RELATIONSHIP,
    depth: 1,
    isAbstract: false,
    superType: e.DRAUGHTING_CALLOUT_RELATIONSHIP,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      relating_draughting_callout: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.DRAUGHTING_CALLOUT,
      },
      related_draughting_callout: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.DRAUGHTING_CALLOUT,
      },
    },
    typeId: e.DRAUGHTING_CALLOUT_RELATIONSHIP,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.DIMENSION_CALLOUT_RELATIONSHIP,
    depth: 1,
    isAbstract: false,
    superType: e.DRAUGHTING_CALLOUT_RELATIONSHIP,
  },
  {
    fields: {
    },
    typeId: e.DIMENSION_CURVE,
    depth: 4,
    isAbstract: false,
    superType: e.ANNOTATION_CURVE_OCCURRENCE,
  },
  {
    fields: {
      role: {
        kind: f.ENUM,
        optional: false,
        derived: false,
        offset: 5,
        type: dimension_extent_usage,
      },
    },
    typeId: e.DIMENSION_CURVE_TERMINATOR,
    depth: 5,
    isAbstract: false,
    superType: e.TERMINATOR_SYMBOL,
  },
  {
    fields: {
      annotated_curve: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 4,
        type: e.ANNOTATION_CURVE_OCCURRENCE,
      },
    },
    typeId: e.TERMINATOR_SYMBOL,
    depth: 4,
    isAbstract: false,
    superType: e.ANNOTATION_SYMBOL_OCCURRENCE,
  },
  {
    fields: {
    },
    typeId: e.DIMENSION_PAIR,
    depth: 1,
    isAbstract: false,
    superType: e.DRAUGHTING_CALLOUT_RELATIONSHIP,
  },
  {
    fields: {
      related_dimension: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.DIMENSIONAL_LOCATION,
      },
      related_element: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.TOLERANCE_ZONE_DEFINITION,
      },
    },
    typeId: e.DIMENSION_RELATED_TOLERANCE_ZONE_ELEMENT,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.DIMENSION_TEXT_ASSOCIATIVITY,
    depth: 3,
    isAbstract: false,
    superType: e.TEXT_LITERAL,
  },
  {
    fields: {
      literal: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      placement: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.AXIS2_PLACEMENT_2D,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.AXIS2_PLACEMENT_3D,
          },
        ],
      },
      alignment: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 3,
      },
      path: {
        kind: f.ENUM,
        optional: false,
        derived: false,
        offset: 4,
        type: text_path,
      },
      font: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 5,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRE_DEFINED_TEXT_FONT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EXTERNALLY_DEFINED_TEXT_FONT,
          },
        ],
      },
    },
    typeId: e.TEXT_LITERAL,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_REPRESENTATION_ITEM,
  },
  {
    fields: {
      dimension: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 0,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DIMENSIONAL_LOCATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DIMENSIONAL_SIZE,
          },
        ],
      },
      representation: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.SHAPE_DIMENSION_REPRESENTATION,
      },
    },
    typeId: e.DIMENSIONAL_CHARACTERISTIC_REPRESENTATION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      length_exponent: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
      mass_exponent: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 1,
      },
      time_exponent: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
      electric_current_exponent: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 3,
      },
      thermodynamic_temperature_exponent: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 4,
      },
      amount_of_substance_exponent: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 5,
      },
      luminous_intensity_exponent: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 6,
      },
    },
    typeId: e.DIMENSIONAL_EXPONENTS,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      path: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 4,
        type: e.SHAPE_ASPECT,
      },
    },
    typeId: e.DIMENSIONAL_LOCATION_WITH_PATH,
    depth: 2,
    isAbstract: false,
    superType: e.DIMENSIONAL_LOCATION,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
      relating_shape_aspect: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.SHAPE_ASPECT,
      },
      related_shape_aspect: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.SHAPE_ASPECT,
      },
      id: {
        kind: f.STRING,
        optional: false,
        derived: true,
      },
    },
    typeId: e.SHAPE_ASPECT_RELATIONSHIP,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      path: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.SHAPE_ASPECT,
      },
    },
    typeId: e.DIMENSIONAL_SIZE_WITH_PATH,
    depth: 1,
    isAbstract: false,
    superType: e.DIMENSIONAL_SIZE,
  },
  {
    fields: {
      directive: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.ACTION_DIRECTIVE,
      },
    },
    typeId: e.DIRECTED_ACTION,
    depth: 2,
    isAbstract: false,
    superType: e.EXECUTED_ACTION,
  },
  {
    fields: {
    },
    typeId: e.EXECUTED_ACTION,
    depth: 1,
    isAbstract: false,
    superType: e.ACTION,
  },
  {
    fields: {
    },
    typeId: e.DIRECTED_ANGLE,
    depth: 1,
    isAbstract: false,
    superType: e.SHAPE_ASPECT,
  },
  {
    fields: {
    },
    typeId: e.DIRECTED_DIMENSIONAL_LOCATION,
    depth: 2,
    isAbstract: false,
    superType: e.DIMENSIONAL_LOCATION,
  },
  {
    fields: {
      direction_ratios: {
        kind: f.NUMBER,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
      },
    },
    typeId: e.DIRECTION,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_REPRESENTATION_ITEM,
  },
  {
    fields: {
    },
    typeId: e.DIRECTION_SHAPE_REPRESENTATION,
    depth: 2,
    isAbstract: false,
    superType: e.SHAPE_REPRESENTATION,
  },
  {
    fields: {
      id: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 2,
      },
      kind: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.DOCUMENT_TYPE,
      },
      representation_types: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 4,
        type: e.DOCUMENT_REPRESENTATION_TYPE,
      },
    },
    typeId: e.DOCUMENT,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.DOCUMENT_FILE,
    depth: 1,
    isAbstract: false,
    superType: e.DOCUMENT,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
      relating_document: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.DOCUMENT,
      },
      related_product: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 3,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION,
          },
        ],
      },
    },
    typeId: e.DOCUMENT_PRODUCT_ASSOCIATION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.DOCUMENT_PRODUCT_EQUIVALENCE,
    depth: 1,
    isAbstract: false,
    superType: e.DOCUMENT_PRODUCT_ASSOCIATION,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
      relating_document: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.DOCUMENT,
      },
      related_document: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.DOCUMENT,
      },
    },
    typeId: e.DOCUMENT_RELATIONSHIP,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      represented_document: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.DOCUMENT,
      },
    },
    typeId: e.DOCUMENT_REPRESENTATION_TYPE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      product_data_type: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.DOCUMENT_TYPE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      source: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.DOCUMENT,
      },
      subject_element: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      subject_element_value: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 2,
      },
    },
    typeId: e.DOCUMENT_USAGE_CONSTRAINT,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
    },
    typeId: e.DOCUMENT_USAGE_ROLE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.DRAUGHTING_ANNOTATION_OCCURRENCE,
    depth: 3,
    isAbstract: false,
    superType: e.ANNOTATION_OCCURRENCE,
  },
  {
    fields: {
    },
    typeId: e.DRAUGHTING_ELEMENTS,
    depth: 3,
    isAbstract: false,
    superType: e.DRAUGHTING_CALLOUT,
  },
  {
    fields: {
    },
    typeId: e.DRAUGHTING_MODEL,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION,
  },
  {
    fields: {
      definition: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 5,
        type: e.SHAPE_ASPECT,
      },
      used_representation: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 6,
        type: e.DRAUGHTING_MODEL,
      },
      identified_item: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 7,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ANNOTATION_OCCURRENCE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DRAUGHTING_CALLOUT,
          },
        ],
      },
    },
    typeId: e.DRAUGHTING_MODEL_ITEM_ASSOCIATION,
    depth: 1,
    isAbstract: false,
    superType: e.ITEM_IDENTIFIED_REPRESENTATION_USAGE,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
      definition: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.GENERAL_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PROPERTY_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PROPERTY_DEFINITION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_ASPECT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_ASPECT_RELATIONSHIP,
          },
        ],
      },
      used_representation: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.REPRESENTATION,
      },
      identified_item: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 4,
        type: e.REPRESENTATION_ITEM,
      },
    },
    typeId: e.ITEM_IDENTIFIED_REPRESENTATION_USAGE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.DRAUGHTING_PRE_DEFINED_COLOUR,
    depth: 2,
    isAbstract: false,
    superType: e.PRE_DEFINED_COLOUR,
  },
  {
    fields: {
    },
    typeId: e.PRE_DEFINED_COLOUR,
    depth: 1,
    isAbstract: false,
    superType: e.PRE_DEFINED_ITEM,
  },
  {
    fields: {
    },
    typeId: e.DRAUGHTING_PRE_DEFINED_CURVE_FONT,
    depth: 2,
    isAbstract: false,
    superType: e.PRE_DEFINED_CURVE_FONT,
  },
  {
    fields: {
    },
    typeId: e.PRE_DEFINED_CURVE_FONT,
    depth: 1,
    isAbstract: false,
    superType: e.PRE_DEFINED_ITEM,
  },
  {
    fields: {
    },
    typeId: e.DRAUGHTING_PRE_DEFINED_TEXT_FONT,
    depth: 2,
    isAbstract: false,
    superType: e.PRE_DEFINED_TEXT_FONT,
  },
  {
    fields: {
    },
    typeId: e.PRE_DEFINED_TEXT_FONT,
    depth: 1,
    isAbstract: false,
    superType: e.PRE_DEFINED_ITEM,
  },
  {
    fields: {
      specified_items: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DRAWING_REVISION,
          },
        ],
      },
    },
    typeId: e.DRAUGHTING_SPECIFICATION_REFERENCE,
    depth: 1,
    isAbstract: false,
    superType: e.DOCUMENT_REFERENCE,
  },
  {
    fields: {
    },
    typeId: e.DRAUGHTING_SUBFIGURE_REPRESENTATION,
    depth: 2,
    isAbstract: false,
    superType: e.SYMBOL_REPRESENTATION,
  },
  {
    fields: {
    },
    typeId: e.SYMBOL_REPRESENTATION,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION,
  },
  {
    fields: {
    },
    typeId: e.DRAUGHTING_SYMBOL_REPRESENTATION,
    depth: 2,
    isAbstract: false,
    superType: e.SYMBOL_REPRESENTATION,
  },
  {
    fields: {
    },
    typeId: e.DRAUGHTING_TEXT_LITERAL_WITH_DELINEATION,
    depth: 4,
    isAbstract: false,
    superType: e.TEXT_LITERAL_WITH_DELINEATION,
  },
  {
    fields: {
      delineation: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 6,
      },
    },
    typeId: e.TEXT_LITERAL_WITH_DELINEATION,
    depth: 3,
    isAbstract: false,
    superType: e.TEXT_LITERAL,
  },
  {
    fields: {
      items: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 0,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DRAWING_REVISION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DRAWING_SHEET_REVISION,
          },
        ],
      },
      language: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      contents: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 2,
      },
    },
    typeId: e.DRAUGHTING_TITLE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      drawing_number: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      drawing_type: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
    },
    typeId: e.DRAWING_DEFINITION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      revision_identifier: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      drawing_identifier: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.DRAWING_DEFINITION,
      },
      intended_scale: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 2,
      },
    },
    typeId: e.DRAWING_REVISION,
    depth: 1,
    isAbstract: false,
    superType: e.PRESENTATION_SET,
  },
  {
    fields: {
      areas: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 0,
        type: e.AREA_IN_SET,
      },
    },
    typeId: e.PRESENTATION_SET,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      predecessor: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.DRAWING_REVISION,
      },
      successor: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.DRAWING_REVISION,
      },
    },
    typeId: e.DRAWING_REVISION_SEQUENCE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.DRAWING_SHEET_LAYOUT,
    depth: 3,
    isAbstract: false,
    superType: e.DRAUGHTING_SYMBOL_REPRESENTATION,
  },
  {
    fields: {
      revision_identifier: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 4,
      },
    },
    typeId: e.DRAWING_SHEET_REVISION,
    depth: 3,
    isAbstract: false,
    superType: e.PRESENTATION_AREA,
  },
  {
    fields: {
    },
    typeId: e.PRESENTATION_AREA,
    depth: 2,
    isAbstract: false,
    superType: e.PRESENTATION_REPRESENTATION,
  },
  {
    fields: {
      sheet_number: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 2,
      },
    },
    typeId: e.DRAWING_SHEET_REVISION_USAGE,
    depth: 1,
    isAbstract: false,
    superType: e.AREA_IN_SET,
  },
  {
    fields: {
      edge_start: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.VERTEX,
      },
      edge_end: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.VERTEX,
      },
    },
    typeId: e.EDGE,
    depth: 2,
    isAbstract: false,
    superType: e.TOPOLOGICAL_REPRESENTATION_ITEM,
    subTypes: [
       e.EDGE_CURVE,
       e.ORIENTED_EDGE,
       e.SUBEDGE,
    ],
  },
  {
    fields: {
      edge_geometry: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.CURVE,
      },
      same_sense: {
        kind: f.BOOLEAN,
        optional: false,
        derived: false,
        offset: 4,
      },
    },
    typeId: e.EDGE_CURVE,
    depth: 3,
    isAbstract: false,
    superType: e.EDGE,
  },
  {
    fields: {
      edge_element: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.EDGE,
      },
      orientation: {
        kind: f.BOOLEAN,
        optional: false,
        derived: false,
        offset: 4,
      },
      edge_start: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: true,
        type: e.VERTEX,
      },
      edge_end: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: true,
        type: e.VERTEX,
      },
    },
    typeId: e.ORIENTED_EDGE,
    depth: 3,
    isAbstract: false,
    superType: e.EDGE,
  },
  {
    fields: {
      parent_edge: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.EDGE,
      },
    },
    typeId: e.SUBEDGE,
    depth: 3,
    isAbstract: false,
    superType: e.EDGE,
  },
  {
    fields: {
      ebwm_boundary: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        type: e.CONNECTED_EDGE_SET,
      },
    },
    typeId: e.EDGE_BASED_WIREFRAME_MODEL,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_REPRESENTATION_ITEM,
  },
  {
    fields: {
    },
    typeId: e.EDGE_BASED_WIREFRAME_SHAPE_REPRESENTATION,
    depth: 2,
    isAbstract: false,
    superType: e.SHAPE_REPRESENTATION,
  },
  {
    fields: {
      ne: {
        kind: f.NUMBER,
        optional: false,
        derived: true,
      },
    },
    typeId: e.EDGE_LOOP,
    depth: 3,
    isAbstract: false,
    superType: e.LOOP,
  },
  {
    fields: {
    },
    typeId: e.LOOP,
    depth: 2,
    isAbstract: false,
    superType: e.TOPOLOGICAL_REPRESENTATION_ITEM,
    subTypes: [
       e.VERTEX_LOOP,
       e.EDGE_LOOP,
       e.POLY_LOOP,
    ],
  },
  {
    fields: {
      edge_list: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        type: e.ORIENTED_EDGE,
      },
    },
    typeId: e.PATH,
    depth: 2,
    isAbstract: false,
    superType: e.TOPOLOGICAL_REPRESENTATION_ITEM,
    subTypes: [
       e.EDGE_LOOP,
       e.ORIENTED_PATH,
    ],
  },
  {
    fields: {
    },
    typeId: e.EDGE_ROUND,
    depth: 2,
    isAbstract: false,
    superType: e.TRANSITION_FEATURE,
  },
  {
    fields: {
      effectivity_start_id: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      effectivity_end_id: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 2,
      },
    },
    typeId: e.SERIAL_NUMBERED_EFFECTIVITY,
    depth: 1,
    isAbstract: false,
    superType: e.EFFECTIVITY,
  },
  {
    fields: {
      effectivity_lot_id: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      effectivity_lot_size: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.MEASURE_WITH_UNIT,
      },
    },
    typeId: e.LOT_EFFECTIVITY,
    depth: 1,
    isAbstract: false,
    superType: e.EFFECTIVITY,
  },
  {
    fields: {
      effectivity_period: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.TIME_INTERVAL,
      },
    },
    typeId: e.TIME_INTERVAL_BASED_EFFECTIVITY,
    depth: 1,
    isAbstract: false,
    superType: e.EFFECTIVITY,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
    },
    typeId: e.EFFECTIVITY_CONTEXT_ROLE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
      related_effectivity: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.EFFECTIVITY,
      },
      relating_effectivity: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.EFFECTIVITY,
      },
    },
    typeId: e.EFFECTIVITY_RELATIONSHIP,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.ELECTRIC_CURRENT_MEASURE_WITH_UNIT,
    depth: 1,
    isAbstract: false,
    superType: e.MEASURE_WITH_UNIT,
  },
  {
    fields: {
    },
    typeId: e.ELECTRIC_CURRENT_UNIT,
    depth: 1,
    isAbstract: false,
    superType: e.NAMED_UNIT,
  },
  {
    fields: {
    },
    typeId: e.ELEMENT_DELIVERY,
    depth: 1,
    isAbstract: false,
    superType: e.ACTION,
  },
  {
    fields: {
    },
    typeId: e.PLANE,
    depth: 4,
    isAbstract: false,
    superType: e.ELEMENTARY_SURFACE,
  },
  {
    fields: {
      radius: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
    },
    typeId: e.SPHERICAL_SURFACE,
    depth: 4,
    isAbstract: false,
    superType: e.ELEMENTARY_SURFACE,
  },
  {
    fields: {
      syntactic_representation: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.GENERIC_VARIABLE,
      },
      semantics: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.VARIABLE_SEMANTICS,
      },
    },
    typeId: e.ENVIRONMENT,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      equivalent_point: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.CARTESIAN_POINT,
      },
    },
    typeId: e.EVALUATED_DEGENERATE_PCURVE,
    depth: 4,
    isAbstract: false,
    superType: e.DEGENERATE_PCURVE,
  },
  {
    fields: {
      id: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 2,
      },
    },
    typeId: e.EVENT_OCCURRENCE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      assigned_event_occurrence_assignment: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.EVENT_OCCURRENCE_ASSIGNMENT,
      },
      role: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.EVENT_OCCURRENCE_CONTEXT_ROLE,
      },
    },
    typeId: e.EVENT_OCCURRENCE_CONTEXT_ASSIGNMENT,
    depth: 0,
    isAbstract: true,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
    },
    typeId: e.EVENT_OCCURRENCE_CONTEXT_ROLE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
    },
    typeId: e.EVENT_OCCURRENCE_ROLE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.EXCLUSIVE_PRODUCT_CONCEPT_FEATURE_CATEGORY,
    depth: 2,
    isAbstract: false,
    superType: e.PRODUCT_CONCEPT_FEATURE_CATEGORY,
  },
  {
    fields: {
    },
    typeId: e.PRODUCT_CONCEPT_FEATURE_CATEGORY,
    depth: 1,
    isAbstract: false,
    superType: e.GROUP,
  },
  {
    fields: {
    },
    typeId: e.EXP_FUNCTION,
    depth: 5,
    isAbstract: false,
    superType: e.UNARY_FUNCTION_CALL,
  },
  {
    fields: {
      associated_variable_environment: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.ENVIRONMENT,
      },
    },
    typeId: e.EXPRESSION_CONVERSION_BASED_UNIT,
    depth: 2,
    isAbstract: false,
    superType: e.CONTEXT_DEPENDENT_UNIT,
  },
  {
    fields: {
      source_id: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 0,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.IDENTIFIER,
          },
        ],
      },
      description: {
        kind: f.STRING,
        optional: false,
        derived: true,
      },
    },
    typeId: e.EXTERNAL_SOURCE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.EXTERNALLY_DEFINED_CHARACTER_GLYPH,
    depth: 1,
    isAbstract: false,
    superType: e.EXTERNALLY_DEFINED_ITEM,
  },
  {
    fields: {
      item_id: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 0,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.IDENTIFIER,
          },
        ],
      },
      source: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.EXTERNAL_SOURCE,
      },
    },
    typeId: e.EXTERNALLY_DEFINED_ITEM,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.EXTERNALLY_DEFINED_CLASS,
    depth: 2,
    isAbstract: false,
    superType: e.CLASS_,
  },
  {
    fields: {
    },
    typeId: e.EXTERNALLY_DEFINED_CURVE_FONT,
    depth: 1,
    isAbstract: false,
    superType: e.EXTERNALLY_DEFINED_ITEM,
  },
  {
    fields: {
    },
    typeId: e.EXTERNALLY_DEFINED_DIMENSION_DEFINITION,
    depth: 1,
    isAbstract: false,
    superType: e.DIMENSIONAL_SIZE,
  },
  {
    fields: {
    },
    typeId: e.EXTERNALLY_DEFINED_FEATURE_DEFINITION,
    depth: 2,
    isAbstract: false,
    superType: e.FEATURE_DEFINITION,
  },
  {
    fields: {
    },
    typeId: e.EXTERNALLY_DEFINED_GENERAL_PROPERTY,
    depth: 1,
    isAbstract: false,
    superType: e.GENERAL_PROPERTY,
  },
  {
    fields: {
      id: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 2,
      },
    },
    typeId: e.GENERAL_PROPERTY,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.EXTERNALLY_DEFINED_HATCH_STYLE,
    depth: 1,
    isAbstract: false,
    superType: e.EXTERNALLY_DEFINED_ITEM,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
      relating_item: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.EXTERNALLY_DEFINED_ITEM,
      },
      related_item: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.EXTERNALLY_DEFINED_ITEM,
      },
    },
    typeId: e.EXTERNALLY_DEFINED_ITEM_RELATIONSHIP,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.EXTERNALLY_DEFINED_STYLE,
    depth: 1,
    isAbstract: false,
    superType: e.EXTERNALLY_DEFINED_ITEM,
  },
  {
    fields: {
    },
    typeId: e.EXTERNALLY_DEFINED_SYMBOL,
    depth: 1,
    isAbstract: false,
    superType: e.EXTERNALLY_DEFINED_ITEM,
  },
  {
    fields: {
    },
    typeId: e.EXTERNALLY_DEFINED_TEXT_FONT,
    depth: 1,
    isAbstract: false,
    superType: e.EXTERNALLY_DEFINED_ITEM,
  },
  {
    fields: {
    },
    typeId: e.EXTERNALLY_DEFINED_TILE_STYLE,
    depth: 1,
    isAbstract: false,
    superType: e.EXTERNALLY_DEFINED_ITEM,
  },
  {
    fields: {
      extruded_direction: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.DIRECTION,
      },
      depth: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 3,
      },
    },
    typeId: e.EXTRUDED_AREA_SOLID,
    depth: 4,
    isAbstract: false,
    superType: e.SWEPT_AREA_SOLID,
  },
  {
    fields: {
      swept_area: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.CURVE_BOUNDED_SURFACE,
      },
    },
    typeId: e.SWEPT_AREA_SOLID,
    depth: 3,
    isAbstract: false,
    superType: e.SOLID_MODEL,
    subTypes: [
       e.REVOLVED_AREA_SOLID,
       e.EXTRUDED_AREA_SOLID,
       e.SURFACE_CURVE_SWEPT_AREA_SOLID,
    ],
  },
  {
    fields: {
      extruded_direction: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.DIRECTION,
      },
      depth: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 3,
      },
    },
    typeId: e.EXTRUDED_FACE_SOLID,
    depth: 4,
    isAbstract: false,
    superType: e.SWEPT_FACE_SOLID,
  },
  {
    fields: {
      swept_face: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.FACE_SURFACE,
      },
    },
    typeId: e.SWEPT_FACE_SOLID,
    depth: 3,
    isAbstract: false,
    superType: e.SOLID_MODEL,
    subTypes: [
       e.EXTRUDED_FACE_SOLID,
       e.REVOLVED_FACE_SOLID,
    ],
  },
  {
    fields: {
      bounds: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        type: e.FACE_BOUND,
      },
    },
    typeId: e.FACE,
    depth: 2,
    isAbstract: false,
    superType: e.TOPOLOGICAL_REPRESENTATION_ITEM,
    subTypes: [
       e.FACE_SURFACE,
       e.SUBFACE,
       e.ORIENTED_FACE,
    ],
  },
  {
    fields: {
      parent_face: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.FACE,
      },
    },
    typeId: e.SUBFACE,
    depth: 3,
    isAbstract: false,
    superType: e.FACE,
  },
  {
    fields: {
      face_element: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.FACE,
      },
      orientation: {
        kind: f.BOOLEAN,
        optional: false,
        derived: false,
        offset: 3,
      },
      bounds: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: true,
        type: e.FACE_BOUND,
      },
    },
    typeId: e.ORIENTED_FACE,
    depth: 3,
    isAbstract: false,
    superType: e.FACE,
  },
  {
    fields: {
      fbsm_faces: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        type: e.CONNECTED_FACE_SET,
      },
    },
    typeId: e.FACE_BASED_SURFACE_MODEL,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_REPRESENTATION_ITEM,
  },
  {
    fields: {
      bound: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.LOOP,
      },
      orientation: {
        kind: f.BOOLEAN,
        optional: false,
        derived: false,
        offset: 2,
      },
    },
    typeId: e.FACE_BOUND,
    depth: 2,
    isAbstract: false,
    superType: e.TOPOLOGICAL_REPRESENTATION_ITEM,
  },
  {
    fields: {
    },
    typeId: e.FACE_OUTER_BOUND,
    depth: 3,
    isAbstract: false,
    superType: e.FACE_BOUND,
  },
  {
    fields: {
    },
    typeId: e.FACE_SHAPE_REPRESENTATION,
    depth: 2,
    isAbstract: false,
    superType: e.SHAPE_REPRESENTATION,
  },
  {
    fields: {
    },
    typeId: e.FACETED_BREP,
    depth: 4,
    isAbstract: false,
    superType: e.MANIFOLD_SOLID_BREP,
  },
  {
    fields: {
    },
    typeId: e.FACETED_BREP_SHAPE_REPRESENTATION,
    depth: 2,
    isAbstract: false,
    superType: e.SHAPE_REPRESENTATION,
  },
  {
    fields: {
    },
    typeId: e.FEATURE_COMPONENT_DEFINITION,
    depth: 1,
    isAbstract: false,
    superType: e.CHARACTERIZED_OBJECT,
  },
  {
    fields: {
    },
    typeId: e.FEATURE_COMPONENT_RELATIONSHIP,
    depth: 1,
    isAbstract: false,
    superType: e.SHAPE_ASPECT_RELATIONSHIP,
  },
  {
    fields: {
    },
    typeId: e.FEATURE_IN_PANEL,
    depth: 2,
    isAbstract: false,
    superType: e.FEATURE_DEFINITION,
  },
  {
    fields: {
    },
    typeId: e.FEATURE_PATTERN,
    depth: 3,
    isAbstract: false,
    superType: e.REPLICATE_FEATURE,
  },
  {
    fields: {
    },
    typeId: e.FEATURED_SHAPE,
    depth: 2,
    isAbstract: false,
    superType: e.PRODUCT_DEFINITION_SHAPE,
  },
  {
    fields: {
    },
    typeId: e.PRODUCT_DEFINITION_SHAPE,
    depth: 1,
    isAbstract: false,
    superType: e.PROPERTY_DEFINITION,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      fill_styles: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.FILL_AREA_STYLE_COLOUR,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EXTERNALLY_DEFINED_TILE_STYLE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.FILL_AREA_STYLE_TILES,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EXTERNALLY_DEFINED_HATCH_STYLE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.FILL_AREA_STYLE_HATCHING,
          },
        ],
      },
    },
    typeId: e.FILL_AREA_STYLE,
    depth: 1,
    isAbstract: false,
    superType: e.FOUNDED_ITEM,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      fill_colour: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.COLOUR,
      },
    },
    typeId: e.FILL_AREA_STYLE_COLOUR,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      hatch_line_appearance: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.CURVE_STYLE,
      },
      start_of_next_hatch_line: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.ONE_DIRECTION_REPEAT_FACTOR,
      },
      point_of_reference_hatch_line: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.CARTESIAN_POINT,
      },
      pattern_start: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 4,
        type: e.CARTESIAN_POINT,
      },
      hatch_line_angle: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 5,
      },
    },
    typeId: e.FILL_AREA_STYLE_HATCHING,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_REPRESENTATION_ITEM,
  },
  {
    fields: {
      symbol: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.ANNOTATION_SYMBOL_OCCURRENCE,
      },
    },
    typeId: e.FILL_AREA_STYLE_TILE_SYMBOL_WITH_STYLE,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_REPRESENTATION_ITEM,
  },
  {
    fields: {
      tiling_pattern: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.TWO_DIRECTION_REPEAT_FACTOR,
      },
      tiles: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.FILL_AREA_STYLE_TILE_SYMBOL_WITH_STYLE,
          },
        ],
      },
      tiling_scale: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 3,
      },
    },
    typeId: e.FILL_AREA_STYLE_TILES,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_REPRESENTATION_ITEM,
  },
  {
    fields: {
    },
    typeId: e.FILLET,
    depth: 2,
    isAbstract: false,
    superType: e.TRANSITION_FEATURE,
  },
  {
    fields: {
    },
    typeId: e.FLATNESS_TOLERANCE,
    depth: 1,
    isAbstract: false,
    superType: e.GEOMETRIC_TOLERANCE,
  },
  {
    fields: {
      value_to_format: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: true,
        type: e.GENERIC_EXPRESSION,
      },
      format_string: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: true,
        type: e.GENERIC_EXPRESSION,
      },
    },
    typeId: e.FORMAT_FUNCTION,
    depth: 3,
    isAbstract: false,
    superType: e.STRING_EXPRESSION,
  },
  {
    fields: {
      items: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 3,
        type: e.KINEMATIC_PATH,
      },
      context_of_items: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 4,
        type: e.GEOMETRIC_REPRESENTATION_CONTEXT,
      },
      paths: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: true,
        type: e.KINEMATIC_PATH,
      },
      founding: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: true,
        type: e.GEOMETRIC_REPRESENTATION_CONTEXT,
      },
    },
    typeId: e.FOUNDED_KINEMATIC_PATH,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION,
  },
  {
    fields: {
    },
    typeId: e.FULLY_CONSTRAINED_PAIR,
    depth: 2,
    isAbstract: false,
    superType: e.KINEMATIC_PAIR,
  },
  {
    fields: {
      radius_first_link: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 5,
      },
      radius_second_link: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 6,
      },
      bevel: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 7,
      },
      helical_angle: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 8,
      },
      gear_ratio: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 9,
      },
    },
    typeId: e.GEAR_PAIR,
    depth: 2,
    isAbstract: false,
    superType: e.KINEMATIC_PAIR,
  },
  {
    fields: {
      applies_to_pair: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.GEAR_PAIR,
      },
      lower_limit_actual_rotation_1: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
      upper_limit_actual_rotation_1: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 3,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
    },
    typeId: e.GEAR_PAIR_RANGE,
    depth: 1,
    isAbstract: false,
    superType: e.SIMPLE_PAIR_RANGE,
  },
  {
    fields: {
      applies_to_pair: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.GEAR_PAIR,
      },
      actual_rotation_1: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
      actual_rotation_2: {
        kind: f.NUMBER,
        optional: false,
        derived: true,
      },
    },
    typeId: e.GEAR_PAIR_VALUE,
    depth: 1,
    isAbstract: false,
    superType: e.PAIR_VALUE,
  },
  {
    fields: {
    },
    typeId: e.GENERAL_FEATURE,
    depth: 2,
    isAbstract: false,
    superType: e.FEATURE_DEFINITION,
  },
  {
    fields: {
    },
    typeId: e.GENERAL_MATERIAL_PROPERTY,
    depth: 1,
    isAbstract: false,
    superType: e.GENERAL_PROPERTY,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
      base_definition: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.GENERAL_PROPERTY,
      },
      derived_definition: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 3,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PROPERTY_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.RESOURCE_PROPERTY,
          },
        ],
      },
    },
    typeId: e.GENERAL_PROPERTY_ASSOCIATION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
      relating_property: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.GENERAL_PROPERTY,
      },
      related_property: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.GENERAL_PROPERTY,
      },
    },
    typeId: e.GENERAL_PROPERTY_RELATIONSHIP,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.SIMPLE_GENERIC_EXPRESSION,
    depth: 1,
    isAbstract: true,
    superType: e.GENERIC_EXPRESSION,
    subTypes: [
       e.GENERIC_LITERAL,
       e.GENERIC_VARIABLE,
    ],
  },
  {
    fields: {
      operand: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.GENERIC_EXPRESSION,
      },
    },
    typeId: e.UNARY_GENERIC_EXPRESSION,
    depth: 1,
    isAbstract: true,
    superType: e.GENERIC_EXPRESSION,
  },
  {
    fields: {
      interpretation: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.ENVIRONMENT,
      },
    },
    typeId: e.GENERIC_VARIABLE,
    depth: 2,
    isAbstract: true,
    superType: e.SIMPLE_GENERIC_EXPRESSION,
  },
  {
    fields: {
    },
    typeId: e.GEOMETRIC_CURVE_SET,
    depth: 3,
    isAbstract: false,
    superType: e.GEOMETRIC_SET,
  },
  {
    fields: {
      elements: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.POINT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CURVE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SURFACE,
          },
        ],
      },
    },
    typeId: e.GEOMETRIC_SET,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_REPRESENTATION_ITEM,
  },
  {
    fields: {
      definition: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 5,
        type: e.SHAPE_ASPECT,
      },
      used_representation: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 6,
        type: e.SHAPE_REPRESENTATION,
      },
      identified_item: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 7,
        type: e.GEOMETRIC_REPRESENTATION_ITEM,
      },
    },
    typeId: e.GEOMETRIC_ITEM_SPECIFIC_USAGE,
    depth: 1,
    isAbstract: false,
    superType: e.ITEM_IDENTIFIED_REPRESENTATION_USAGE,
  },
  {
    fields: {
      coordinate_space_dimension: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
    },
    typeId: e.GEOMETRIC_REPRESENTATION_CONTEXT,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION_CONTEXT,
  },
  {
    fields: {
      context_identifier: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      context_type: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      representations_in_context: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 2,
        type: e.REPRESENTATION,
      },
    },
    typeId: e.REPRESENTATION_CONTEXT,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      orientation: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.DIRECTION,
      },
      magnitude: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
    },
    typeId: e.VECTOR,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_REPRESENTATION_ITEM,
  },
  {
    fields: {
      polygon: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        type: e.CARTESIAN_POINT,
      },
    },
    typeId: e.POLY_LOOP,
    depth: 3,
    isAbstract: false,
    superType: e.LOOP,
  },
  {
    fields: {
      vertex_geometry: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.POINT,
      },
    },
    typeId: e.VERTEX_POINT,
    depth: 3,
    isAbstract: false,
    superType: e.VERTEX,
  },
  {
    fields: {
      radius: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 1,
      },
      centre: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.POINT,
      },
    },
    typeId: e.SPHERE,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_REPRESENTATION_ITEM,
  },
  {
    fields: {
      position: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.AXIS1_PLACEMENT,
      },
      height: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
      radius: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 3,
      },
      semi_angle: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 4,
      },
    },
    typeId: e.RIGHT_CIRCULAR_CONE,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_REPRESENTATION_ITEM,
  },
  {
    fields: {
      position: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.AXIS1_PLACEMENT,
      },
      height: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
      radius: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 3,
      },
    },
    typeId: e.RIGHT_CIRCULAR_CYLINDER,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_REPRESENTATION_ITEM,
  },
  {
    fields: {
      position: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.AXIS1_PLACEMENT,
      },
      major_radius: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
      minor_radius: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 3,
      },
    },
    typeId: e.TORUS,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_REPRESENTATION_ITEM,
  },
  {
    fields: {
      position: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.AXIS2_PLACEMENT_3D,
      },
      x: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
      y: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 3,
      },
      z: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 4,
      },
      ltx: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 5,
      },
    },
    typeId: e.RIGHT_ANGULAR_WEDGE,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_REPRESENTATION_ITEM,
  },
  {
    fields: {
      sbsm_boundary: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.OPEN_SHELL,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CLOSED_SHELL,
          },
        ],
      },
    },
    typeId: e.SHELL_BASED_SURFACE_MODEL,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_REPRESENTATION_ITEM,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      relating_geometric_tolerance: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.GEOMETRIC_TOLERANCE,
      },
      related_geometric_tolerance: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.GEOMETRIC_TOLERANCE,
      },
    },
    typeId: e.GEOMETRIC_TOLERANCE_RELATIONSHIP,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      unit_size: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 4,
        type: e.MEASURE_WITH_UNIT,
      },
    },
    typeId: e.GEOMETRIC_TOLERANCE_WITH_DEFINED_UNIT,
    depth: 1,
    isAbstract: false,
    superType: e.GEOMETRIC_TOLERANCE,
  },
  {
    fields: {
    },
    typeId: e.GEOMETRICAL_TOLERANCE_CALLOUT,
    depth: 3,
    isAbstract: false,
    superType: e.DRAUGHTING_CALLOUT,
  },
  {
    fields: {
    },
    typeId: e.GEOMETRICALLY_BOUNDED_2D_WIREFRAME_REPRESENTATION,
    depth: 2,
    isAbstract: false,
    superType: e.SHAPE_REPRESENTATION,
  },
  {
    fields: {
    },
    typeId: e.GEOMETRICALLY_BOUNDED_SURFACE_SHAPE_REPRESENTATION,
    depth: 2,
    isAbstract: false,
    superType: e.SHAPE_REPRESENTATION,
  },
  {
    fields: {
    },
    typeId: e.GEOMETRICALLY_BOUNDED_WIREFRAME_SHAPE_REPRESENTATION,
    depth: 2,
    isAbstract: false,
    superType: e.SHAPE_REPRESENTATION,
  },
  {
    fields: {
      uncertainty: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 2,
        type: e.UNCERTAINTY_MEASURE_WITH_UNIT,
      },
    },
    typeId: e.GLOBAL_UNCERTAINTY_ASSIGNED_CONTEXT,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION_CONTEXT,
  },
  {
    fields: {
      units: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DERIVED_UNIT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.NAMED_UNIT,
          },
        ],
      },
    },
    typeId: e.GLOBAL_UNIT_ASSIGNED_CONTEXT,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION_CONTEXT,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
      relating_group: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.GROUP,
      },
      related_group: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.GROUP,
      },
    },
    typeId: e.GROUP_RELATIONSHIP,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.HARDNESS_REPRESENTATION,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION,
  },
  {
    fields: {
    },
    typeId: e.HIDDEN_ELEMENT_OVER_RIDING_STYLED_ITEM,
    depth: 4,
    isAbstract: false,
    superType: e.CONTEXT_DEPENDENT_OVER_RIDING_STYLED_ITEM,
  },
  {
    fields: {
    },
    typeId: e.HOLE_BOTTOM,
    depth: 1,
    isAbstract: false,
    superType: e.SHAPE_ASPECT,
  },
  {
    fields: {
    },
    typeId: e.HOLE_IN_PANEL,
    depth: 2,
    isAbstract: false,
    superType: e.FEATURE_DEFINITION,
  },
  {
    fields: {
    },
    typeId: e.HOMOKINETIC_PAIR,
    depth: 3,
    isAbstract: false,
    superType: e.UNIVERSAL_PAIR,
  },
  {
    fields: {
      input_skew_angle: {
        kind: f.NUMBER,
        optional: true,
        derived: false,
        offset: 5,
      },
      skew_angle: {
        kind: f.NUMBER,
        optional: false,
        derived: true,
      },
    },
    typeId: e.UNIVERSAL_PAIR,
    depth: 2,
    isAbstract: false,
    superType: e.KINEMATIC_PAIR,
  },
  {
    fields: {
      attribute_value: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      identified_item: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ADDRESS,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CATEGORY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PROPERTY_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_ASPECT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_ASPECT_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPLICATION_CONTEXT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.GROUP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ORGANIZATIONAL_PROJECT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.REPRESENTATION,
          },
        ],
      },
    },
    typeId: e.ID_ATTRIBUTE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
    },
    typeId: e.IDENTIFICATION_ROLE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.INCLUSION_PRODUCT_CONCEPT_FEATURE,
    depth: 2,
    isAbstract: false,
    superType: e.CONDITIONAL_CONCEPT_FEATURE,
  },
  {
    fields: {
      operand: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: true,
        type: e.GENERIC_EXPRESSION,
      },
      index: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: true,
        type: e.GENERIC_EXPRESSION,
      },
    },
    typeId: e.INDEX_EXPRESSION,
    depth: 3,
    isAbstract: false,
    superType: e.STRING_EXPRESSION,
  },
  {
    fields: {
      applies_to_mechanism: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.MECHANISM,
      },
      pair_values: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        type: e.PAIR_VALUE,
      },
    },
    typeId: e.INITIAL_STATE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.INSTANCED_FEATURE,
    depth: 1,
    isAbstract: false,
    superType: e.SHAPE_ASPECT,
  },
  {
    fields: {
      the_value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 1,
      },
    },
    typeId: e.INT_LITERAL,
    depth: 5,
    isAbstract: false,
    superType: e.LITERAL_NUMBER,
  },
  {
    fields: {
      the_value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.LITERAL_NUMBER,
    depth: 4,
    isAbstract: true,
    superType: e.SIMPLE_NUMERIC_EXPRESSION,
    subTypes: [
       e.INT_LITERAL,
       e.REAL_LITERAL,
    ],
  },
  {
    fields: {
    },
    typeId: e.INT_NUMERIC_VARIABLE,
    depth: 5,
    isAbstract: false,
    superType: e.NUMERIC_VARIABLE,
  },
  {
    fields: {
    },
    typeId: e.NUMERIC_VARIABLE,
    depth: 4,
    isAbstract: false,
    superType: e.SIMPLE_NUMERIC_EXPRESSION,
    subTypes: [
       e.INT_NUMERIC_VARIABLE,
       e.REAL_NUMERIC_VARIABLE,
    ],
  },
  {
    fields: {
    },
    typeId: e.INT_VALUE_FUNCTION,
    depth: 4,
    isAbstract: false,
    superType: e.VALUE_FUNCTION,
  },
  {
    fields: {
      operand: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.STRING_EXPRESSION,
      },
    },
    typeId: e.VALUE_FUNCTION,
    depth: 3,
    isAbstract: false,
    superType: e.NUMERIC_EXPRESSION,
  },
  {
    fields: {
    },
    typeId: e.INTEGER_DEFINED_FUNCTION,
    depth: 4,
    isAbstract: true,
    superType: e.NUMERIC_DEFINED_FUNCTION,
  },
  {
    fields: {
      interpolation: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 0,
        type: e.CONFIGURATION_INTERPOLATION,
      },
    },
    typeId: e.INTERPOLATED_CONFIGURATION_SEQUENCE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.INTERSECTION_CURVE,
    depth: 4,
    isAbstract: false,
    superType: e.SURFACE_CURVE,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
      transform_item_1: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.REPRESENTATION_ITEM,
      },
      transform_item_2: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.REPRESENTATION_ITEM,
      },
    },
    typeId: e.ITEM_DEFINED_TRANSFORMATION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.JOGGLE,
    depth: 2,
    isAbstract: false,
    superType: e.FEATURE_DEFINITION,
  },
  {
    fields: {
    },
    typeId: e.JOGGLE_TERMINATION,
    depth: 1,
    isAbstract: false,
    superType: e.SHAPE_ASPECT,
  },
  {
    fields: {
      control: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.KINEMATIC_CONTROL,
      },
      result: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.KINEMATIC_ANALYSIS_RESULT,
      },
    },
    typeId: e.KINEMATIC_ANALYSIS_CONSISTENCY,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      analysed_mechanism: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.MECHANISM,
      },
      contained_kinematic_results: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.INTERPOLATED_CONFIGURATION_SEQUENCE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.RESULTING_PATH,
          },
        ],
      },
    },
    typeId: e.KINEMATIC_ANALYSIS_RESULT,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      controlled_mechanism: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.MECHANISM,
      },
      contained_kinematic_programs: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.INTERPOLATED_CONFIGURATION_SEQUENCE,
          },
        ],
      },
    },
    typeId: e.KINEMATIC_CONTROL,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      items: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 3,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.POINT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CURVE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SURFACE,
          },
        ],
      },
      context_of_items: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 4,
        type: e.GEOMETRIC_REPRESENTATION_CONTEXT,
      },
    },
    typeId: e.KINEMATIC_FRAME_BACKGROUND_REPRESENTATION,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION,
  },
  {
    fields: {
      transformation_operator: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 5,
        type: e.KINEMATIC_FRAME_BASED_TRANSFORMATION,
      },
    },
    typeId: e.KINEMATIC_FRAME_BACKGROUND_REPRESENTATION_ASSOCIATION,
    depth: 2,
    isAbstract: false,
    superType: e.REPRESENTATION_RELATIONSHIP_WITH_TRANSFORMATION,
  },
  {
    fields: {
      transformation_operator: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 4,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ITEM_DEFINED_TRANSFORMATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.FUNCTIONALLY_DEFINED_TRANSFORMATION,
          },
        ],
      },
    },
    typeId: e.REPRESENTATION_RELATIONSHIP_WITH_TRANSFORMATION,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION_RELATIONSHIP,
  },
  {
    fields: {
      transformator: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.AXIS2_PLACEMENT_3D,
          },
        ],
      },
    },
    typeId: e.KINEMATIC_FRAME_BASED_TRANSFORMATION,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_REPRESENTATION_ITEM,
  },
  {
    fields: {
      property: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.KINEMATIC_PROPERTY_REPRESENTATION_RELATION,
      },
    },
    typeId: e.KINEMATIC_GROUND_REPRESENTATION,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION,
  },
  {
    fields: {
      first_link: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.KINEMATIC_LINK,
      },
      second_link: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.KINEMATIC_LINK,
      },
      structure: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.KINEMATIC_STRUCTURE,
      },
    },
    typeId: e.KINEMATIC_JOINT,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.KINEMATIC_LINK,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      context_of_items: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.GEOMETRIC_REPRESENTATION_CONTEXT,
      },
      link_frame: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: true,
        type: e.GEOMETRIC_REPRESENTATION_CONTEXT,
      },
      link_representation_relation: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 5,
        type: e.KINEMATIC_LINK_REPRESENTATION_RELATION,
      },
    },
    typeId: e.KINEMATIC_LINK_REPRESENTATION,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION,
  },
  {
    fields: {
      rep_1: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 4,
        type: e.KINEMATIC_LINK_REPRESENTATION,
      },
    },
    typeId: e.KINEMATIC_LINK_REPRESENTATION_ASSOCIATION,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION_RELATIONSHIP,
  },
  {
    fields: {
      topological_aspects: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.KINEMATIC_LINK,
      },
      geometric_aspects: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.KINEMATIC_LINK_REPRESENTATION,
      },
    },
    typeId: e.KINEMATIC_LINK_REPRESENTATION_RELATION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.KINEMATIC_PATH,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION_ITEM,
  },
  {
    fields: {
      ground_definition: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 3,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CHARACTERIZED_OBJECT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_SHAPE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_ASPECT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_ASPECT_RELATIONSHIP,
          },
        ],
      },
    },
    typeId: e.KINEMATIC_PROPERTY_DEFINITION,
    depth: 1,
    isAbstract: false,
    superType: e.PROPERTY_DEFINITION,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
      definition: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CHARACTERIZED_OBJECT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_SHAPE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_ASPECT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_ASPECT_RELATIONSHIP,
          },
        ],
      },
      id: {
        kind: f.STRING,
        optional: false,
        derived: true,
      },
    },
    typeId: e.PROPERTY_DEFINITION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.KINEMATIC_PROPERTY_REPRESENTATION_RELATION,
    depth: 1,
    isAbstract: false,
    superType: e.PROPERTY_DEFINITION_REPRESENTATION,
  },
  {
    fields: {
      definition: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 0,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.GENERAL_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PROPERTY_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PROPERTY_DEFINITION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_ASPECT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_ASPECT_RELATIONSHIP,
          },
        ],
      },
      used_representation: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.REPRESENTATION,
      },
      description: {
        kind: f.STRING,
        optional: false,
        derived: true,
      },
      name: {
        kind: f.STRING,
        optional: false,
        derived: true,
      },
    },
    typeId: e.PROPERTY_DEFINITION_REPRESENTATION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      joints: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 0,
        type: e.KINEMATIC_JOINT,
      },
    },
    typeId: e.KINEMATIC_STRUCTURE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.KNOWN_SOURCE,
    depth: 1,
    isAbstract: false,
    superType: e.EXTERNAL_SOURCE,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.PRE_DEFINED_ITEM,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.LANGUAGE,
    depth: 1,
    isAbstract: false,
    superType: e.GROUP,
  },
  {
    fields: {
      items: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.REPRESENTATION,
          },
        ],
      },
    },
    typeId: e.LANGUAGE_ASSIGNMENT,
    depth: 1,
    isAbstract: false,
    superType: e.CLASSIFICATION_ASSIGNMENT,
  },
  {
    fields: {
    },
    typeId: e.LEADER_CURVE,
    depth: 4,
    isAbstract: false,
    superType: e.ANNOTATION_CURVE_OCCURRENCE,
  },
  {
    fields: {
    },
    typeId: e.LEADER_DIRECTED_CALLOUT,
    depth: 3,
    isAbstract: false,
    superType: e.DRAUGHTING_CALLOUT,
  },
  {
    fields: {
    },
    typeId: e.LEADER_DIRECTED_DIMENSION,
    depth: 4,
    isAbstract: false,
    superType: e.LEADER_DIRECTED_CALLOUT,
  },
  {
    fields: {
    },
    typeId: e.LEADER_TERMINATOR,
    depth: 5,
    isAbstract: false,
    superType: e.TERMINATOR_SYMBOL,
  },
  {
    fields: {
      operand: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.STRING_EXPRESSION,
      },
    },
    typeId: e.LENGTH_FUNCTION,
    depth: 3,
    isAbstract: false,
    superType: e.NUMERIC_EXPRESSION,
  },
  {
    fields: {
    },
    typeId: e.LENGTH_MEASURE_WITH_UNIT,
    depth: 1,
    isAbstract: false,
    superType: e.MEASURE_WITH_UNIT,
  },
  {
    fields: {
    },
    typeId: e.LENGTH_UNIT,
    depth: 1,
    isAbstract: false,
    superType: e.NAMED_UNIT,
  },
  {
    fields: {
      light_colour: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.COLOUR,
      },
    },
    typeId: e.LIGHT_SOURCE,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_REPRESENTATION_ITEM,
    subTypes: [
       e.LIGHT_SOURCE_AMBIENT,
       e.LIGHT_SOURCE_DIRECTIONAL,
       e.LIGHT_SOURCE_POSITIONAL,
       e.LIGHT_SOURCE_SPOT,
    ],
  },
  {
    fields: {
    },
    typeId: e.LIGHT_SOURCE_AMBIENT,
    depth: 3,
    isAbstract: false,
    superType: e.LIGHT_SOURCE,
  },
  {
    fields: {
      orientation: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.DIRECTION,
      },
    },
    typeId: e.LIGHT_SOURCE_DIRECTIONAL,
    depth: 3,
    isAbstract: false,
    superType: e.LIGHT_SOURCE,
  },
  {
    fields: {
      position: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.CARTESIAN_POINT,
      },
      constant_attenuation: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 3,
      },
      distance_attenuation: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 4,
      },
    },
    typeId: e.LIGHT_SOURCE_POSITIONAL,
    depth: 3,
    isAbstract: false,
    superType: e.LIGHT_SOURCE,
  },
  {
    fields: {
      position: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.CARTESIAN_POINT,
      },
      orientation: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.DIRECTION,
      },
      concentration_exponent: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 4,
      },
      constant_attenuation: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 5,
      },
      distance_attenuation: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 6,
      },
      spread_angle: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 7,
      },
    },
    typeId: e.LIGHT_SOURCE_SPOT,
    depth: 3,
    isAbstract: false,
    superType: e.LIGHT_SOURCE,
  },
  {
    fields: {
      form_variance: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      zone_variance: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      grade: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 2,
      },
      source: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 3,
      },
    },
    typeId: e.LIMITS_AND_FITS,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.LINE_PROFILE_TOLERANCE,
    depth: 1,
    isAbstract: false,
    superType: e.GEOMETRIC_TOLERANCE,
  },
  {
    fields: {
    },
    typeId: e.LINEAR_DIMENSION,
    depth: 4,
    isAbstract: false,
    superType: e.DIMENSION_CURVE_DIRECTED_CALLOUT,
  },
  {
    fields: {
      the_value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 1,
      },
    },
    typeId: e.REAL_LITERAL,
    depth: 5,
    isAbstract: false,
    superType: e.LITERAL_NUMBER,
  },
  {
    fields: {
    },
    typeId: e.SIMPLE_NUMERIC_EXPRESSION,
    depth: 3,
    isAbstract: true,
    superType: e.NUMERIC_EXPRESSION,
    subTypes: [
       e.LITERAL_NUMBER,
       e.NUMERIC_VARIABLE,
    ],
  },
  {
    fields: {
      hour_component: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
      minute_component: {
        kind: f.NUMBER,
        optional: true,
        derived: false,
        offset: 1,
      },
      second_component: {
        kind: f.NUMBER,
        optional: true,
        derived: false,
        offset: 2,
      },
      zone: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.COORDINATED_UNIVERSAL_TIME_OFFSET,
      },
    },
    typeId: e.LOCAL_TIME,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.LOCATION_SHAPE_REPRESENTATION,
    depth: 2,
    isAbstract: false,
    superType: e.SHAPE_REPRESENTATION,
  },
  {
    fields: {
    },
    typeId: e.LOCATOR,
    depth: 2,
    isAbstract: false,
    superType: e.FEATURE_DEFINITION,
  },
  {
    fields: {
    },
    typeId: e.LOG10_FUNCTION,
    depth: 5,
    isAbstract: false,
    superType: e.UNARY_FUNCTION_CALL,
  },
  {
    fields: {
    },
    typeId: e.LOG2_FUNCTION,
    depth: 5,
    isAbstract: false,
    superType: e.UNARY_FUNCTION_CALL,
  },
  {
    fields: {
    },
    typeId: e.LOG_FUNCTION,
    depth: 5,
    isAbstract: false,
    superType: e.UNARY_FUNCTION_CALL,
  },
  {
    fields: {
      loop_vertex: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.VERTEX,
      },
    },
    typeId: e.VERTEX_LOOP,
    depth: 3,
    isAbstract: false,
    superType: e.LOOP,
  },
  {
    fields: {
    },
    typeId: e.LUMINOUS_INTENSITY_MEASURE_WITH_UNIT,
    depth: 1,
    isAbstract: false,
    superType: e.MEASURE_WITH_UNIT,
  },
  {
    fields: {
    },
    typeId: e.LUMINOUS_INTENSITY_UNIT,
    depth: 1,
    isAbstract: false,
    superType: e.NAMED_UNIT,
  },
  {
    fields: {
      ranking: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 5,
      },
      ranking_rationale: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 6,
      },
      quantity: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 7,
        type: e.MEASURE_WITH_UNIT,
      },
    },
    typeId: e.MAKE_FROM_USAGE_OPTION,
    depth: 2,
    isAbstract: false,
    superType: e.PRODUCT_DEFINITION_USAGE,
  },
  {
    fields: {
    },
    typeId: e.MANIFOLD_SUBSURFACE_SHAPE_REPRESENTATION,
    depth: 2,
    isAbstract: false,
    superType: e.SHAPE_REPRESENTATION,
  },
  {
    fields: {
    },
    typeId: e.MANIFOLD_SURFACE_SHAPE_REPRESENTATION,
    depth: 2,
    isAbstract: false,
    superType: e.SHAPE_REPRESENTATION,
  },
  {
    fields: {
    },
    typeId: e.MASS_MEASURE_WITH_UNIT,
    depth: 1,
    isAbstract: false,
    superType: e.MEASURE_WITH_UNIT,
  },
  {
    fields: {
    },
    typeId: e.MASS_UNIT,
    depth: 1,
    isAbstract: false,
    superType: e.NAMED_UNIT,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      definitions: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CHARACTERIZED_OBJECT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_SHAPE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_ASPECT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_ASPECT_RELATIONSHIP,
          },
        ],
      },
    },
    typeId: e.MATERIAL_DESIGNATION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      designation: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.MATERIAL_DESIGNATION,
      },
      property: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 3,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MATERIAL_PROPERTY_REPRESENTATION,
          },
        ],
      },
    },
    typeId: e.MATERIAL_DESIGNATION_CHARACTERIZATION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.MATERIAL_PROPERTY,
    depth: 1,
    isAbstract: false,
    superType: e.PROPERTY_DEFINITION,
  },
  {
    fields: {
      dependent_environment: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.DATA_ENVIRONMENT,
      },
    },
    typeId: e.MATERIAL_PROPERTY_REPRESENTATION,
    depth: 1,
    isAbstract: false,
    superType: e.PROPERTY_DEFINITION_REPRESENTATION,
  },
  {
    fields: {
    },
    typeId: e.MAXIMUM_FUNCTION,
    depth: 5,
    isAbstract: false,
    superType: e.MULTIPLE_ARITY_FUNCTION_CALL,
  },
  {
    fields: {
    },
    typeId: e.MULTIPLE_ARITY_FUNCTION_CALL,
    depth: 4,
    isAbstract: true,
    superType: e.MULTIPLE_ARITY_NUMERIC_EXPRESSION,
    subTypes: [
       e.MAXIMUM_FUNCTION,
       e.MINIMUM_FUNCTION,
    ],
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      qualified_measure: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.MEASURE_WITH_UNIT,
      },
      qualifiers: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 3,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRECISION_QUALIFIER,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.TYPE_QUALIFIER,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.UNCERTAINTY_QUALIFIER,
          },
        ],
      },
    },
    typeId: e.MEASURE_QUALIFICATION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.MEASURE_REPRESENTATION_ITEM,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION_ITEM,
  },
  {
    fields: {
    },
    typeId: e.TIME_MEASURE_WITH_UNIT,
    depth: 1,
    isAbstract: false,
    superType: e.MEASURE_WITH_UNIT,
  },
  {
    fields: {
    },
    typeId: e.THERMODYNAMIC_TEMPERATURE_MEASURE_WITH_UNIT,
    depth: 1,
    isAbstract: false,
    superType: e.MEASURE_WITH_UNIT,
  },
  {
    fields: {
    },
    typeId: e.PLANE_ANGLE_MEASURE_WITH_UNIT,
    depth: 1,
    isAbstract: false,
    superType: e.MEASURE_WITH_UNIT,
  },
  {
    fields: {
    },
    typeId: e.SOLID_ANGLE_MEASURE_WITH_UNIT,
    depth: 1,
    isAbstract: false,
    superType: e.MEASURE_WITH_UNIT,
  },
  {
    fields: {
    },
    typeId: e.VOLUME_MEASURE_WITH_UNIT,
    depth: 1,
    isAbstract: false,
    superType: e.MEASURE_WITH_UNIT,
  },
  {
    fields: {
    },
    typeId: e.RATIO_MEASURE_WITH_UNIT,
    depth: 1,
    isAbstract: false,
    superType: e.MEASURE_WITH_UNIT,
  },
  {
    fields: {
    },
    typeId: e.MECHANICAL_DESIGN_GEOMETRIC_PRESENTATION_AREA,
    depth: 3,
    isAbstract: false,
    superType: e.PRESENTATION_AREA,
  },
  {
    fields: {
    },
    typeId: e.MECHANICAL_DESIGN_GEOMETRIC_PRESENTATION_REPRESENTATION,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION,
  },
  {
    fields: {
      structure_definition: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.KINEMATIC_STRUCTURE,
      },
      base: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.KINEMATIC_LINK,
      },
      containing_property: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.KINEMATIC_PROPERTY_DEFINITION,
      },
    },
    typeId: e.MECHANISM,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      base_of_mechanism: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 5,
        type: e.MECHANISM,
      },
      transformation_operator: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 6,
        type: e.CARTESIAN_TRANSFORMATION_OPERATOR_3D,
      },
      rep_2: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: true,
        type: e.KINEMATIC_LINK_REPRESENTATION,
      },
    },
    typeId: e.MECHANISM_BASE_PLACEMENT,
    depth: 2,
    isAbstract: false,
    superType: e.REPRESENTATION_RELATIONSHIP_WITH_TRANSFORMATION,
  },
  {
    fields: {
    },
    typeId: e.MINIMUM_FUNCTION,
    depth: 5,
    isAbstract: false,
    superType: e.MULTIPLE_ARITY_FUNCTION_CALL,
  },
  {
    fields: {
    },
    typeId: e.MINUS_FUNCTION,
    depth: 5,
    isAbstract: false,
    superType: e.UNARY_FUNCTION_CALL,
  },
  {
    fields: {
      modifier: {
        kind: f.ENUM,
        optional: false,
        derived: false,
        offset: 4,
        type: limit_condition,
      },
    },
    typeId: e.MODIFIED_GEOMETRIC_TOLERANCE,
    depth: 1,
    isAbstract: false,
    superType: e.GEOMETRIC_TOLERANCE,
  },
  {
    fields: {
    },
    typeId: e.MODIFIED_PATTERN,
    depth: 3,
    isAbstract: false,
    superType: e.REPLICATE_FEATURE,
  },
  {
    fields: {
    },
    typeId: e.MOMENTS_OF_INERTIA_REPRESENTATION,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION,
  },
  {
    fields: {
      rep_1: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 4,
        type: e.FOUNDED_KINEMATIC_PATH,
      },
      rep_2: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 5,
        type: e.KINEMATIC_LINK_REPRESENTATION,
      },
      related_frame: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 6,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.AXIS2_PLACEMENT_3D,
          },
        ],
      },
      motion: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: true,
        type: e.FOUNDED_KINEMATIC_PATH,
      },
      frame_link: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: true,
        type: e.KINEMATIC_LINK_REPRESENTATION,
      },
    },
    typeId: e.MOTION_LINK_RELATIONSHIP,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION_RELATIONSHIP,
  },
  {
    fields: {
    },
    typeId: e.MULT_EXPRESSION,
    depth: 4,
    isAbstract: false,
    superType: e.MULTIPLE_ARITY_NUMERIC_EXPRESSION,
  },
  {
    fields: {
      operands: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 0,
        type: e.NUMERIC_EXPRESSION,
      },
    },
    typeId: e.MULTIPLE_ARITY_NUMERIC_EXPRESSION,
    depth: 3,
    isAbstract: true,
    superType: e.NUMERIC_EXPRESSION,
    subTypes: [
       e.PLUS_EXPRESSION,
       e.MULT_EXPRESSION,
       e.MULTIPLE_ARITY_FUNCTION_CALL,
    ],
  },
  {
    fields: {
      items: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 3,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_DIRECTIVE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_METHOD,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ALTERNATE_PRODUCT_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPLICATION_CONTEXT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPROVAL_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ASSEMBLY_COMPONENT_USAGE_SUBSTITUTE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CERTIFICATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_DESIGN,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_ITEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONTRACT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DATA_ENVIRONMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DATE_ROLE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DATE_TIME_ROLE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DESCRIPTIVE_REPRESENTATION_ITEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DOCUMENT_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DRAUGHTING_TITLE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EFFECTIVITY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EFFECTIVITY_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EVENT_OCCURRENCE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EXTERNAL_SOURCE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.GENERAL_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.GENERAL_PROPERTY_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.GEOMETRIC_REPRESENTATION_ITEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.GEOMETRIC_TOLERANCE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.GROUP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.GROUP_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.IDENTIFICATION_ROLE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.KINEMATIC_PAIR,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MAPPED_ITEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.NAME_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ORGANIZATION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ORGANIZATION_ROLE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ORGANIZATIONAL_PROJECT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ORGANIZATIONAL_PROJECT_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PAIR_ACTUATOR,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PERSON_AND_ORGANIZATION_ROLE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRESENTATION_LAYER_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PROCESS_PRODUCT_ASSOCIATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_FEATURE_ASSOCIATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CONCEPT_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_FORMATION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_SUBSTITUTE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_RELATED_PRODUCT_CATEGORY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PROPERTY_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PROPERTY_DEFINITION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.REPRESENTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.REPRESENTATION_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.REQUIREMENT_FOR_ACTION_RESOURCE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.RESOURCE_PROPERTY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.RESOURCE_REQUIREMENT_TYPE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SECURITY_CLASSIFICATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_ASPECT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_ASPECT_RELATIONSHIP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.STYLED_ITEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.TIME_INTERVAL_ROLE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.TOPOLOGICAL_REPRESENTATION_ITEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.UNCERTAINTY_MEASURE_WITH_UNIT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.UNCERTAINTY_QUALIFIER,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.VERSIONED_ACTION_REQUEST,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.VERSIONED_ACTION_REQUEST_RELATIONSHIP,
          },
        ],
      },
      language: {
        kind: f.STRING,
        optional: false,
        derived: true,
      },
    },
    typeId: e.MULTI_LANGUAGE_ATTRIBUTE_ASSIGNMENT,
    depth: 1,
    isAbstract: false,
    superType: e.ATTRIBUTE_VALUE_ASSIGNMENT,
  },
  {
    fields: {
    },
    typeId: e.OR_EXPRESSION,
    depth: 4,
    isAbstract: false,
    superType: e.MULTIPLE_ARITY_BOOLEAN_EXPRESSION,
  },
  {
    fields: {
    },
    typeId: e.PLUS_EXPRESSION,
    depth: 4,
    isAbstract: false,
    superType: e.MULTIPLE_ARITY_NUMERIC_EXPRESSION,
  },
  {
    fields: {
      attribute_value: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      named_item: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_REQUEST_SOLUTION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ADDRESS,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONFIGURATION_DESIGN,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONTEXT_DEPENDENT_SHAPE_REPRESENTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DERIVED_UNIT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EFFECTIVITY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PERSON_AND_ORGANIZATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_SUBSTITUTE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PROPERTY_DEFINITION_REPRESENTATION,
          },
        ],
      },
    },
    typeId: e.NAME_ATTRIBUTE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      prefix: {
        kind: f.ENUM,
        optional: true,
        derived: false,
        offset: 1,
        type: si_prefix,
      },
      name: {
        kind: f.ENUM,
        optional: false,
        derived: false,
        offset: 2,
        type: si_unit_name,
      },
      dimensions: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: true,
        type: e.DIMENSIONAL_EXPONENTS,
      },
    },
    typeId: e.SI_UNIT,
    depth: 1,
    isAbstract: false,
    superType: e.NAMED_UNIT,
  },
  {
    fields: {
      associated_variable_environment: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.ENVIRONMENT,
      },
    },
    typeId: e.NAMED_UNIT_VARIABLE,
    depth: 1,
    isAbstract: false,
    superType: e.NAMED_UNIT,
  },
  {
    fields: {
    },
    typeId: e.NGON_CLOSED_PROFILE,
    depth: 1,
    isAbstract: false,
    superType: e.SHAPE_ASPECT,
  },
  {
    fields: {
    },
    typeId: e.NON_MANIFOLD_SURFACE_SHAPE_REPRESENTATION,
    depth: 2,
    isAbstract: false,
    superType: e.SHAPE_REPRESENTATION,
  },
  {
    fields: {
      operand: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.BOOLEAN_EXPRESSION,
      },
    },
    typeId: e.NOT_EXPRESSION,
    depth: 4,
    isAbstract: false,
    superType: e.UNARY_BOOLEAN_EXPRESSION,
  },
  {
    fields: {
    },
    typeId: e.REAL_DEFINED_FUNCTION,
    depth: 4,
    isAbstract: true,
    superType: e.NUMERIC_DEFINED_FUNCTION,
  },
  {
    fields: {
      operand: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.NUMERIC_EXPRESSION,
      },
    },
    typeId: e.UNARY_NUMERIC_EXPRESSION,
    depth: 3,
    isAbstract: true,
    superType: e.NUMERIC_EXPRESSION,
    subTypes: [
       e.UNARY_FUNCTION_CALL,
    ],
  },
  {
    fields: {
    },
    typeId: e.REAL_NUMERIC_VARIABLE,
    depth: 5,
    isAbstract: false,
    superType: e.NUMERIC_VARIABLE,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
    },
    typeId: e.OBJECT_ROLE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      operand: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.NUMERIC_EXPRESSION,
      },
    },
    typeId: e.ODD_FUNCTION,
    depth: 4,
    isAbstract: false,
    superType: e.UNARY_BOOLEAN_EXPRESSION,
  },
  {
    fields: {
      basis_surface: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.SURFACE,
      },
      distance: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
      self_intersect: {
        kind: f.BOOLEAN,
        optional: false,
        derived: false,
        offset: 3,
      },
    },
    typeId: e.OFFSET_SURFACE,
    depth: 3,
    isAbstract: false,
    superType: e.SURFACE,
  },
  {
    fields: {
      repeat_factor: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.VECTOR,
      },
    },
    typeId: e.ONE_DIRECTION_REPEAT_FACTOR,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_REPRESENTATION_ITEM,
  },
  {
    fields: {
    },
    typeId: e.OPEN_PATH_PROFILE,
    depth: 1,
    isAbstract: false,
    superType: e.SHAPE_ASPECT,
  },
  {
    fields: {
    },
    typeId: e.ORDINATE_DIMENSION,
    depth: 4,
    isAbstract: false,
    superType: e.PROJECTION_DIRECTED_CALLOUT,
  },
  {
    fields: {
    },
    typeId: e.PROJECTION_DIRECTED_CALLOUT,
    depth: 3,
    isAbstract: false,
    superType: e.DRAUGHTING_CALLOUT,
  },
  {
    fields: {
      id: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 0,
      },
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 2,
      },
    },
    typeId: e.ORGANIZATION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
      relating_organization: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.ORGANIZATION,
      },
      related_organization: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.ORGANIZATION,
      },
    },
    typeId: e.ORGANIZATION_RELATIONSHIP,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: false,
        derived: true,
      },
    },
    typeId: e.ORGANIZATION_ROLE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      organizations: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 12,
        type: e.ORGANIZATION,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 13,
      },
    },
    typeId: e.ORGANIZATIONAL_ADDRESS,
    depth: 1,
    isAbstract: false,
    superType: e.ADDRESS,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
      responsible_organizations: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 2,
        type: e.ORGANIZATION,
      },
      id: {
        kind: f.STRING,
        optional: false,
        derived: true,
      },
    },
    typeId: e.ORGANIZATIONAL_PROJECT,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
      relating_organizational_project: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.ORGANIZATIONAL_PROJECT,
      },
      related_organizational_project: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.ORGANIZATIONAL_PROJECT,
      },
    },
    typeId: e.ORGANIZATIONAL_PROJECT_RELATIONSHIP,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
    },
    typeId: e.ORGANIZATIONAL_PROJECT_ROLE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      closed_shell_element: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.CLOSED_SHELL,
      },
      orientation: {
        kind: f.BOOLEAN,
        optional: false,
        derived: false,
        offset: 3,
      },
      cfs_faces: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: true,
        type: e.FACE,
      },
    },
    typeId: e.ORIENTED_CLOSED_SHELL,
    depth: 4,
    isAbstract: false,
    superType: e.CLOSED_SHELL,
  },
  {
    fields: {
      open_shell_element: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.OPEN_SHELL,
      },
      orientation: {
        kind: f.BOOLEAN,
        optional: false,
        derived: false,
        offset: 3,
      },
      cfs_faces: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: true,
        type: e.FACE,
      },
    },
    typeId: e.ORIENTED_OPEN_SHELL,
    depth: 4,
    isAbstract: false,
    superType: e.OPEN_SHELL,
  },
  {
    fields: {
      path_element: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.PATH,
      },
      orientation: {
        kind: f.BOOLEAN,
        optional: false,
        derived: false,
        offset: 3,
      },
      edge_list: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: true,
        type: e.ORIENTED_EDGE,
      },
    },
    typeId: e.ORIENTED_PATH,
    depth: 3,
    isAbstract: false,
    superType: e.PATH,
  },
  {
    fields: {
      orientation: {
        kind: f.BOOLEAN,
        optional: false,
        derived: false,
        offset: 1,
      },
    },
    typeId: e.ORIENTED_SURFACE,
    depth: 3,
    isAbstract: false,
    superType: e.SURFACE,
  },
  {
    fields: {
    },
    typeId: e.OUTER_BOUNDARY_CURVE,
    depth: 7,
    isAbstract: false,
    superType: e.BOUNDARY_CURVE,
  },
  {
    fields: {
    },
    typeId: e.PACKAGE_PRODUCT_CONCEPT_FEATURE,
    depth: 1,
    isAbstract: false,
    superType: e.PRODUCT_CONCEPT_FEATURE,
  },
  {
    fields: {
      actuated_pair: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.KINEMATIC_PAIR,
      },
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
    },
    typeId: e.PAIR_ACTUATOR,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.PARALLELISM_TOLERANCE,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_TOLERANCE_WITH_DATUM_REFERENCE,
  },
  {
    fields: {
    },
    typeId: e.PARAMETRIC_REPRESENTATION_CONTEXT,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION_CONTEXT,
  },
  {
    fields: {
    },
    typeId: e.PARTIAL_CIRCULAR_PROFILE,
    depth: 1,
    isAbstract: false,
    superType: e.SHAPE_ASPECT,
  },
  {
    fields: {
    },
    typeId: e.PATH_FEATURE_COMPONENT,
    depth: 1,
    isAbstract: false,
    superType: e.SHAPE_ASPECT,
  },
  {
    fields: {
    },
    typeId: e.PATH_SHAPE_REPRESENTATION,
    depth: 2,
    isAbstract: false,
    superType: e.SHAPE_REPRESENTATION,
  },
  {
    fields: {
    },
    typeId: e.PATTERN_OFFSET_MEMBERSHIP,
    depth: 2,
    isAbstract: false,
    superType: e.FEATURE_COMPONENT_RELATIONSHIP,
  },
  {
    fields: {
    },
    typeId: e.PATTERN_OMIT_MEMBERSHIP,
    depth: 2,
    isAbstract: false,
    superType: e.FEATURE_COMPONENT_RELATIONSHIP,
  },
  {
    fields: {
    },
    typeId: e.PERPENDICULARITY_TOLERANCE,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_TOLERANCE_WITH_DATUM_REFERENCE,
  },
  {
    fields: {
      id: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      last_name: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
      first_name: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 2,
      },
      middle_names: {
        kind: f.STRING,
        rank: 1,
        optional: true,
        derived: false,
        offset: 3,
      },
      prefix_titles: {
        kind: f.STRING,
        rank: 1,
        optional: true,
        derived: false,
        offset: 4,
      },
      suffix_titles: {
        kind: f.STRING,
        rank: 1,
        optional: true,
        derived: false,
        offset: 5,
      },
    },
    typeId: e.PERSON,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      the_person: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.PERSON,
      },
      the_organization: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.ORGANIZATION,
      },
      name: {
        kind: f.STRING,
        optional: false,
        derived: true,
      },
      description: {
        kind: f.STRING,
        optional: false,
        derived: true,
      },
    },
    typeId: e.PERSON_AND_ORGANIZATION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.PERSON_AND_ORGANIZATION_ADDRESS,
    depth: 2,
    isAbstract: false,
    superType: e.ORGANIZATIONAL_ADDRESS,
  },
  {
    fields: {
      people: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 12,
        type: e.PERSON,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 13,
      },
    },
    typeId: e.PERSONAL_ADDRESS,
    depth: 1,
    isAbstract: false,
    superType: e.ADDRESS,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: false,
        derived: true,
      },
    },
    typeId: e.PERSON_AND_ORGANIZATION_ROLE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.PHYSICALLY_MODELLED_PRODUCT_DEFINITION,
    depth: 2,
    isAbstract: false,
    superType: e.PRODUCT_DEFINITION_WITH_ASSOCIATED_DOCUMENTS,
  },
  {
    fields: {
      documentation_ids: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 4,
        type: e.DOCUMENT,
      },
    },
    typeId: e.PRODUCT_DEFINITION_WITH_ASSOCIATED_DOCUMENTS,
    depth: 1,
    isAbstract: false,
    superType: e.PRODUCT_DEFINITION,
  },
  {
    fields: {
    },
    typeId: e.PLACED_DATUM_TARGET_FEATURE,
    depth: 2,
    isAbstract: false,
    superType: e.DATUM_TARGET,
  },
  {
    fields: {
    },
    typeId: e.PLACED_FEATURE,
    depth: 1,
    isAbstract: false,
    superType: e.SHAPE_ASPECT,
  },
  {
    fields: {
      placement: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 3,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.AXIS2_PLACEMENT_2D,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.AXIS2_PLACEMENT_3D,
          },
        ],
      },
    },
    typeId: e.PLANAR_BOX,
    depth: 3,
    isAbstract: false,
    superType: e.PLANAR_EXTENT,
  },
  {
    fields: {
      size_in_x: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 1,
      },
      size_in_y: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
    },
    typeId: e.PLANAR_EXTENT,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_REPRESENTATION_ITEM,
  },
  {
    fields: {
      curve_1: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 5,
        type: e.CURVE,
      },
      curve_2: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 6,
        type: e.CURVE,
      },
      orientation: {
        kind: f.BOOLEAN,
        optional: false,
        derived: false,
        offset: 7,
      },
    },
    typeId: e.PLANAR_CURVE_PAIR,
    depth: 2,
    isAbstract: false,
    superType: e.KINEMATIC_PAIR,
  },
  {
    fields: {
      applies_to_pair: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.PLANAR_CURVE_PAIR,
      },
      range_on_curve_1: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.TRIMMED_CURVE,
      },
      range_on_curve_2: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.TRIMMED_CURVE,
      },
    },
    typeId: e.PLANAR_CURVE_PAIR_RANGE,
    depth: 1,
    isAbstract: false,
    superType: e.SIMPLE_PAIR_RANGE,
  },
  {
    fields: {
    },
    typeId: e.PLANAR_PAIR,
    depth: 2,
    isAbstract: false,
    superType: e.KINEMATIC_PAIR,
  },
  {
    fields: {
      applies_to_pair: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.PLANAR_PAIR,
      },
      lower_limit_actual_rotation: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
      upper_limit_actual_rotation: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 3,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
      lower_limit_actual_translation_x: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 4,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.LENGTH_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
      upper_limit_actual_translation_x: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 5,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.LENGTH_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
      lower_limit_actual_translation_y: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 6,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.LENGTH_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
      upper_limit_actual_translation_y: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 7,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.LENGTH_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
    },
    typeId: e.PLANAR_PAIR_RANGE,
    depth: 1,
    isAbstract: false,
    superType: e.SIMPLE_PAIR_RANGE,
  },
  {
    fields: {
      applies_to_pair: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.PLANAR_PAIR,
      },
      actual_rotation: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
      actual_translation_x: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 3,
      },
      actual_translation_y: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 4,
      },
    },
    typeId: e.PLANAR_PAIR_VALUE,
    depth: 1,
    isAbstract: false,
    superType: e.PAIR_VALUE,
  },
  {
    fields: {
    },
    typeId: e.PLANAR_SHAPE_REPRESENTATION,
    depth: 2,
    isAbstract: false,
    superType: e.SHAPE_REPRESENTATION,
  },
  {
    fields: {
    },
    typeId: e.PLANE_ANGLE_UNIT,
    depth: 1,
    isAbstract: false,
    superType: e.NAMED_UNIT,
  },
  {
    fields: {
      range: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 0,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.TOLERANCE_VALUE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.LIMITS_AND_FITS,
          },
        ],
      },
      toleranced_dimension: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DIMENSIONAL_LOCATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DIMENSIONAL_SIZE,
          },
        ],
      },
    },
    typeId: e.PLUS_MINUS_TOLERANCE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.POCKET,
    depth: 2,
    isAbstract: false,
    superType: e.FEATURE_DEFINITION,
  },
  {
    fields: {
    },
    typeId: e.POCKET_BOTTOM,
    depth: 1,
    isAbstract: false,
    superType: e.SHAPE_ASPECT,
  },
  {
    fields: {
      basis_curve: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.CURVE,
      },
      point_parameter: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
    },
    typeId: e.POINT_ON_CURVE,
    depth: 3,
    isAbstract: false,
    superType: e.POINT,
  },
  {
    fields: {
      basis_surface: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.SURFACE,
      },
      point_parameter_u: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
      point_parameter_v: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 3,
      },
    },
    typeId: e.POINT_ON_SURFACE,
    depth: 3,
    isAbstract: false,
    superType: e.POINT,
  },
  {
    fields: {
      parent_pt: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.POINT,
      },
      transformation: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.CARTESIAN_TRANSFORMATION_OPERATOR,
      },
    },
    typeId: e.POINT_REPLICA,
    depth: 3,
    isAbstract: false,
    superType: e.POINT,
  },
  {
    fields: {
      pair_curve: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 5,
        type: e.CURVE,
      },
      orientation: {
        kind: f.BOOLEAN,
        optional: false,
        derived: false,
        offset: 6,
      },
    },
    typeId: e.POINT_ON_PLANAR_CURVE_PAIR,
    depth: 2,
    isAbstract: false,
    superType: e.KINEMATIC_PAIR,
  },
  {
    fields: {
      applies_to_pair: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.POINT_ON_PLANAR_CURVE_PAIR,
      },
      range_on_pair_curve: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.TRIMMED_CURVE,
      },
      lower_limit_yaw: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 3,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
      upper_limit_yaw: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 4,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
      lower_limit_pitch: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 5,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
      upper_limit_pitch: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 6,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
      lower_limit_roll: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 7,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
      upper_limit_roll: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 8,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
    },
    typeId: e.POINT_ON_PLANAR_CURVE_PAIR_RANGE,
    depth: 1,
    isAbstract: false,
    superType: e.SIMPLE_PAIR_RANGE,
  },
  {
    fields: {
      applies_to_pair: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.POINT_ON_PLANAR_CURVE_PAIR,
      },
      actual_point_on_curve: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.POINT_ON_CURVE,
      },
      input_orientation: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 3,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.YPR_ROTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ROTATION_ABOUT_DIRECTION,
          },
        ],
      },
      actual_orientation: {
        kind: f.NUMBER,
        optional: false,
        derived: true,
      },
    },
    typeId: e.POINT_ON_PLANAR_CURVE_PAIR_VALUE,
    depth: 1,
    isAbstract: false,
    superType: e.PAIR_VALUE,
  },
  {
    fields: {
      pair_surface: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 5,
        type: e.SURFACE,
      },
    },
    typeId: e.POINT_ON_SURFACE_PAIR,
    depth: 2,
    isAbstract: false,
    superType: e.KINEMATIC_PAIR,
  },
  {
    fields: {
      applies_to_pair: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.POINT_ON_SURFACE_PAIR,
      },
      range_on_pair_surface: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.RECTANGULAR_TRIMMED_SURFACE,
      },
      lower_limit_yaw: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 3,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
      upper_limit_yaw: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 4,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
      lower_limit_pitch: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 5,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
      upper_limit_pitch: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 6,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
      lower_limit_roll: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 7,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
      upper_limit_roll: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 8,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
    },
    typeId: e.POINT_ON_SURFACE_PAIR_RANGE,
    depth: 1,
    isAbstract: false,
    superType: e.SIMPLE_PAIR_RANGE,
  },
  {
    fields: {
      applies_to_pair: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.POINT_ON_SURFACE_PAIR,
      },
      actual_point_on_surface: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.POINT_ON_SURFACE,
      },
      input_orientation: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 3,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.YPR_ROTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ROTATION_ABOUT_DIRECTION,
          },
        ],
      },
      actual_orientation: {
        kind: f.NUMBER,
        optional: false,
        derived: true,
      },
    },
    typeId: e.POINT_ON_SURFACE_PAIR_VALUE,
    depth: 1,
    isAbstract: false,
    superType: e.PAIR_VALUE,
  },
  {
    fields: {
    },
    typeId: e.POINT_PLACEMENT_SHAPE_REPRESENTATION,
    depth: 2,
    isAbstract: false,
    superType: e.SHAPE_REPRESENTATION,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      marker: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: marker_type,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRE_DEFINED_MARKER,
          },
        ],
      },
      marker_size: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.POSITIVE_LENGTH_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MEASURE_WITH_UNIT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DESCRIPTIVE_MEASURE,
          },
        ],
      },
      marker_colour: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.COLOUR,
      },
    },
    typeId: e.POINT_STYLE,
    depth: 1,
    isAbstract: false,
    superType: e.FOUNDED_ITEM,
  },
  {
    fields: {
    },
    typeId: e.POSITION_TOLERANCE,
    depth: 1,
    isAbstract: false,
    superType: e.GEOMETRIC_TOLERANCE,
  },
  {
    fields: {
    },
    typeId: e.PRE_DEFINED_DIMENSION_SYMBOL,
    depth: 2,
    isAbstract: false,
    superType: e.PRE_DEFINED_SYMBOL,
  },
  {
    fields: {
    },
    typeId: e.PRE_DEFINED_SYMBOL,
    depth: 1,
    isAbstract: false,
    superType: e.PRE_DEFINED_ITEM,
  },
  {
    fields: {
    },
    typeId: e.PRE_DEFINED_GEOMETRICAL_TOLERANCE_SYMBOL,
    depth: 2,
    isAbstract: false,
    superType: e.PRE_DEFINED_SYMBOL,
  },
  {
    fields: {
    },
    typeId: e.PRE_DEFINED_MARKER,
    depth: 1,
    isAbstract: false,
    superType: e.PRE_DEFINED_ITEM,
  },
  {
    fields: {
    },
    typeId: e.PRE_DEFINED_POINT_MARKER_SYMBOL,
    depth: 2,
    isAbstract: false,
    superType: e.PRE_DEFINED_MARKER,
  },
  {
    fields: {
    },
    typeId: e.PRE_DEFINED_PRESENTATION_STYLE,
    depth: 1,
    isAbstract: false,
    superType: e.FOUNDED_ITEM,
  },
  {
    fields: {
    },
    typeId: e.PRE_DEFINED_SURFACE_CONDITION_SYMBOL,
    depth: 2,
    isAbstract: false,
    superType: e.PRE_DEFINED_SYMBOL,
  },
  {
    fields: {
    },
    typeId: e.PRE_DEFINED_TERMINATOR_SYMBOL,
    depth: 2,
    isAbstract: false,
    superType: e.PRE_DEFINED_SYMBOL,
  },
  {
    fields: {
      precision_value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.PRECISION_QUALIFIER,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      context_of_items: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.GEOMETRIC_REPRESENTATION_CONTEXT,
      },
    },
    typeId: e.PRESENTATION_REPRESENTATION,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION,
    subTypes: [
       e.PRESENTATION_AREA,
       e.PRESENTATION_VIEW,
    ],
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      assigned_items: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRESENTATION_REPRESENTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.REPRESENTATION_ITEM,
          },
        ],
      },
    },
    typeId: e.PRESENTATION_LAYER_ASSIGNMENT,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.PRESENTATION_VIEW,
    depth: 2,
    isAbstract: false,
    superType: e.PRESENTATION_REPRESENTATION,
  },
  {
    fields: {
      unit: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 0,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRESENTATION_VIEW,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRESENTATION_AREA,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.AREA_IN_SET,
          },
        ],
      },
      size: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.PLANAR_BOX,
      },
    },
    typeId: e.PRESENTATION_SIZE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      styles: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 0,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRE_DEFINED_PRESENTATION_STYLE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.POINT_STYLE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CURVE_STYLE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SURFACE_STYLE_USAGE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SYMBOL_STYLE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.FILL_AREA_STYLE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.TEXT_STYLE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPROXIMATION_TOLERANCE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EXTERNALLY_DEFINED_STYLE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: null_style,
          },
        ],
      },
    },
    typeId: e.PRESENTATION_STYLE_ASSIGNMENT,
    depth: 1,
    isAbstract: false,
    superType: e.FOUNDED_ITEM,
  },
  {
    fields: {
      style_context: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.GROUP,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRESENTATION_LAYER_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRESENTATION_SET,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.REPRESENTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.REPRESENTATION_ITEM,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_REPRESENTATION_RELATIONSHIP,
          },
        ],
      },
    },
    typeId: e.PRESENTATION_STYLE_BY_CONTEXT,
    depth: 2,
    isAbstract: false,
    superType: e.PRESENTATION_STYLE_ASSIGNMENT,
  },
  {
    fields: {
      presentation: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 0,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRESENTATION_REPRESENTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRESENTATION_SET,
          },
        ],
      },
      item: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.PRESENTED_ITEM,
      },
    },
    typeId: e.PRESENTED_ITEM_REPRESENTATION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.PRISMATIC_PAIR,
    depth: 2,
    isAbstract: false,
    superType: e.KINEMATIC_PAIR,
  },
  {
    fields: {
      applies_to_pair: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.PRISMATIC_PAIR,
      },
      lower_limit_actual_translation: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.LENGTH_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
      upper_limit_actual_translation: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 3,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.LENGTH_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
    },
    typeId: e.PRISMATIC_PAIR_RANGE,
    depth: 1,
    isAbstract: false,
    superType: e.SIMPLE_PAIR_RANGE,
  },
  {
    fields: {
      applies_to_pair: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.PRISMATIC_PAIR,
      },
      actual_translation: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
    },
    typeId: e.PRISMATIC_PAIR_VALUE,
    depth: 1,
    isAbstract: false,
    superType: e.PAIR_VALUE,
  },
  {
    fields: {
    },
    typeId: e.PROCESS_OPERATION,
    depth: 1,
    isAbstract: false,
    superType: e.ACTION_METHOD,
  },
  {
    fields: {
    },
    typeId: e.PROCESS_PLAN,
    depth: 1,
    isAbstract: false,
    superType: e.ACTION,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      defined_product: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_RELATIONSHIP,
          },
        ],
      },
      process: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.PRODUCT_DEFINITION_PROCESS,
      },
    },
    typeId: e.PROCESS_PRODUCT_ASSOCIATION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      process: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.PROPERTY_PROCESS,
      },
      property_or_shape: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 3,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PROPERTY_DEFINITION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_DEFINITION_SHAPE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_ASPECT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SHAPE_ASPECT_RELATIONSHIP,
          },
        ],
      },
    },
    typeId: e.PROCESS_PROPERTY_ASSOCIATION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      id: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 2,
      },
      frame_of_reference: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 3,
        type: e.PRODUCT_CONTEXT,
      },
    },
    typeId: e.PRODUCT,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
      id: {
        kind: f.STRING,
        optional: false,
        derived: true,
      },
    },
    typeId: e.PRODUCT_CATEGORY,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
      category: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.PRODUCT_CATEGORY,
      },
      sub_category: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.PRODUCT_CATEGORY,
      },
    },
    typeId: e.PRODUCT_CATEGORY_RELATIONSHIP,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.PRODUCT_CLASS,
    depth: 1,
    isAbstract: false,
    superType: e.PRODUCT_CONCEPT,
  },
  {
    fields: {
      id: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 2,
      },
      market_context: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.PRODUCT_CONCEPT_CONTEXT,
      },
    },
    typeId: e.PRODUCT_CONCEPT,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
      concept: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.PRODUCT_CONCEPT,
      },
      feature: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.PRODUCT_CONCEPT_FEATURE,
      },
    },
    typeId: e.PRODUCT_CONCEPT_FEATURE_ASSOCIATION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      items: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRODUCT_CLASS,
          },
        ],
      },
    },
    typeId: e.PRODUCT_CONCEPT_FEATURE_CATEGORY_USAGE,
    depth: 1,
    isAbstract: false,
    superType: e.GROUP_ASSIGNMENT,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
      relating_product_concept: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.PRODUCT_CONCEPT,
      },
      related_product_concept: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.PRODUCT_CONCEPT,
      },
    },
    typeId: e.PRODUCT_CONCEPT_RELATIONSHIP,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      id: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
      formation: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.PRODUCT_DEFINITION_FORMATION,
      },
      frame_of_reference: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.PRODUCT_DEFINITION_CONTEXT,
      },
      name: {
        kind: f.STRING,
        optional: false,
        derived: true,
      },
    },
    typeId: e.PRODUCT_DEFINITION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      definition: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.PRODUCT_DEFINITION,
      },
      frame_of_reference: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.PRODUCT_DEFINITION_CONTEXT,
      },
      role: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.PRODUCT_DEFINITION_CONTEXT_ROLE,
      },
    },
    typeId: e.PRODUCT_DEFINITION_CONTEXT_ASSOCIATION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
    },
    typeId: e.PRODUCT_DEFINITION_CONTEXT_ROLE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      id: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
      of_product: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.PRODUCT,
      },
    },
    typeId: e.PRODUCT_DEFINITION_FORMATION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      id: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 2,
      },
      relating_product_definition_formation: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.PRODUCT_DEFINITION_FORMATION,
      },
      related_product_definition_formation: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 4,
        type: e.PRODUCT_DEFINITION_FORMATION,
      },
    },
    typeId: e.PRODUCT_DEFINITION_FORMATION_RELATIONSHIP,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      make_or_buy: {
        kind: f.ENUM,
        optional: false,
        derived: false,
        offset: 3,
        type: source,
      },
    },
    typeId: e.PRODUCT_DEFINITION_FORMATION_WITH_SPECIFIED_SOURCE,
    depth: 1,
    isAbstract: false,
    superType: e.PRODUCT_DEFINITION_FORMATION,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
      occurrence: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.PRODUCT_DEFINITION,
      },
      occurrence_usage: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.ASSEMBLY_COMPONENT_USAGE,
      },
    },
    typeId: e.PRODUCT_DEFINITION_OCCURRENCE_RELATIONSHIP,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      identification: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 3,
      },
      product_definitions: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 4,
        type: e.PROCESS_PRODUCT_ASSOCIATION,
      },
    },
    typeId: e.PRODUCT_DEFINITION_PROCESS,
    depth: 1,
    isAbstract: false,
    superType: e.ACTION,
  },
  {
    fields: {
      id: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 2,
      },
      relating_product_definition: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.PRODUCT_DEFINITION,
      },
      related_product_definition: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 4,
        type: e.PRODUCT_DEFINITION,
      },
    },
    typeId: e.PRODUCT_DEFINITION_RELATIONSHIP,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.PRODUCT_DEFINITION_RESOURCE,
    depth: 1,
    isAbstract: false,
    superType: e.ACTION_RESOURCE,
  },
  {
    fields: {
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 0,
      },
      context_relationship: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.PRODUCT_DEFINITION_RELATIONSHIP,
      },
      substitute_definition: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.PRODUCT_DEFINITION,
      },
      name: {
        kind: f.STRING,
        optional: false,
        derived: true,
      },
    },
    typeId: e.PRODUCT_DEFINITION_SUBSTITUTE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.PRODUCT_IDENTIFICATION,
    depth: 1,
    isAbstract: false,
    superType: e.CONFIGURATION_ITEM,
  },
  {
    fields: {
    },
    typeId: e.PRODUCT_PROCESS_PLAN,
    depth: 2,
    isAbstract: false,
    superType: e.PRODUCT_DEFINITION_PROCESS,
  },
  {
    fields: {
      products: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 2,
        type: e.PRODUCT,
      },
    },
    typeId: e.PRODUCT_RELATED_PRODUCT_CATEGORY,
    depth: 1,
    isAbstract: false,
    superType: e.PRODUCT_CATEGORY,
  },
  {
    fields: {
    },
    typeId: e.PRODUCT_SPECIFICATION,
    depth: 2,
    isAbstract: false,
    superType: e.PRODUCT_IDENTIFICATION,
  },
  {
    fields: {
      projection_end: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.SHAPE_ASPECT,
      },
      projected_length: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.MEASURE_WITH_UNIT,
      },
    },
    typeId: e.PROJECTED_ZONE_DEFINITION,
    depth: 1,
    isAbstract: false,
    superType: e.TOLERANCE_ZONE_DEFINITION,
  },
  {
    fields: {
      zone: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.TOLERANCE_ZONE,
      },
      boundaries: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        type: e.SHAPE_ASPECT,
      },
    },
    typeId: e.TOLERANCE_ZONE_DEFINITION,
    depth: 0,
    isAbstract: false,
    subTypes: [
       e.PROJECTED_ZONE_DEFINITION,
       e.RUNOUT_ZONE_DEFINITION,
    ],
  },
  {
    fields: {
    },
    typeId: e.PROJECTION_CURVE,
    depth: 4,
    isAbstract: false,
    superType: e.ANNOTATION_CURVE_OCCURRENCE,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      relating_property_definition: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.PROPERTY_DEFINITION,
      },
      related_property_definition: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.PROPERTY_DEFINITION,
      },
    },
    typeId: e.PROPERTY_DEFINITION_RELATIONSHIP,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      identification: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 3,
      },
      properties: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 4,
        type: e.PROCESS_PROPERTY_ASSOCIATION,
      },
    },
    typeId: e.PROPERTY_PROCESS,
    depth: 1,
    isAbstract: false,
    superType: e.ACTION,
  },
  {
    fields: {
      qualifiers: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PRECISION_QUALIFIER,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.TYPE_QUALIFIER,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.UNCERTAINTY_QUALIFIER,
          },
        ],
      },
    },
    typeId: e.QUALIFIED_REPRESENTATION_ITEM,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION_ITEM,
  },
  {
    fields: {
      uncertainty_value: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 2,
      },
    },
    typeId: e.QUALITATIVE_UNCERTAINTY,
    depth: 1,
    isAbstract: false,
    superType: e.UNCERTAINTY_QUALIFIER,
  },
  {
    fields: {
      measure_name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
    },
    typeId: e.UNCERTAINTY_QUALIFIER,
    depth: 0,
    isAbstract: false,
    subTypes: [
       e.STANDARD_UNCERTAINTY,
       e.QUALITATIVE_UNCERTAINTY,
    ],
  },
  {
    fields: {
      quantity: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 6,
        type: e.MEASURE_WITH_UNIT,
      },
    },
    typeId: e.QUANTIFIED_ASSEMBLY_COMPONENT_USAGE,
    depth: 3,
    isAbstract: false,
    superType: e.ASSEMBLY_COMPONENT_USAGE,
  },
  {
    fields: {
      pinion_radius: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 5,
      },
    },
    typeId: e.RACK_AND_PINION_PAIR,
    depth: 2,
    isAbstract: false,
    superType: e.KINEMATIC_PAIR,
  },
  {
    fields: {
      applies_to_pair: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.RACK_AND_PINION_PAIR,
      },
      lower_limit_rack_displacement: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.LENGTH_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
      upper_limit_rack_displacement: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 3,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.LENGTH_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
    },
    typeId: e.RACK_AND_PINION_PAIR_RANGE,
    depth: 1,
    isAbstract: false,
    superType: e.SIMPLE_PAIR_RANGE,
  },
  {
    fields: {
      applies_to_pair: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.RACK_AND_PINION_PAIR,
      },
      actual_displacement: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
      actual_rotation: {
        kind: f.NUMBER,
        optional: false,
        derived: true,
      },
    },
    typeId: e.RACK_AND_PINION_PAIR_VALUE,
    depth: 1,
    isAbstract: false,
    superType: e.PAIR_VALUE,
  },
  {
    fields: {
    },
    typeId: e.RADIUS_DIMENSION,
    depth: 4,
    isAbstract: false,
    superType: e.DIMENSION_CURVE_DIRECTED_CALLOUT,
  },
  {
    fields: {
    },
    typeId: e.RATIO_UNIT,
    depth: 1,
    isAbstract: false,
    superType: e.NAMED_UNIT,
  },
  {
    fields: {
      weights_data: {
        kind: f.NUMBER,
        rank: 1,
        optional: false,
        derived: false,
        offset: 6,
      },
      weights: {
        kind: f.NUMBER,
        rank: 1,
        optional: false,
        derived: true,
      },
    },
    typeId: e.RATIONAL_B_SPLINE_CURVE,
    depth: 5,
    isAbstract: false,
    superType: e.B_SPLINE_CURVE,
  },
  {
    fields: {
      weights_data: {
        kind: f.NUMBER,
        rank: 2,
        optional: false,
        derived: false,
        offset: 8,
      },
      weights: {
        kind: f.NUMBER,
        rank: 2,
        optional: false,
        derived: true,
      },
    },
    typeId: e.RATIONAL_B_SPLINE_SURFACE,
    depth: 5,
    isAbstract: false,
    superType: e.B_SPLINE_SURFACE,
  },
  {
    fields: {
    },
    typeId: e.RECTANGULAR_CLOSED_PROFILE,
    depth: 1,
    isAbstract: false,
    superType: e.SHAPE_ASPECT,
  },
  {
    fields: {
    },
    typeId: e.RECTANGULAR_PATTERN,
    depth: 3,
    isAbstract: false,
    superType: e.REPLICATE_FEATURE,
  },
  {
    fields: {
      modifier: {
        kind: f.ENUM,
        optional: false,
        derived: false,
        offset: 2,
        type: limit_condition,
      },
    },
    typeId: e.REFERENCED_MODIFIED_DATUM,
    depth: 1,
    isAbstract: false,
    superType: e.DATUM_REFERENCE,
  },
  {
    fields: {
      base_event: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.EVENT_OCCURRENCE,
      },
      offset: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 4,
        type: e.TIME_MEASURE_WITH_UNIT,
      },
    },
    typeId: e.RELATIVE_EVENT_OCCURRENCE,
    depth: 1,
    isAbstract: false,
    superType: e.EVENT_OCCURRENCE,
  },
  {
    fields: {
    },
    typeId: e.REP_ITEM_GROUP,
    depth: 1,
    isAbstract: false,
    superType: e.GROUP,
  },
  {
    fields: {
      param_length: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 3,
      },
    },
    typeId: e.REPARAMETRISED_COMPOSITE_CURVE_SEGMENT,
    depth: 2,
    isAbstract: false,
    superType: e.COMPOSITE_CURVE_SEGMENT,
  },
  {
    fields: {
      value_component: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.AMOUNT_OF_SUBSTANCE_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.AREA_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CELSIUS_TEMPERATURE_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONTEXT_DEPENDENT_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.COUNT_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DESCRIPTIVE_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ELECTRIC_CURRENT_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.LENGTH_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.LUMINOUS_INTENSITY_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MASS_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.NUMERIC_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.NON_NEGATIVE_LENGTH_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PARAMETER_VALUE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.POSITIVE_LENGTH_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.POSITIVE_PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.POSITIVE_RATIO_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.RATIO_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SOLID_ANGLE_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.THERMODYNAMIC_TEMPERATURE_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.TIME_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.VOLUME_MEASURE,
          },
        ],
      },
    },
    typeId: e.VALUE_REPRESENTATION_ITEM,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION_ITEM,
  },
  {
    fields: {
      resources: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 4,
        type: e.ACTION_RESOURCE,
      },
    },
    typeId: e.REQUIREMENT_FOR_ACTION_RESOURCE,
    depth: 1,
    isAbstract: false,
    superType: e.ACTION_RESOURCE_REQUIREMENT,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      resource: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_RESOURCE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_RESOURCE_REQUIREMENT,
          },
        ],
      },
    },
    typeId: e.RESOURCE_PROPERTY,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      property: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.RESOURCE_PROPERTY,
      },
      representation: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.REPRESENTATION,
      },
    },
    typeId: e.RESOURCE_PROPERTY_REPRESENTATION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
    },
    typeId: e.RESOURCE_REQUIREMENT_TYPE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      controlling_joints: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 7,
        type: e.KINEMATIC_JOINT,
      },
    },
    typeId: e.RESULTING_PATH,
    depth: 2,
    isAbstract: false,
    superType: e.MOTION_LINK_RELATIONSHIP,
  },
  {
    fields: {
    },
    typeId: e.RETENTION,
    depth: 1,
    isAbstract: false,
    superType: e.ACTION,
  },
  {
    fields: {
    },
    typeId: e.REVOLUTE_PAIR,
    depth: 2,
    isAbstract: false,
    superType: e.KINEMATIC_PAIR,
  },
  {
    fields: {
      applies_to_pair: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.REVOLUTE_PAIR,
      },
      lower_limit_actual_rotation: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
      upper_limit_actual_rotation: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 3,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
    },
    typeId: e.REVOLUTE_PAIR_RANGE,
    depth: 1,
    isAbstract: false,
    superType: e.SIMPLE_PAIR_RANGE,
  },
  {
    fields: {
      applies_to_pair: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.REVOLUTE_PAIR,
      },
      actual_rotation: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
    },
    typeId: e.REVOLUTE_PAIR_VALUE,
    depth: 1,
    isAbstract: false,
    superType: e.PAIR_VALUE,
  },
  {
    fields: {
      axis: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.AXIS1_PLACEMENT,
      },
      angle: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 3,
      },
      axis_line: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: true,
        type: e.LINE,
      },
    },
    typeId: e.REVOLVED_AREA_SOLID,
    depth: 4,
    isAbstract: false,
    superType: e.SWEPT_AREA_SOLID,
  },
  {
    fields: {
      axis: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.AXIS1_PLACEMENT,
      },
      angle: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 3,
      },
      axis_line: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: true,
        type: e.LINE,
      },
    },
    typeId: e.REVOLVED_FACE_SOLID,
    depth: 4,
    isAbstract: false,
    superType: e.SWEPT_FACE_SOLID,
  },
  {
    fields: {
    },
    typeId: e.RIB,
    depth: 2,
    isAbstract: false,
    superType: e.FEATURE_DEFINITION,
  },
  {
    fields: {
      role: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.OBJECT_ROLE,
      },
      item_with_role: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ACTION_REQUEST_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPROVAL_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.APPROVAL_DATE_TIME,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CERTIFICATION_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CONTRACT_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DOCUMENT_REFERENCE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EFFECTIVITY_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.GROUP_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.NAME_ASSIGNMENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SECURITY_CLASSIFICATION_ASSIGNMENT,
          },
        ],
      },
    },
    typeId: e.ROLE_ASSOCIATION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.ROLLING_CURVE_PAIR,
    depth: 3,
    isAbstract: false,
    superType: e.PLANAR_CURVE_PAIR,
  },
  {
    fields: {
      applies_to_pair: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.ROLLING_CURVE_PAIR,
      },
      actual_point_on_curve_1: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.POINT_ON_CURVE,
      },
    },
    typeId: e.ROLLING_CURVE_PAIR_VALUE,
    depth: 1,
    isAbstract: false,
    superType: e.PAIR_VALUE,
  },
  {
    fields: {
    },
    typeId: e.ROLLING_SURFACE_PAIR,
    depth: 3,
    isAbstract: false,
    superType: e.SURFACE_PAIR,
  },
  {
    fields: {
      surface_1: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 5,
        type: e.SURFACE,
      },
      surface_2: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 6,
        type: e.SURFACE,
      },
      orientation: {
        kind: f.BOOLEAN,
        optional: false,
        derived: false,
        offset: 7,
      },
    },
    typeId: e.SURFACE_PAIR,
    depth: 2,
    isAbstract: false,
    superType: e.KINEMATIC_PAIR,
  },
  {
    fields: {
      applies_to_pair: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.ROLLING_SURFACE_PAIR,
      },
      actual_point_on_surface: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.POINT_ON_SURFACE,
      },
      actual_rotation: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 3,
      },
    },
    typeId: e.ROLLING_SURFACE_PAIR_VALUE,
    depth: 1,
    isAbstract: false,
    superType: e.PAIR_VALUE,
  },
  {
    fields: {
      direction_of_axis: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.DIRECTION,
      },
      rotation_angle: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 1,
      },
    },
    typeId: e.ROTATION_ABOUT_DIRECTION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.ROUND_HOLE,
    depth: 2,
    isAbstract: false,
    superType: e.FEATURE_DEFINITION,
  },
  {
    fields: {
    },
    typeId: e.ROUNDED_U_PROFILE,
    depth: 1,
    isAbstract: false,
    superType: e.SHAPE_ASPECT,
  },
  {
    fields: {
    },
    typeId: e.ROUNDNESS_TOLERANCE,
    depth: 1,
    isAbstract: false,
    superType: e.GEOMETRIC_TOLERANCE,
  },
  {
    fields: {
    },
    typeId: e.RULED_SURFACE_SWEPT_AREA_SOLID,
    depth: 5,
    isAbstract: false,
    superType: e.SURFACE_CURVE_SWEPT_AREA_SOLID,
  },
  {
    fields: {
      directrix: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.CURVE,
      },
      start_param: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 3,
      },
      end_param: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 4,
      },
      reference_surface: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 5,
        type: e.SURFACE,
      },
    },
    typeId: e.SURFACE_CURVE_SWEPT_AREA_SOLID,
    depth: 4,
    isAbstract: false,
    superType: e.SWEPT_AREA_SOLID,
  },
  {
    fields: {
      orientation: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.RUNOUT_ZONE_ORIENTATION,
      },
    },
    typeId: e.RUNOUT_ZONE_DEFINITION,
    depth: 1,
    isAbstract: false,
    superType: e.TOLERANCE_ZONE_DEFINITION,
  },
  {
    fields: {
      angle: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.MEASURE_WITH_UNIT,
      },
    },
    typeId: e.RUNOUT_ZONE_ORIENTATION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      orientation_defining_relationship: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.SHAPE_ASPECT_RELATIONSHIP,
      },
    },
    typeId: e.RUNOUT_ZONE_ORIENTATION_REFERENCE_DIRECTION,
    depth: 1,
    isAbstract: false,
    superType: e.RUNOUT_ZONE_ORIENTATION,
  },
  {
    fields: {
      pitch: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 5,
      },
    },
    typeId: e.SCREW_PAIR,
    depth: 2,
    isAbstract: false,
    superType: e.KINEMATIC_PAIR,
  },
  {
    fields: {
      applies_to_pair: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.SCREW_PAIR,
      },
      lower_limit_actual_rotation: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
      upper_limit_actual_rotation: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 3,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
    },
    typeId: e.SCREW_PAIR_RANGE,
    depth: 1,
    isAbstract: false,
    superType: e.SIMPLE_PAIR_RANGE,
  },
  {
    fields: {
      applies_to_pair: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.SCREW_PAIR,
      },
      actual_rotation: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
      actual_translation: {
        kind: f.NUMBER,
        optional: false,
        derived: true,
      },
    },
    typeId: e.SCREW_PAIR_VALUE,
    depth: 1,
    isAbstract: false,
    superType: e.PAIR_VALUE,
  },
  {
    fields: {
    },
    typeId: e.SEAM_CURVE,
    depth: 4,
    isAbstract: false,
    superType: e.SURFACE_CURVE,
  },
  {
    fields: {
      pcurve_reference: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 5,
        type: e.PCURVE,
      },
    },
    typeId: e.SEAM_EDGE,
    depth: 4,
    isAbstract: false,
    superType: e.ORIENTED_EDGE,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      purpose: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      security_level: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.SECURITY_CLASSIFICATION_LEVEL,
      },
    },
    typeId: e.SECURITY_CLASSIFICATION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.SECURITY_CLASSIFICATION_LEVEL,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.SHAPE_ASPECT_ASSOCIATIVITY,
    depth: 1,
    isAbstract: false,
    superType: e.SHAPE_ASPECT_RELATIONSHIP,
  },
  {
    fields: {
    },
    typeId: e.SHAPE_ASPECT_DERIVING_RELATIONSHIP,
    depth: 1,
    isAbstract: false,
    superType: e.SHAPE_ASPECT_RELATIONSHIP,
  },
  {
    fields: {
    },
    typeId: e.SHAPE_ASPECT_TRANSITION,
    depth: 1,
    isAbstract: false,
    superType: e.SHAPE_ASPECT_RELATIONSHIP,
  },
  {
    fields: {
    },
    typeId: e.SHAPE_DEFINING_RELATIONSHIP,
    depth: 1,
    isAbstract: false,
    superType: e.SHAPE_ASPECT_RELATIONSHIP,
  },
  {
    fields: {
    },
    typeId: e.SHAPE_DEFINITION_REPRESENTATION,
    depth: 1,
    isAbstract: false,
    superType: e.PROPERTY_DEFINITION_REPRESENTATION,
  },
  {
    fields: {
    },
    typeId: e.SHAPE_DIMENSION_REPRESENTATION,
    depth: 2,
    isAbstract: false,
    superType: e.SHAPE_REPRESENTATION,
  },
  {
    fields: {
    },
    typeId: e.SHAPE_REPRESENTATION_RELATIONSHIP,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION_RELATIONSHIP,
  },
  {
    fields: {
    },
    typeId: e.SHAPE_REPRESENTATION_WITH_PARAMETERS,
    depth: 2,
    isAbstract: false,
    superType: e.SHAPE_REPRESENTATION,
  },
  {
    fields: {
    },
    typeId: e.SIMPLE_STRING_EXPRESSION,
    depth: 3,
    isAbstract: true,
    superType: e.STRING_EXPRESSION,
    subTypes: [
       e.STRING_LITERAL,
       e.STRING_VARIABLE,
    ],
  },
  {
    fields: {
      the_value: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.STRING_LITERAL,
    depth: 4,
    isAbstract: false,
    superType: e.SIMPLE_STRING_EXPRESSION,
  },
  {
    fields: {
    },
    typeId: e.STRING_VARIABLE,
    depth: 4,
    isAbstract: false,
    superType: e.SIMPLE_STRING_EXPRESSION,
  },
  {
    fields: {
    },
    typeId: e.SIN_FUNCTION,
    depth: 5,
    isAbstract: false,
    superType: e.UNARY_FUNCTION_CALL,
  },
  {
    fields: {
    },
    typeId: e.SLIDING_CURVE_PAIR,
    depth: 3,
    isAbstract: false,
    superType: e.PLANAR_CURVE_PAIR,
  },
  {
    fields: {
      applies_to_pair: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.SLIDING_CURVE_PAIR,
      },
      actual_point_on_curve_1: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.POINT_ON_CURVE,
      },
      actual_point_on_curve_2: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.POINT_ON_CURVE,
      },
    },
    typeId: e.SLIDING_CURVE_PAIR_VALUE,
    depth: 1,
    isAbstract: false,
    superType: e.PAIR_VALUE,
  },
  {
    fields: {
    },
    typeId: e.SLIDING_SURFACE_PAIR,
    depth: 3,
    isAbstract: false,
    superType: e.SURFACE_PAIR,
  },
  {
    fields: {
      applies_to_pair: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.SLIDING_SURFACE_PAIR,
      },
      actual_point_on_surface_1: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.POINT_ON_SURFACE,
      },
      actual_point_on_surface_2: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.POINT_ON_SURFACE,
      },
      actual_rotation: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 4,
      },
    },
    typeId: e.SLIDING_SURFACE_PAIR_VALUE,
    depth: 1,
    isAbstract: false,
    superType: e.PAIR_VALUE,
  },
  {
    fields: {
    },
    typeId: e.SLOT,
    depth: 2,
    isAbstract: false,
    superType: e.FEATURE_DEFINITION,
  },
  {
    fields: {
    },
    typeId: e.SLOT_END,
    depth: 1,
    isAbstract: false,
    superType: e.SHAPE_ASPECT,
  },
  {
    fields: {
    },
    typeId: e.SOLID_ANGLE_UNIT,
    depth: 1,
    isAbstract: false,
    superType: e.NAMED_UNIT,
  },
  {
    fields: {
      directrix: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.CURVE,
      },
      radius: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
      inner_radius: {
        kind: f.NUMBER,
        optional: true,
        derived: false,
        offset: 3,
      },
      start_param: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 4,
      },
      end_param: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 5,
      },
    },
    typeId: e.SWEPT_DISK_SOLID,
    depth: 3,
    isAbstract: false,
    superType: e.SOLID_MODEL,
  },
  {
    fields: {
      parent_solid: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.SOLID_MODEL,
      },
      transformation: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.CARTESIAN_TRANSFORMATION_OPERATOR_3D,
      },
    },
    typeId: e.SOLID_REPLICA,
    depth: 3,
    isAbstract: false,
    superType: e.SOLID_MODEL,
  },
  {
    fields: {
    },
    typeId: e.SPHERICAL_PAIR,
    depth: 2,
    isAbstract: false,
    superType: e.KINEMATIC_PAIR,
  },
  {
    fields: {
      applies_to_pair: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.SPHERICAL_PAIR,
      },
      lower_limit_yaw: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
      upper_limit_yaw: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 3,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
      lower_limit_pitch: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 4,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
      upper_limit_pitch: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 5,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
      lower_limit_roll: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 6,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
      upper_limit_roll: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 7,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
    },
    typeId: e.SPHERICAL_PAIR_RANGE,
    depth: 1,
    isAbstract: false,
    superType: e.SIMPLE_PAIR_RANGE,
  },
  {
    fields: {
      applies_to_pair: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.SPHERICAL_PAIR,
      },
      input_orientation: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.YPR_ROTATION,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ROTATION_ABOUT_DIRECTION,
          },
        ],
      },
      actual_orientation: {
        kind: f.NUMBER,
        optional: false,
        derived: true,
      },
    },
    typeId: e.SPHERICAL_PAIR_VALUE,
    depth: 1,
    isAbstract: false,
    superType: e.PAIR_VALUE,
  },
  {
    fields: {
    },
    typeId: e.SQL_MAPPABLE_DEFINED_FUNCTION,
    depth: 1,
    isAbstract: true,
    superType: e.DEFINED_FUNCTION,
  },
  {
    fields: {
    },
    typeId: e.SQUARE_ROOT_FUNCTION,
    depth: 5,
    isAbstract: false,
    superType: e.UNARY_FUNCTION_CALL,
  },
  {
    fields: {
    },
    typeId: e.SQUARE_U_PROFILE,
    depth: 1,
    isAbstract: false,
    superType: e.SHAPE_ASPECT,
  },
  {
    fields: {
      uncertainty_value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
    },
    typeId: e.STANDARD_UNCERTAINTY,
    depth: 1,
    isAbstract: false,
    superType: e.UNCERTAINTY_QUALIFIER,
  },
  {
    fields: {
    },
    typeId: e.STRAIGHTNESS_TOLERANCE,
    depth: 1,
    isAbstract: false,
    superType: e.GEOMETRIC_TOLERANCE,
  },
  {
    fields: {
      operand: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: true,
        type: e.GENERIC_EXPRESSION,
      },
      index1: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: true,
        type: e.GENERIC_EXPRESSION,
      },
      index2: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: true,
        type: e.GENERIC_EXPRESSION,
      },
    },
    typeId: e.SUBSTRING_EXPRESSION,
    depth: 3,
    isAbstract: false,
    superType: e.STRING_EXPRESSION,
  },
  {
    fields: {
    },
    typeId: e.STRUCTURED_DIMENSION_CALLOUT,
    depth: 3,
    isAbstract: false,
    superType: e.DRAUGHTING_CALLOUT,
  },
  {
    fields: {
      swept_curve: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.CURVE,
      },
    },
    typeId: e.SWEPT_SURFACE,
    depth: 3,
    isAbstract: false,
    superType: e.SURFACE,
    subTypes: [
       e.SURFACE_OF_LINEAR_EXTRUSION,
       e.SURFACE_OF_REVOLUTION,
    ],
  },
  {
    fields: {
      parent_surface: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.SURFACE,
      },
      transformation: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.CARTESIAN_TRANSFORMATION_OPERATOR_3D,
      },
    },
    typeId: e.SURFACE_REPLICA,
    depth: 3,
    isAbstract: false,
    superType: e.SURFACE,
  },
  {
    fields: {
    },
    typeId: e.SURFACE_CONDITION_CALLOUT,
    depth: 3,
    isAbstract: false,
    superType: e.DRAUGHTING_CALLOUT,
  },
  {
    fields: {
      extrusion_axis: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.VECTOR,
      },
    },
    typeId: e.SURFACE_OF_LINEAR_EXTRUSION,
    depth: 4,
    isAbstract: false,
    superType: e.SWEPT_SURFACE,
  },
  {
    fields: {
      axis_position: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.AXIS1_PLACEMENT,
      },
      axis_line: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: true,
        type: e.LINE,
      },
    },
    typeId: e.SURFACE_OF_REVOLUTION,
    depth: 4,
    isAbstract: false,
    superType: e.SWEPT_SURFACE,
  },
  {
    fields: {
      applies_to_pair: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.SURFACE_PAIR,
      },
      range_on_surface_1: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.RECTANGULAR_TRIMMED_SURFACE,
      },
      range_on_surface_2: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.RECTANGULAR_TRIMMED_SURFACE,
      },
      lower_limit_actual_rotation: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 4,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
      upper_limit_actual_rotation: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 5,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
    },
    typeId: e.SURFACE_PAIR_RANGE,
    depth: 1,
    isAbstract: false,
    superType: e.SIMPLE_PAIR_RANGE,
  },
  {
    fields: {
      parent_surface: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.BOUNDED_SURFACE,
      },
      u_transition: {
        kind: f.ENUM,
        optional: false,
        derived: false,
        offset: 1,
        type: transition_code,
      },
      v_transition: {
        kind: f.ENUM,
        optional: false,
        derived: false,
        offset: 2,
        type: transition_code,
      },
      u_sense: {
        kind: f.BOOLEAN,
        optional: false,
        derived: false,
        offset: 3,
      },
      v_sense: {
        kind: f.BOOLEAN,
        optional: false,
        derived: false,
        offset: 4,
      },
      using_surfaces: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 5,
        type: e.RECTANGULAR_COMPOSITE_SURFACE,
      },
    },
    typeId: e.SURFACE_PATCH,
    depth: 1,
    isAbstract: false,
    superType: e.FOUNDED_ITEM,
  },
  {
    fields: {
    },
    typeId: e.SURFACE_PROFILE_TOLERANCE,
    depth: 1,
    isAbstract: false,
    superType: e.GEOMETRIC_TOLERANCE,
  },
  {
    fields: {
      rendered_colour: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.COLOUR,
      },
    },
    typeId: e.SURFACE_RENDERING_PROPERTIES,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      styles: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SURFACE_STYLE_FILL_AREA,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SURFACE_STYLE_BOUNDARY,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SURFACE_STYLE_SILHOUETTE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SURFACE_STYLE_SEGMENTATION_CURVE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SURFACE_STYLE_CONTROL_GRID,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SURFACE_STYLE_PARAMETER_LINE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SURFACE_STYLE_RENDERING,
          },
        ],
      },
    },
    typeId: e.SURFACE_SIDE_STYLE,
    depth: 1,
    isAbstract: false,
    superType: e.FOUNDED_ITEM,
  },
  {
    fields: {
      style_of_boundary: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 0,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CURVE_STYLE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CURVE_STYLE_RENDERING,
          },
        ],
      },
    },
    typeId: e.SURFACE_STYLE_BOUNDARY,
    depth: 1,
    isAbstract: false,
    superType: e.FOUNDED_ITEM,
  },
  {
    fields: {
      style_of_control_grid: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 0,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CURVE_STYLE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CURVE_STYLE_RENDERING,
          },
        ],
      },
    },
    typeId: e.SURFACE_STYLE_CONTROL_GRID,
    depth: 1,
    isAbstract: false,
    superType: e.FOUNDED_ITEM,
  },
  {
    fields: {
      fill_area: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.FILL_AREA_STYLE,
      },
    },
    typeId: e.SURFACE_STYLE_FILL_AREA,
    depth: 1,
    isAbstract: false,
    superType: e.FOUNDED_ITEM,
  },
  {
    fields: {
      style_of_parameter_lines: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 0,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CURVE_STYLE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CURVE_STYLE_RENDERING,
          },
        ],
      },
      direction_counts: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.U_DIRECTION_COUNT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.V_DIRECTION_COUNT,
          },
        ],
      },
    },
    typeId: e.SURFACE_STYLE_PARAMETER_LINE,
    depth: 1,
    isAbstract: false,
    superType: e.FOUNDED_ITEM,
  },
  {
    fields: {
      ambient_reflectance: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.SURFACE_STYLE_REFLECTANCE_AMBIENT,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      diffuse_reflectance: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 1,
      },
    },
    typeId: e.SURFACE_STYLE_REFLECTANCE_AMBIENT_DIFFUSE,
    depth: 1,
    isAbstract: false,
    superType: e.SURFACE_STYLE_REFLECTANCE_AMBIENT,
  },
  {
    fields: {
      specular_reflectance: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
      specular_exponent: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 3,
      },
      specular_colour: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 4,
        type: e.COLOUR,
      },
    },
    typeId: e.SURFACE_STYLE_REFLECTANCE_AMBIENT_DIFFUSE_SPECULAR,
    depth: 2,
    isAbstract: false,
    superType: e.SURFACE_STYLE_REFLECTANCE_AMBIENT_DIFFUSE,
  },
  {
    fields: {
      rendering_method: {
        kind: f.ENUM,
        optional: false,
        derived: false,
        offset: 0,
        type: shading_surface_method,
      },
      surface_colour: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.COLOUR,
      },
    },
    typeId: e.SURFACE_STYLE_RENDERING,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      properties: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SURFACE_STYLE_REFLECTANCE_AMBIENT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SURFACE_STYLE_TRANSPARENT,
          },
        ],
      },
    },
    typeId: e.SURFACE_STYLE_RENDERING_WITH_PROPERTIES,
    depth: 1,
    isAbstract: false,
    superType: e.SURFACE_STYLE_RENDERING,
  },
  {
    fields: {
      style_of_segmentation_curve: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 0,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CURVE_STYLE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CURVE_STYLE_RENDERING,
          },
        ],
      },
    },
    typeId: e.SURFACE_STYLE_SEGMENTATION_CURVE,
    depth: 1,
    isAbstract: false,
    superType: e.FOUNDED_ITEM,
  },
  {
    fields: {
      style_of_silhouette: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 0,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CURVE_STYLE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CURVE_STYLE_RENDERING,
          },
        ],
      },
    },
    typeId: e.SURFACE_STYLE_SILHOUETTE,
    depth: 1,
    isAbstract: false,
    superType: e.FOUNDED_ITEM,
  },
  {
    fields: {
      transparency: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.SURFACE_STYLE_TRANSPARENT,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      side: {
        kind: f.ENUM,
        optional: false,
        derived: false,
        offset: 0,
        type: surface_side,
      },
      style: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SURFACE_SIDE_STYLE,
          },
        ],
      },
    },
    typeId: e.SURFACE_STYLE_USAGE,
    depth: 1,
    isAbstract: false,
    superType: e.FOUNDED_ITEM,
  },
  {
    fields: {
    },
    typeId: e.SURFACE_TEXTURE_REPRESENTATION,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION,
  },
  {
    fields: {
      colour_of_symbol: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.COLOUR,
      },
    },
    typeId: e.SYMBOL_COLOUR,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      mapped_representation: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.SYMBOL_REPRESENTATION,
      },
      mapping_origin: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 3,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.AXIS2_PLACEMENT_2D,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.AXIS2_PLACEMENT_3D,
          },
        ],
      },
    },
    typeId: e.SYMBOL_REPRESENTATION_MAP,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION_MAP,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      style_of_symbol: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.SYMBOL_COLOUR,
          },
        ],
      },
    },
    typeId: e.SYMBOL_STYLE,
    depth: 1,
    isAbstract: false,
    superType: e.FOUNDED_ITEM,
  },
  {
    fields: {
      placement: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.AXIS2_PLACEMENT_2D,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.AXIS2_PLACEMENT_3D,
          },
        ],
      },
      x_scale: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
      y_scale: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 3,
      },
    },
    typeId: e.SYMBOL_TARGET,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_REPRESENTATION_ITEM,
  },
  {
    fields: {
      basis_relationships: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 4,
        type: e.SHAPE_ASPECT_RELATIONSHIP,
      },
    },
    typeId: e.SYMMETRIC_SHAPE_ASPECT,
    depth: 1,
    isAbstract: false,
    superType: e.SHAPE_ASPECT,
  },
  {
    fields: {
    },
    typeId: e.SYMMETRY_TOLERANCE,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_TOLERANCE_WITH_DATUM_REFERENCE,
  },
  {
    fields: {
    },
    typeId: e.TACTILE_APPEARANCE_REPRESENTATION,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION,
  },
  {
    fields: {
    },
    typeId: e.TAN_FUNCTION,
    depth: 5,
    isAbstract: false,
    superType: e.UNARY_FUNCTION_CALL,
  },
  {
    fields: {
    },
    typeId: e.TAPER,
    depth: 1,
    isAbstract: false,
    superType: e.SHAPE_ASPECT,
  },
  {
    fields: {
    },
    typeId: e.TEE_PROFILE,
    depth: 1,
    isAbstract: false,
    superType: e.SHAPE_ASPECT,
  },
  {
    fields: {
      associated_curves: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 6,
        type: e.CURVE,
      },
    },
    typeId: e.TEXT_LITERAL_WITH_ASSOCIATED_CURVES,
    depth: 3,
    isAbstract: false,
    superType: e.TEXT_LITERAL,
  },
  {
    fields: {
      blanking: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 6,
        type: e.PLANAR_BOX,
      },
    },
    typeId: e.TEXT_LITERAL_WITH_BLANKING_BOX,
    depth: 3,
    isAbstract: false,
    superType: e.TEXT_LITERAL,
  },
  {
    fields: {
      extent: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 6,
        type: e.PLANAR_EXTENT,
      },
    },
    typeId: e.TEXT_LITERAL_WITH_EXTENT,
    depth: 3,
    isAbstract: false,
    superType: e.TEXT_LITERAL,
  },
  {
    fields: {
      items: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 3,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.TEXT_LITERAL,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ANNOTATION_TEXT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.ANNOTATION_TEXT_CHARACTER,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DEFINED_CHARACTER_GLYPH,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.COMPOSITE_TEXT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.AXIS2_PLACEMENT_2D,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.AXIS2_PLACEMENT_3D,
          },
        ],
      },
    },
    typeId: e.TEXT_STRING_REPRESENTATION,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      character_appearance: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 1,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.TEXT_STYLE_FOR_DEFINED_FONT,
          },
        ],
      },
    },
    typeId: e.TEXT_STYLE,
    depth: 1,
    isAbstract: false,
    superType: e.FOUNDED_ITEM,
  },
  {
    fields: {
      text_colour: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.COLOUR,
      },
    },
    typeId: e.TEXT_STYLE_FOR_DEFINED_FONT,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      characteristics: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.BOX_HEIGHT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.BOX_WIDTH,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.BOX_SLANT_ANGLE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.BOX_ROTATE_ANGLE,
          },
        ],
      },
    },
    typeId: e.TEXT_STYLE_WITH_BOX_CHARACTERISTICS,
    depth: 2,
    isAbstract: false,
    superType: e.TEXT_STYLE,
  },
  {
    fields: {
      mirror_placement: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.AXIS2_PLACEMENT_2D,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.AXIS2_PLACEMENT_3D,
          },
        ],
      },
    },
    typeId: e.TEXT_STYLE_WITH_MIRROR,
    depth: 2,
    isAbstract: false,
    superType: e.TEXT_STYLE,
  },
  {
    fields: {
      character_spacing: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.LENGTH_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.RATIO_MEASURE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.MEASURE_WITH_UNIT,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DESCRIPTIVE_MEASURE,
          },
        ],
      },
    },
    typeId: e.TEXT_STYLE_WITH_SPACING,
    depth: 2,
    isAbstract: false,
    superType: e.TEXT_STYLE,
  },
  {
    fields: {
    },
    typeId: e.THERMODYNAMIC_TEMPERATURE_UNIT,
    depth: 1,
    isAbstract: false,
    superType: e.NAMED_UNIT,
  },
  {
    fields: {
    },
    typeId: e.THREAD,
    depth: 2,
    isAbstract: false,
    superType: e.FEATURE_DEFINITION,
  },
  {
    fields: {
      id: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 2,
      },
    },
    typeId: e.TIME_INTERVAL,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 1,
      },
    },
    typeId: e.TIME_INTERVAL_ROLE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      primary_bound: {
        kind: f.SELECT,
        optional: true,
        derived: false,
        offset: 3,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DATE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DATE_AND_TIME,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.LOCAL_TIME,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EVENT_OCCURRENCE,
          },
        ],
      },
      secondary_bound: {
        kind: f.SELECT,
        optional: true,
        derived: false,
        offset: 4,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DATE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.DATE_AND_TIME,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.LOCAL_TIME,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EVENT_OCCURRENCE,
          },
        ],
      },
      duration: {
        kind: f.STEP_REFERENCE,
        optional: true,
        derived: false,
        offset: 5,
        type: e.TIME_MEASURE_WITH_UNIT,
      },
    },
    typeId: e.TIME_INTERVAL_WITH_BOUNDS,
    depth: 1,
    isAbstract: false,
    superType: e.TIME_INTERVAL,
  },
  {
    fields: {
    },
    typeId: e.TIME_UNIT,
    depth: 1,
    isAbstract: false,
    superType: e.NAMED_UNIT,
  },
  {
    fields: {
      lower_bound: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 0,
        type: e.MEASURE_WITH_UNIT,
      },
      upper_bound: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.MEASURE_WITH_UNIT,
      },
    },
    typeId: e.TOLERANCE_VALUE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      defining_tolerance: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 4,
        type: e.GEOMETRIC_TOLERANCE,
      },
      form: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 5,
        type: e.TOLERANCE_ZONE_FORM,
      },
    },
    typeId: e.TOLERANCE_ZONE,
    depth: 1,
    isAbstract: false,
    superType: e.SHAPE_ASPECT,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.TOLERANCE_ZONE_FORM,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
    },
    typeId: e.VERTEX,
    depth: 2,
    isAbstract: false,
    superType: e.TOPOLOGICAL_REPRESENTATION_ITEM,
  },
  {
    fields: {
    },
    typeId: e.TOTAL_RUNOUT_TOLERANCE,
    depth: 2,
    isAbstract: false,
    superType: e.GEOMETRIC_TOLERANCE_WITH_DATUM_REFERENCE,
  },
  {
    fields: {
      second_repeat_factor: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.VECTOR,
      },
    },
    typeId: e.TWO_DIRECTION_REPEAT_FACTOR,
    depth: 3,
    isAbstract: false,
    superType: e.ONE_DIRECTION_REPEAT_FACTOR,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.TYPE_QUALIFIER,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      uncertainty: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 3,
        type: e.UNCERTAINTY_MEASURE_WITH_UNIT,
      },
    },
    typeId: e.UNCERTAINTY_ASSIGNED_REPRESENTATION,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION,
  },
  {
    fields: {
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 2,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 3,
      },
    },
    typeId: e.UNCERTAINTY_MEASURE_WITH_UNIT,
    depth: 1,
    isAbstract: false,
    superType: e.MEASURE_WITH_UNIT,
  },
  {
    fields: {
    },
    typeId: e.UNCONSTRAINED_PAIR,
    depth: 2,
    isAbstract: false,
    superType: e.KINEMATIC_PAIR,
  },
  {
    fields: {
      applies_to_pair: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.UNCONSTRAINED_PAIR,
      },
      actual_placement: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 2,
        type: e.AXIS2_PLACEMENT_3D,
      },
    },
    typeId: e.UNCONSTRAINED_PAIR_VALUE,
    depth: 1,
    isAbstract: false,
    superType: e.PAIR_VALUE,
  },
  {
    fields: {
      applies_to_pair: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.UNIVERSAL_PAIR,
      },
      lower_limit_first_rotation: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 2,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
      upper_limit_first_rotation: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 3,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
      lower_limit_second_rotation: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 4,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
      upper_limit_second_rotation: {
        kind: f.SELECT,
        optional: false,
        derived: false,
        offset: 5,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PLANE_ANGLE_MEASURE,
          },
          {
            kind: f.ENUM,
            optional: false,
            derived: false,
            type: unlimited_range,
          },
        ],
      },
    },
    typeId: e.UNIVERSAL_PAIR_RANGE,
    depth: 1,
    isAbstract: false,
    superType: e.SIMPLE_PAIR_RANGE,
  },
  {
    fields: {
      applies_to_pair: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.UNIVERSAL_PAIR,
      },
      first_rotation_angle: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
      second_rotation_angle: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 3,
      },
    },
    typeId: e.UNIVERSAL_PAIR_VALUE,
    depth: 1,
    isAbstract: false,
    superType: e.PAIR_VALUE,
  },
  {
    fields: {
    },
    typeId: e.VALUE_RANGE,
    depth: 2,
    isAbstract: false,
    superType: e.COMPOUND_REPRESENTATION_ITEM,
  },
  {
    fields: {
    },
    typeId: e.VECTOR_STYLE,
    depth: 3,
    isAbstract: false,
    superType: e.PRE_DEFINED_TERMINATOR_SYMBOL,
  },
  {
    fields: {
    },
    typeId: e.VEE_PROFILE,
    depth: 1,
    isAbstract: false,
    superType: e.SHAPE_ASPECT,
  },
  {
    fields: {
      id: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      version: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      purpose: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 2,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 3,
      },
    },
    typeId: e.VERSIONED_ACTION_REQUEST,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      id: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
      name: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 1,
      },
      description: {
        kind: f.STRING,
        optional: true,
        derived: false,
        offset: 2,
      },
      relating_versioned_action_request: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 3,
        type: e.VERSIONED_ACTION_REQUEST,
      },
      related_versioned_action_request: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 4,
        type: e.VERSIONED_ACTION_REQUEST,
      },
    },
    typeId: e.VERSIONED_ACTION_REQUEST_RELATIONSHIP,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      projection_type: {
        kind: f.ENUM,
        optional: false,
        derived: false,
        offset: 0,
        type: central_or_parallel,
      },
      projection_point: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 1,
        type: e.CARTESIAN_POINT,
      },
      view_plane_distance: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 2,
      },
      front_plane_distance: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 3,
      },
      front_plane_clipping: {
        kind: f.BOOLEAN,
        optional: false,
        derived: false,
        offset: 4,
      },
      back_plane_distance: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 5,
      },
      back_plane_clipping: {
        kind: f.BOOLEAN,
        optional: false,
        derived: false,
        offset: 6,
      },
      view_volume_sides_clipping: {
        kind: f.BOOLEAN,
        optional: false,
        derived: false,
        offset: 7,
      },
      view_window: {
        kind: f.STEP_REFERENCE,
        optional: false,
        derived: false,
        offset: 8,
        type: e.PLANAR_BOX,
      },
    },
    typeId: e.VIEW_VOLUME,
    depth: 1,
    isAbstract: false,
    superType: e.FOUNDED_ITEM,
  },
  {
    fields: {
    },
    typeId: e.VISUAL_APPEARANCE_REPRESENTATION,
    depth: 1,
    isAbstract: false,
    superType: e.REPRESENTATION,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.AMOUNT_OF_SUBSTANCE_MEASURE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.AREA_MEASURE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.BOX_HEIGHT,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.BOX_ROTATE_ANGLE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.BOX_SLANT_ANGLE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.BOX_WIDTH,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.CELSIUS_TEMPERATURE_MEASURE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.CONTEXT_DEPENDENT_MEASURE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.COUNT_MEASURE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.CURVE_TOLERANCE_DEVIATION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.CURVE_TOLERANCE_PARAMETER,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.DAY_IN_MONTH_NUMBER,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.DESCRIPTIVE_MEASURE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.DIMENSION_COUNT,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.ELECTRIC_CURRENT_MEASURE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.HOUR_IN_DAY,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.IDENTIFIER,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.LABEL,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.LENGTH_MEASURE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 0,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EDGE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PATH,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.FACE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.FACE_BOUND,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CLOSED_SHELL,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.OPEN_SHELL,
          },
        ],
      },
    },
    typeId: e.LIST_OF_REVERSIBLE_TOPOLOGY_ITEM,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 0,
        type: e.REPRESENTATION_ITEM,
      },
    },
    typeId: e.LIST_REPRESENTATION_ITEM,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.LUMINOUS_INTENSITY_MEASURE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.MASS_MEASURE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.MINUTE_IN_HOUR,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.MONTH_IN_YEAR_NUMBER,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.NON_NEGATIVE_LENGTH_MEASURE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.NUMERIC_MEASURE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.PARAMETER_VALUE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.PLANE_ANGLE_MEASURE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.POSITIVE_LENGTH_MEASURE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.POSITIVE_PLANE_ANGLE_MEASURE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.POSITIVE_RATIO_MEASURE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.PRESENTABLE_TEXT,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.RATIO_MEASURE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.SECOND_IN_MINUTE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.SELECT,
        rank: 1,
        optional: false,
        derived: false,
        offset: 0,
        options: [
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.EDGE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.PATH,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.FACE,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.FACE_BOUND,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.CLOSED_SHELL,
          },
          {
            kind: f.STEP_REFERENCE,
            optional: false,
            derived: false,
            type: e.OPEN_SHELL,
          },
        ],
      },
    },
    typeId: e.SET_OF_REVERSIBLE_TOPOLOGY_ITEM,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.STEP_REFERENCE,
        rank: 1,
        optional: false,
        derived: false,
        offset: 0,
        type: e.REPRESENTATION_ITEM,
      },
    },
    typeId: e.SET_REPRESENTATION_ITEM,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.SOLID_ANGLE_MEASURE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.SURFACE_TOLERANCE_DEVIATION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.SURFACE_TOLERANCE_PARAMETER,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.TEXT,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.TEXT_ALIGNMENT,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.STRING,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.TEXT_DELINEATION,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.THERMODYNAMIC_TEMPERATURE_MEASURE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.TIME_MEASURE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.U_DIRECTION_COUNT,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.V_DIRECTION_COUNT,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.VOLUME_MEASURE,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.YEAR_NUMBER,
    depth: 0,
    isAbstract: false,
  },
  {
    fields: {
      Value: {
        kind: f.NUMBER,
        rank: 1,
        optional: false,
        derived: false,
        offset: 0,
      },
    },
    typeId: e.YPR_ROTATION,
    depth: 0,
    isAbstract: false,
  },
]
let parser =
  new StepParser< EntityTypesAP214 >( EntityTypesAP214Search )

let SchemaAP214 =
  new StepEntitySchema< EntityTypesAP214 >( constructors, parser, queries, descriptions )

export default SchemaAP214
