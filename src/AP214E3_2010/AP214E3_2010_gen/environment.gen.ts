
import { generic_variable } from "./index"
import { variable_semantics } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class environment extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.ENVIRONMENT
  }
  private syntactic_representation_? : generic_variable
  private semantics_? : variable_semantics

  public get syntactic_representation() : generic_variable {
    if ( this.syntactic_representation_ === void 0 ) {
      this.syntactic_representation_ = this.extractElement( 0, false, generic_variable )
    }

    return this.syntactic_representation_ as generic_variable
  }

  public get semantics() : variable_semantics {
    if ( this.semantics_ === void 0 ) {
      this.semantics_ = this.extractElement( 1, false, variable_semantics )
    }

    return this.semantics_ as variable_semantics
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.ENVIRONMENT ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.ENVIRONMENT
}
