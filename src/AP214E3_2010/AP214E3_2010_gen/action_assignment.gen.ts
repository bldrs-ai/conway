
import { action } from "./index"
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
export abstract class action_assignment extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.ACTION_ASSIGNMENT
  }
  private assigned_action_? : action

  public get assigned_action() : action {
    if ( this.assigned_action_ === void 0 ) {
      this.assigned_action_ = this.extractElement( 0, false, action )
    }

    return this.assigned_action_ as action
  }

  public get role() : object_role {
    return get_role(this);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query: EntityTypesAP214[] = 
    [  ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.ACTION_ASSIGNMENT
}
