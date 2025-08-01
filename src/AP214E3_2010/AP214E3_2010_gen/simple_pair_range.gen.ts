
import { kinematic_pair } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class simple_pair_range extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.SIMPLE_PAIR_RANGE
  }
  private applies_to_pair_? : kinematic_pair

  public get applies_to_pair() : kinematic_pair {
    if ( this.applies_to_pair_ === void 0 ) {
      this.applies_to_pair_ = this.extractElement( 0, 0, 0, false, kinematic_pair )
    }

    return this.applies_to_pair_ as kinematic_pair
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === simple_pair_range.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for simple_pair_range" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.SIMPLE_PAIR_RANGE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.SIMPLE_PAIR_RANGE
}
