
import { pair_value } from "./index"
import { unconstrained_pair } from "./index"
import { axis2_placement_3d } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class unconstrained_pair_value extends pair_value {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.UNCONSTRAINED_PAIR_VALUE
  }
  private actual_placement_? : axis2_placement_3d


  public get actual_placement() : axis2_placement_3d {
    if ( this.actual_placement_ === void 0 ) {
      this.actual_placement_ = this.extractElement( 2, 1, 1, false, axis2_placement_3d )
    }

    return this.actual_placement_ as axis2_placement_3d
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === unconstrained_pair_value.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for unconstrained_pair_value" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.UNCONSTRAINED_PAIR_VALUE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.UNCONSTRAINED_PAIR_VALUE
}
