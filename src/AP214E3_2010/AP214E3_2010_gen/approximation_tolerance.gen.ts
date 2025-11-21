
import { founded_item } from "./index"
import { approximation_tolerance_deviation } from "./index"
import { approximation_tolerance_parameter } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class approximation_tolerance extends founded_item {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.APPROXIMATION_TOLERANCE
  }
  private tolerance_? : approximation_tolerance_deviation | approximation_tolerance_parameter

  public get tolerance() : approximation_tolerance_deviation | approximation_tolerance_parameter {
    if ( this.tolerance_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 0, 0, 1, false )

      if ( !( value instanceof approximation_tolerance_deviation ) && !( value instanceof approximation_tolerance_parameter ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.tolerance_ = value as (approximation_tolerance_deviation | approximation_tolerance_parameter)

    }

    return this.tolerance_ as approximation_tolerance_deviation | approximation_tolerance_parameter
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === approximation_tolerance.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for approximation_tolerance" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.APPROXIMATION_TOLERANCE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.APPROXIMATION_TOLERANCE
}
