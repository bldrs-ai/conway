
import { person_and_organization } from "./index"
import { person_and_organization_role } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class person_and_organization_assignment extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.PERSON_AND_ORGANIZATION_ASSIGNMENT
  }
  private assigned_person_and_organization_? : person_and_organization
  private role_? : person_and_organization_role

  public get assigned_person_and_organization() : person_and_organization {
    if ( this.assigned_person_and_organization_ === void 0 ) {
      this.assigned_person_and_organization_ = this.extractElement( 0, 0, 0, false, person_and_organization )
    }

    return this.assigned_person_and_organization_ as person_and_organization
  }

  public get role() : person_and_organization_role {
    if ( this.role_ === void 0 ) {
      this.role_ = this.extractElement( 1, 0, 0, false, person_and_organization_role )
    }

    return this.role_ as person_and_organization_role
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === person_and_organization_assignment.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for person_and_organization_assignment" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query: EntityTypesAP214[] = 
    [  ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.PERSON_AND_ORGANIZATION_ASSIGNMENT
}
