
import { document_usage_constraint } from "./index"
import { document_usage_role } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class document_usage_constraint_assignment extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.DOCUMENT_USAGE_CONSTRAINT_ASSIGNMENT
  }
  private assigned_document_usage_? : document_usage_constraint
  private role_? : document_usage_role

  public get assigned_document_usage() : document_usage_constraint {
    if ( this.assigned_document_usage_ === void 0 ) {
      this.assigned_document_usage_ = this.extractElement( 0, 0, 0, false, document_usage_constraint )
    }

    return this.assigned_document_usage_ as document_usage_constraint
  }

  public get role() : document_usage_role {
    if ( this.role_ === void 0 ) {
      this.role_ = this.extractElement( 1, 0, 0, false, document_usage_role )
    }

    return this.role_ as document_usage_role
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === document_usage_constraint_assignment.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for document_usage_constraint_assignment" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query: EntityTypesAP214[] = 
    [  ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.DOCUMENT_USAGE_CONSTRAINT_ASSIGNMENT
}
