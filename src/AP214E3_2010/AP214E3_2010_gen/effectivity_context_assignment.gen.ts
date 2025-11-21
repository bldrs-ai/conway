
import { effectivity_assignment } from "./index"
import { effectivity_context_role } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class effectivity_context_assignment extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.EFFECTIVITY_CONTEXT_ASSIGNMENT
  }
  private assigned_effectivity_assignment_? : effectivity_assignment
  private role_? : effectivity_context_role

  public get assigned_effectivity_assignment() : effectivity_assignment {
    if ( this.assigned_effectivity_assignment_ === void 0 ) {
      this.assigned_effectivity_assignment_ = this.extractElement( 0, 0, 0, false, effectivity_assignment )
    }

    return this.assigned_effectivity_assignment_ as effectivity_assignment
  }

  public get role() : effectivity_context_role {
    if ( this.role_ === void 0 ) {
      this.role_ = this.extractElement( 1, 0, 0, false, effectivity_context_role )
    }

    return this.role_ as effectivity_context_role
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === effectivity_context_assignment.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for effectivity_context_assignment" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query: EntityTypesAP214[] = 
    [  ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.EFFECTIVITY_CONTEXT_ASSIGNMENT
}
