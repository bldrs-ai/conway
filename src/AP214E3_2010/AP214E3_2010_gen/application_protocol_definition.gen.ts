
import { label } from "./index"
import { year_number } from "./index"
import { application_context } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class application_protocol_definition extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.APPLICATION_PROTOCOL_DEFINITION
  }
  private status_? : string
  private application_interpreted_model_schema_name_? : string
  private application_protocol_year_? : number
  private application_? : application_context

  public get status() : string {
    if ( this.status_ === void 0 ) {
      this.status_ = this.extractString( 0, 0, 0, false )
    }

    return this.status_ as string
  }

  public get application_interpreted_model_schema_name() : string {
    if ( this.application_interpreted_model_schema_name_ === void 0 ) {
      this.application_interpreted_model_schema_name_ = this.extractString( 1, 0, 0, false )
    }

    return this.application_interpreted_model_schema_name_ as string
  }

  public get application_protocol_year() : number {
    if ( this.application_protocol_year_ === void 0 ) {
      this.application_protocol_year_ = this.extractNumber( 2, 0, 0, false )
    }

    return this.application_protocol_year_ as number
  }

  public get application() : application_context {
    if ( this.application_ === void 0 ) {
      this.application_ = this.extractElement( 3, 0, 0, false, application_context )
    }

    return this.application_ as application_context
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === application_protocol_definition.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for application_protocol_definition" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.APPLICATION_PROTOCOL_DEFINITION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.APPLICATION_PROTOCOL_DEFINITION
}
