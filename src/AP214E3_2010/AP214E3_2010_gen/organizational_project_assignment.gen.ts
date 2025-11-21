
import { organizational_project } from "./index"
import { organizational_project_role } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class organizational_project_assignment extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.ORGANIZATIONAL_PROJECT_ASSIGNMENT
  }
  private assigned_organizational_project_? : organizational_project
  private role_? : organizational_project_role

  public get assigned_organizational_project() : organizational_project {
    if ( this.assigned_organizational_project_ === void 0 ) {
      this.assigned_organizational_project_ = this.extractElement( 0, 0, 0, false, organizational_project )
    }

    return this.assigned_organizational_project_ as organizational_project
  }

  public get role() : organizational_project_role {
    if ( this.role_ === void 0 ) {
      this.role_ = this.extractElement( 1, 0, 0, false, organizational_project_role )
    }

    return this.role_ as organizational_project_role
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === organizational_project_assignment.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for organizational_project_assignment" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query: EntityTypesAP214[] = 
    [  ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.ORGANIZATIONAL_PROJECT_ASSIGNMENT
}
