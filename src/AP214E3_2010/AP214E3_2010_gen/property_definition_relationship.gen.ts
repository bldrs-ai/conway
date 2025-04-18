
import { label } from "./index"
import { text } from "./index"
import { property_definition } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class property_definition_relationship extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.PROPERTY_DEFINITION_RELATIONSHIP
  }
  private name_? : string
  private description_? : string
  private relating_property_definition_? : property_definition
  private related_property_definition_? : property_definition

  public get name() : string {
    if ( this.name_ === void 0 ) {
      this.name_ = this.extractString( 0, false )
    }

    return this.name_ as string
  }

  public get description() : string {
    if ( this.description_ === void 0 ) {
      this.description_ = this.extractString( 1, false )
    }

    return this.description_ as string
  }

  public get relating_property_definition() : property_definition {
    if ( this.relating_property_definition_ === void 0 ) {
      this.relating_property_definition_ = this.extractElement( 2, false, property_definition )
    }

    return this.relating_property_definition_ as property_definition
  }

  public get related_property_definition() : property_definition {
    if ( this.related_property_definition_ === void 0 ) {
      this.related_property_definition_ = this.extractElement( 3, false, property_definition )
    }

    return this.related_property_definition_ as property_definition
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.PROPERTY_DEFINITION_RELATIONSHIP ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.PROPERTY_DEFINITION_RELATIONSHIP
}
