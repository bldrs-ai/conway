
import { label } from "./index"
import { executed_action } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/action_status.htm */
export  class action_status extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.ACTION_STATUS
  }
  private status_? : string
  private assigned_action_? : executed_action

  public get status() : string {
    if ( this.status_ === void 0 ) {
      this.status_ = this.extractString( 0, false )
    }

    return this.status_ as string
  }

  public get assigned_action() : executed_action {
    if ( this.assigned_action_ === void 0 ) {
      this.assigned_action_ = this.extractElement( 1, false, executed_action )
    }

    return this.assigned_action_ as executed_action
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.ACTION_STATUS ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.ACTION_STATUS
}