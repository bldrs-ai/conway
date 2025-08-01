
import { versioned_action_request } from "./index"
import { object_role } from "./index"
import {
  get_role,
} from '../ap214_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class action_request_assignment extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.ACTION_REQUEST_ASSIGNMENT
  }
  private assigned_action_request_? : versioned_action_request

  public get assigned_action_request() : versioned_action_request {
    if ( this.assigned_action_request_ === void 0 ) {
      this.assigned_action_request_ = this.extractElement( 0, 0, 0, false, versioned_action_request )
    }

    return this.assigned_action_request_ as versioned_action_request
  }

  public get role() : object_role {
    return get_role(this);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === action_request_assignment.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for action_request_assignment" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query: EntityTypesAP214[] = 
    [  ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.ACTION_REQUEST_ASSIGNMENT
}
