
import { text } from "./index"
import { action_request_solution } from "./index"
import { application_context } from "./index"
import { approval_role } from "./index"
import { configuration_design } from "./index"
import { date_role } from "./index"
import { date_time_role } from "./index"
import { context_dependent_shape_representation } from "./index"
import { effectivity } from "./index"
import { external_source } from "./index"
import { organization_role } from "./index"
import { person_and_organization_role } from "./index"
import { person_and_organization } from "./index"
import { property_definition_representation } from "./index"
import { representation } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class description_attribute extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.DESCRIPTION_ATTRIBUTE
  }
  private attribute_value_? : string
  private described_item_? : action_request_solution | application_context | approval_role | configuration_design | date_role | date_time_role | context_dependent_shape_representation | effectivity | external_source | organization_role | person_and_organization_role | person_and_organization | property_definition_representation | representation

  public get attribute_value() : string {
    if ( this.attribute_value_ === void 0 ) {
      this.attribute_value_ = this.extractString( 0, 0, 0, false )
    }

    return this.attribute_value_ as string
  }

  public get described_item() : action_request_solution | application_context | approval_role | configuration_design | date_role | date_time_role | context_dependent_shape_representation | effectivity | external_source | organization_role | person_and_organization_role | person_and_organization | property_definition_representation | representation {
    if ( this.described_item_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 1, 0, 0, false )

      if ( !( value instanceof action_request_solution ) && !( value instanceof application_context ) && !( value instanceof approval_role ) && !( value instanceof configuration_design ) && !( value instanceof date_role ) && !( value instanceof date_time_role ) && !( value instanceof context_dependent_shape_representation ) && !( value instanceof effectivity ) && !( value instanceof external_source ) && !( value instanceof organization_role ) && !( value instanceof person_and_organization_role ) && !( value instanceof person_and_organization ) && !( value instanceof property_definition_representation ) && !( value instanceof representation ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.described_item_ = value as (action_request_solution | application_context | approval_role | configuration_design | date_role | date_time_role | context_dependent_shape_representation | effectivity | external_source | organization_role | person_and_organization_role | person_and_organization | property_definition_representation | representation)

    }

    return this.described_item_ as action_request_solution | application_context | approval_role | configuration_design | date_role | date_time_role | context_dependent_shape_representation | effectivity | external_source | organization_role | person_and_organization_role | person_and_organization | property_definition_representation | representation
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === description_attribute.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for description_attribute" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.DESCRIPTION_ATTRIBUTE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.DESCRIPTION_ATTRIBUTE
}
