
import { amount_of_substance_measure } from "./index"
import { area_measure } from "./index"
import { celsius_temperature_measure } from "./index"
import { context_dependent_measure } from "./index"
import { count_measure } from "./index"
import { descriptive_measure } from "./index"
import { electric_current_measure } from "./index"
import { length_measure } from "./index"
import { luminous_intensity_measure } from "./index"
import { mass_measure } from "./index"
import { numeric_measure } from "./index"
import { non_negative_length_measure } from "./index"
import { parameter_value } from "./index"
import { plane_angle_measure } from "./index"
import { positive_length_measure } from "./index"
import { positive_plane_angle_measure } from "./index"
import { positive_ratio_measure } from "./index"
import { ratio_measure } from "./index"
import { solid_angle_measure } from "./index"
import { thermodynamic_temperature_measure } from "./index"
import { time_measure } from "./index"
import { volume_measure } from "./index"
import { derived_unit } from "./index"
import { named_unit } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class measure_with_unit extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.MEASURE_WITH_UNIT
  }
  private value_component_? : amount_of_substance_measure | area_measure | celsius_temperature_measure | context_dependent_measure | count_measure | descriptive_measure | electric_current_measure | length_measure | luminous_intensity_measure | mass_measure | numeric_measure | non_negative_length_measure | parameter_value | plane_angle_measure | positive_length_measure | positive_plane_angle_measure | positive_ratio_measure | ratio_measure | solid_angle_measure | thermodynamic_temperature_measure | time_measure | volume_measure
  private unit_component_? : derived_unit | named_unit

  public get value_component() : amount_of_substance_measure | area_measure | celsius_temperature_measure | context_dependent_measure | count_measure | descriptive_measure | electric_current_measure | length_measure | luminous_intensity_measure | mass_measure | numeric_measure | non_negative_length_measure | parameter_value | plane_angle_measure | positive_length_measure | positive_plane_angle_measure | positive_ratio_measure | ratio_measure | solid_angle_measure | thermodynamic_temperature_measure | time_measure | volume_measure {
    if ( this.value_component_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 0, 0, 0, false )

      if ( !( value instanceof amount_of_substance_measure ) && !( value instanceof area_measure ) && !( value instanceof celsius_temperature_measure ) && !( value instanceof context_dependent_measure ) && !( value instanceof count_measure ) && !( value instanceof descriptive_measure ) && !( value instanceof electric_current_measure ) && !( value instanceof length_measure ) && !( value instanceof luminous_intensity_measure ) && !( value instanceof mass_measure ) && !( value instanceof numeric_measure ) && !( value instanceof non_negative_length_measure ) && !( value instanceof parameter_value ) && !( value instanceof plane_angle_measure ) && !( value instanceof positive_length_measure ) && !( value instanceof positive_plane_angle_measure ) && !( value instanceof positive_ratio_measure ) && !( value instanceof ratio_measure ) && !( value instanceof solid_angle_measure ) && !( value instanceof thermodynamic_temperature_measure ) && !( value instanceof time_measure ) && !( value instanceof volume_measure ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.value_component_ = value as (amount_of_substance_measure | area_measure | celsius_temperature_measure | context_dependent_measure | count_measure | descriptive_measure | electric_current_measure | length_measure | luminous_intensity_measure | mass_measure | numeric_measure | non_negative_length_measure | parameter_value | plane_angle_measure | positive_length_measure | positive_plane_angle_measure | positive_ratio_measure | ratio_measure | solid_angle_measure | thermodynamic_temperature_measure | time_measure | volume_measure)

    }

    return this.value_component_ as amount_of_substance_measure | area_measure | celsius_temperature_measure | context_dependent_measure | count_measure | descriptive_measure | electric_current_measure | length_measure | luminous_intensity_measure | mass_measure | numeric_measure | non_negative_length_measure | parameter_value | plane_angle_measure | positive_length_measure | positive_plane_angle_measure | positive_ratio_measure | ratio_measure | solid_angle_measure | thermodynamic_temperature_measure | time_measure | volume_measure
  }

  public get unit_component() : derived_unit | named_unit {
    if ( this.unit_component_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 1, 0, 0, false )

      if ( !( value instanceof derived_unit ) && !( value instanceof named_unit ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.unit_component_ = value as (derived_unit | named_unit)

    }

    return this.unit_component_ as derived_unit | named_unit
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === measure_with_unit.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for measure_with_unit" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.MEASURE_WITH_UNIT, EntityTypesAP214.LENGTH_MEASURE_WITH_UNIT, EntityTypesAP214.MASS_MEASURE_WITH_UNIT, EntityTypesAP214.TIME_MEASURE_WITH_UNIT, EntityTypesAP214.ELECTRIC_CURRENT_MEASURE_WITH_UNIT, EntityTypesAP214.THERMODYNAMIC_TEMPERATURE_MEASURE_WITH_UNIT, EntityTypesAP214.CELSIUS_TEMPERATURE_MEASURE_WITH_UNIT, EntityTypesAP214.AMOUNT_OF_SUBSTANCE_MEASURE_WITH_UNIT, EntityTypesAP214.LUMINOUS_INTENSITY_MEASURE_WITH_UNIT, EntityTypesAP214.PLANE_ANGLE_MEASURE_WITH_UNIT, EntityTypesAP214.SOLID_ANGLE_MEASURE_WITH_UNIT, EntityTypesAP214.AREA_MEASURE_WITH_UNIT, EntityTypesAP214.VOLUME_MEASURE_WITH_UNIT, EntityTypesAP214.RATIO_MEASURE_WITH_UNIT ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.MEASURE_WITH_UNIT
}
