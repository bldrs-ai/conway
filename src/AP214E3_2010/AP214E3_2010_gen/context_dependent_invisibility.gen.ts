
import { invisibility } from "./index"
import { presentation_representation } from "./index"
import { presentation_set } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class context_dependent_invisibility extends invisibility {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.CONTEXT_DEPENDENT_INVISIBILITY
  }
  private presentation_context_? : presentation_representation | presentation_set

  public get presentation_context() : presentation_representation | presentation_set {
    if ( this.presentation_context_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 1, false )

      if ( !( value instanceof presentation_representation ) && !( value instanceof presentation_set ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.presentation_context_ = value as (presentation_representation | presentation_set)

    }

    return this.presentation_context_ as presentation_representation | presentation_set
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.CONTEXT_DEPENDENT_INVISIBILITY ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.CONTEXT_DEPENDENT_INVISIBILITY
}
