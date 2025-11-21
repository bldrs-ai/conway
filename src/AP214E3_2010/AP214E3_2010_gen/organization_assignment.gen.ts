
import { organization } from "./index"
import { organization_role } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class organization_assignment extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.ORGANIZATION_ASSIGNMENT
  }
  private assigned_organization_? : organization
  private role_? : organization_role

  public get assigned_organization() : organization {
    if ( this.assigned_organization_ === void 0 ) {
      this.assigned_organization_ = this.extractElement( 0, 0, 0, false, organization )
    }

    return this.assigned_organization_ as organization
  }

  public get role() : organization_role {
    if ( this.role_ === void 0 ) {
      this.role_ = this.extractElement( 1, 0, 0, false, organization_role )
    }

    return this.role_ as organization_role
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === organization_assignment.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for organization_assignment" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query: EntityTypesAP214[] = 
    [  ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.ORGANIZATION_ASSIGNMENT
}
