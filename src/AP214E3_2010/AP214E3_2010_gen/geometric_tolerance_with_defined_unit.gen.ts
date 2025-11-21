
import { geometric_tolerance } from "./index"
import { measure_with_unit } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class geometric_tolerance_with_defined_unit extends geometric_tolerance {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.GEOMETRIC_TOLERANCE_WITH_DEFINED_UNIT
  }
  private unit_size_? : measure_with_unit

  public get unit_size() : measure_with_unit {
    if ( this.unit_size_ === void 0 ) {
      this.unit_size_ = this.extractElement( 4, 4, 1, false, measure_with_unit )
    }

    return this.unit_size_ as measure_with_unit
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === geometric_tolerance_with_defined_unit.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for geometric_tolerance_with_defined_unit" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.GEOMETRIC_TOLERANCE_WITH_DEFINED_UNIT ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.GEOMETRIC_TOLERANCE_WITH_DEFINED_UNIT
}
