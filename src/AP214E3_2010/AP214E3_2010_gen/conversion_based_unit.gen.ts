
import { named_unit } from "./index"
import { label } from "./index"
import { measure_with_unit } from "./index"
import { dimensional_exponents } from "./index"
import {
  derive_dimensional_exponents,
} from '../ap214_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class conversion_based_unit extends named_unit {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.CONVERSION_BASED_UNIT
  }
  private name_? : string
  private conversion_factor_? : measure_with_unit

  public get name() : string {
    if ( this.name_ === void 0 ) {
      this.name_ = this.extractString( 1, 1, 1, false )
    }

    return this.name_ as string
  }

  public get conversion_factor() : measure_with_unit {
    if ( this.conversion_factor_ === void 0 ) {
      this.conversion_factor_ = this.extractElement( 2, 1, 1, false, measure_with_unit )
    }

    return this.conversion_factor_ as measure_with_unit
  }

  public get dimensions() : dimensional_exponents {
    return derive_dimensional_exponents(this?.conversion_factor?.unit_component);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === conversion_based_unit.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for conversion_based_unit" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.CONVERSION_BASED_UNIT ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.CONVERSION_BASED_UNIT
}
