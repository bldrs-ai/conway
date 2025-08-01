
import { label } from "./index"
import { executed_action } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class action_status extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.ACTION_STATUS
  }
  private status_? : string
  private assigned_action_? : executed_action

  public get status() : string {
    if ( this.status_ === void 0 ) {
      this.status_ = this.extractString( 0, 0, 0, false )
    }

    return this.status_ as string
  }

  public get assigned_action() : executed_action {
    if ( this.assigned_action_ === void 0 ) {
      this.assigned_action_ = this.extractElement( 1, 0, 0, false, executed_action )
    }

    return this.assigned_action_ as executed_action
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === action_status.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for action_status" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.ACTION_STATUS ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.ACTION_STATUS
}
