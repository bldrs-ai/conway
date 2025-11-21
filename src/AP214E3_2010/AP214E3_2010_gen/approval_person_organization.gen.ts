
import { person } from "./index"
import { organization } from "./index"
import { person_and_organization } from "./index"
import { approval } from "./index"
import { approval_role } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class approval_person_organization extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.APPROVAL_PERSON_ORGANIZATION
  }
  private person_organization_? : person | organization | person_and_organization
  private authorized_approval_? : approval
  private role_? : approval_role

  public get person_organization() : person | organization | person_and_organization {
    if ( this.person_organization_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 0, 0, 0, false )

      if ( !( value instanceof person ) && !( value instanceof organization ) && !( value instanceof person_and_organization ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.person_organization_ = value as (person | organization | person_and_organization)

    }

    return this.person_organization_ as person | organization | person_and_organization
  }

  public get authorized_approval() : approval {
    if ( this.authorized_approval_ === void 0 ) {
      this.authorized_approval_ = this.extractElement( 1, 0, 0, false, approval )
    }

    return this.authorized_approval_ as approval
  }

  public get role() : approval_role {
    if ( this.role_ === void 0 ) {
      this.role_ = this.extractElement( 2, 0, 0, false, approval_role )
    }

    return this.role_ as approval_role
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === approval_person_organization.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for approval_person_organization" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.APPROVAL_PERSON_ORGANIZATION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.APPROVAL_PERSON_ORGANIZATION
}
