
import { label } from "./index"
import { text } from "./index"
import { action } from "./index"
import { action_method } from "./index"
import { action_method_relationship } from "./index"
import { action_relationship } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class action_property extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.ACTION_PROPERTY
  }
  private name_? : string
  private description_? : string
  private definition_? : action | action_method | action_method_relationship | action_relationship

  public get name() : string {
    if ( this.name_ === void 0 ) {
      this.name_ = this.extractString( 0, 0, 0, false )
    }

    return this.name_ as string
  }

  public get description() : string {
    if ( this.description_ === void 0 ) {
      this.description_ = this.extractString( 1, 0, 0, false )
    }

    return this.description_ as string
  }

  public get definition() : action | action_method | action_method_relationship | action_relationship {
    if ( this.definition_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 2, 0, 0, false )

      if ( !( value instanceof action ) && !( value instanceof action_method ) && !( value instanceof action_method_relationship ) && !( value instanceof action_relationship ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.definition_ = value as (action | action_method | action_method_relationship | action_relationship)

    }

    return this.definition_ as action | action_method | action_method_relationship | action_relationship
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === action_property.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for action_property" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.ACTION_PROPERTY ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.ACTION_PROPERTY
}
