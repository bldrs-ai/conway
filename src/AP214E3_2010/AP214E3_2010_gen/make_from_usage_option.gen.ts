
import { product_definition_usage } from "./index"
import { text } from "./index"
import { measure_with_unit } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class make_from_usage_option extends product_definition_usage {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.MAKE_FROM_USAGE_OPTION
  }
  private ranking_? : number
  private ranking_rationale_? : string
  private quantity_? : measure_with_unit

  public get ranking() : number {
    if ( this.ranking_ === void 0 ) {
      this.ranking_ = this.extractNumber( 5, 5, 2, false )
    }

    return this.ranking_ as number
  }

  public get ranking_rationale() : string {
    if ( this.ranking_rationale_ === void 0 ) {
      this.ranking_rationale_ = this.extractString( 6, 5, 2, false )
    }

    return this.ranking_rationale_ as string
  }

  public get quantity() : measure_with_unit {
    if ( this.quantity_ === void 0 ) {
      this.quantity_ = this.extractElement( 7, 5, 2, false, measure_with_unit )
    }

    return this.quantity_ as measure_with_unit
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === make_from_usage_option.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for make_from_usage_option" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.MAKE_FROM_USAGE_OPTION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.MAKE_FROM_USAGE_OPTION
}
