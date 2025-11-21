
import { identifier } from "./index"
import { identification_role } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class identification_assignment extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.IDENTIFICATION_ASSIGNMENT
  }
  private assigned_id_? : string
  private role_? : identification_role

  public get assigned_id() : string {
    if ( this.assigned_id_ === void 0 ) {
      this.assigned_id_ = this.extractString( 0, 0, 0, false )
    }

    return this.assigned_id_ as string
  }

  public get role() : identification_role {
    if ( this.role_ === void 0 ) {
      this.role_ = this.extractElement( 1, 0, 0, false, identification_role )
    }

    return this.role_ as identification_role
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === identification_assignment.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for identification_assignment" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query: EntityTypesAP214[] = 
    [  ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.IDENTIFICATION_ASSIGNMENT
}
