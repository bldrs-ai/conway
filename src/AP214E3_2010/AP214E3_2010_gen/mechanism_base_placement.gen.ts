
import { representation_relationship_with_transformation } from "./index"
import { mechanism } from "./index"
import { cartesian_transformation_operator_3d } from "./index"
import { kinematic_link_representation } from "./index"
import {
  representation_of_link,
} from '../ap214_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class mechanism_base_placement extends representation_relationship_with_transformation {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.MECHANISM_BASE_PLACEMENT
  }
  private base_of_mechanism_? : mechanism

  public get base_of_mechanism() : mechanism {
    if ( this.base_of_mechanism_ === void 0 ) {
      this.base_of_mechanism_ = this.extractElement( 5, 5, 2, false, mechanism )
    }

    return this.base_of_mechanism_ as mechanism
  }


  public get rep_2() : kinematic_link_representation {
    return representation_of_link(this?.base_of_mechanism?.base);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === mechanism_base_placement.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for mechanism_base_placement" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.MECHANISM_BASE_PLACEMENT ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.MECHANISM_BASE_PLACEMENT
}
