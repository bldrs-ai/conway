
import { assembly_component_usage } from "./index"
import { next_assembly_usage_occurrence } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class specified_higher_usage_occurrence extends assembly_component_usage {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.SPECIFIED_HIGHER_USAGE_OCCURRENCE
  }
  private upper_usage_? : assembly_component_usage
  private next_usage_? : next_assembly_usage_occurrence

  public get upper_usage() : assembly_component_usage {
    if ( this.upper_usage_ === void 0 ) {
      this.upper_usage_ = this.extractElement( 6, 6, 3, false, assembly_component_usage )
    }

    return this.upper_usage_ as assembly_component_usage
  }

  public get next_usage() : next_assembly_usage_occurrence {
    if ( this.next_usage_ === void 0 ) {
      this.next_usage_ = this.extractElement( 7, 6, 3, false, next_assembly_usage_occurrence )
    }

    return this.next_usage_ as next_assembly_usage_occurrence
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === specified_higher_usage_occurrence.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for specified_higher_usage_occurrence" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.SPECIFIED_HIGHER_USAGE_OCCURRENCE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.SPECIFIED_HIGHER_USAGE_OCCURRENCE
}
