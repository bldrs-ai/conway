
import { kinematic_control } from "./index"
import { kinematic_analysis_result } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class kinematic_analysis_consistency extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.KINEMATIC_ANALYSIS_CONSISTENCY
  }
  private control_? : kinematic_control
  private result_? : kinematic_analysis_result

  public get control() : kinematic_control {
    if ( this.control_ === void 0 ) {
      this.control_ = this.extractElement( 0, 0, 0, false, kinematic_control )
    }

    return this.control_ as kinematic_control
  }

  public get result() : kinematic_analysis_result {
    if ( this.result_ === void 0 ) {
      this.result_ = this.extractElement( 1, 0, 0, false, kinematic_analysis_result )
    }

    return this.result_ as kinematic_analysis_result
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === kinematic_analysis_consistency.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for kinematic_analysis_consistency" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.KINEMATIC_ANALYSIS_CONSISTENCY ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.KINEMATIC_ANALYSIS_CONSISTENCY
}
