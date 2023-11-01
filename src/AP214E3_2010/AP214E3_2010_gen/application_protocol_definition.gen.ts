
import { label } from "./index"
import { year_number } from "./index"
import { application_context } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/application_protocol_definition.htm */
export  class application_protocol_definition extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.APPLICATION_PROTOCOL_DEFINITION
  }
  private status_? : string
  private application_interpreted_model_schema_name_? : string
  private application_protocol_year_? : number
  private application_? : application_context

  public get status() : string {
    if ( this.status_ === void 0 ) {
      this.status_ = this.extractString( 0, false )
    }

    return this.status_ as string
  }

  public get application_interpreted_model_schema_name() : string {
    if ( this.application_interpreted_model_schema_name_ === void 0 ) {
      this.application_interpreted_model_schema_name_ = this.extractString( 1, false )
    }

    return this.application_interpreted_model_schema_name_ as string
  }

  public get application_protocol_year() : number {
    if ( this.application_protocol_year_ === void 0 ) {
      this.application_protocol_year_ = this.extractNumber( 2, false )
    }

    return this.application_protocol_year_ as number
  }

  public get application() : application_context {
    if ( this.application_ === void 0 ) {
      this.application_ = this.extractElement( 3, false, application_context )
    }

    return this.application_ as application_context
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.APPLICATION_PROTOCOL_DEFINITION ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.APPLICATION_PROTOCOL_DEFINITION
}
