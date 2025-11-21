
import { tolerance_value } from "./index"
import { limits_and_fits } from "./index"
import { dimensional_location } from "./index"
import { dimensional_size } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class plus_minus_tolerance extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.PLUS_MINUS_TOLERANCE
  }
  private range_? : tolerance_value | limits_and_fits
  private toleranced_dimension_? : dimensional_location | dimensional_size

  public get range() : tolerance_value | limits_and_fits {
    if ( this.range_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 0, 0, 0, false )

      if ( !( value instanceof tolerance_value ) && !( value instanceof limits_and_fits ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.range_ = value as (tolerance_value | limits_and_fits)

    }

    return this.range_ as tolerance_value | limits_and_fits
  }

  public get toleranced_dimension() : dimensional_location | dimensional_size {
    if ( this.toleranced_dimension_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 1, 0, 0, false )

      if ( !( value instanceof dimensional_location ) && !( value instanceof dimensional_size ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.toleranced_dimension_ = value as (dimensional_location | dimensional_size)

    }

    return this.toleranced_dimension_ as dimensional_location | dimensional_size
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === plus_minus_tolerance.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for plus_minus_tolerance" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.PLUS_MINUS_TOLERANCE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.PLUS_MINUS_TOLERANCE
}
