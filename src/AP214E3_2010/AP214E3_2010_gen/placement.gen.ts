
import { geometric_representation_item } from "./index"
import { cartesian_point } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class placement extends geometric_representation_item {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.PLACEMENT
  }
  private location_? : cartesian_point

  public get location() : cartesian_point {
    if ( this.location_ === void 0 ) {
      this.location_ = this.extractElement( 1, 1, 2, false, cartesian_point )
    }

    return this.location_ as cartesian_point
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === placement.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for placement" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.PLACEMENT, EntityTypesAP214.AXIS1_PLACEMENT, EntityTypesAP214.AXIS2_PLACEMENT_2D, EntityTypesAP214.AXIS2_PLACEMENT_3D ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.PLACEMENT
}
