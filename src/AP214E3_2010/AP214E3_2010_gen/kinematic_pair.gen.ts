
import { item_defined_transformation } from "./index"
import { kinematic_joint } from "./index"
import { axis2_placement_3d } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class kinematic_pair extends item_defined_transformation {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.KINEMATIC_PAIR
  }
  private joint_? : kinematic_joint

  public get joint() : kinematic_joint {
    if ( this.joint_ === void 0 ) {
      this.joint_ = this.extractElement( 4, 4, 1, false, kinematic_joint )
    }

    return this.joint_ as kinematic_joint
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === kinematic_pair.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for kinematic_pair" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.KINEMATIC_PAIR ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.KINEMATIC_PAIR
}
