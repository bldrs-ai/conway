
import { composite_curve_segment } from "./index"
import { parameter_value } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class reparametrised_composite_curve_segment extends composite_curve_segment {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.REPARAMETRISED_COMPOSITE_CURVE_SEGMENT
  }
  private param_length_? : number

  public get param_length() : number {
    if ( this.param_length_ === void 0 ) {
      this.param_length_ = this.extractNumber( 3, 3, 2, false )
    }

    return this.param_length_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === reparametrised_composite_curve_segment.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for reparametrised_composite_curve_segment" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.REPARAMETRISED_COMPOSITE_CURVE_SEGMENT ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.REPARAMETRISED_COMPOSITE_CURVE_SEGMENT
}
