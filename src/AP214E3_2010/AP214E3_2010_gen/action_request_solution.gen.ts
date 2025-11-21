
import { action_method } from "./index"
import { versioned_action_request } from "./index"
import { text } from "./index"
import { label } from "./index"
import {
  get_name_value,
  get_description_value,
} from '../ap214_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class action_request_solution extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.ACTION_REQUEST_SOLUTION
  }
  private method_? : action_method
  private request_? : versioned_action_request

  public get method() : action_method {
    if ( this.method_ === void 0 ) {
      this.method_ = this.extractElement( 0, 0, 0, false, action_method )
    }

    return this.method_ as action_method
  }

  public get request() : versioned_action_request {
    if ( this.request_ === void 0 ) {
      this.request_ = this.extractElement( 1, 0, 0, false, versioned_action_request )
    }

    return this.request_ as versioned_action_request
  }

  public get description() : string {
    return get_description_value(this);
  }

  public get name() : string {
    return get_name_value(this);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === action_request_solution.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for action_request_solution" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.ACTION_REQUEST_SOLUTION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.ACTION_REQUEST_SOLUTION
}
