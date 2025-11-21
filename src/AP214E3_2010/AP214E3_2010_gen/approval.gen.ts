
import { approval_status } from "./index"
import { label } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class approval extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.APPROVAL
  }
  private status_? : approval_status
  private level_? : string

  public get status() : approval_status {
    if ( this.status_ === void 0 ) {
      this.status_ = this.extractElement( 0, 0, 0, false, approval_status )
    }

    return this.status_ as approval_status
  }

  public get level() : string {
    if ( this.level_ === void 0 ) {
      this.level_ = this.extractString( 1, 0, 0, false )
    }

    return this.level_ as string
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === approval.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for approval" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.APPROVAL ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.APPROVAL
}
