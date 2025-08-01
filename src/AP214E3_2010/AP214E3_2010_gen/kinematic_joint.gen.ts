
import { kinematic_link } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class kinematic_joint extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.KINEMATIC_JOINT
  }
  private first_link_? : kinematic_link
  private second_link_? : kinematic_link

  public get first_link() : kinematic_link {
    if ( this.first_link_ === void 0 ) {
      this.first_link_ = this.extractElement( 0, 0, 0, false, kinematic_link )
    }

    return this.first_link_ as kinematic_link
  }

  public get second_link() : kinematic_link {
    if ( this.second_link_ === void 0 ) {
      this.second_link_ = this.extractElement( 1, 0, 0, false, kinematic_link )
    }

    return this.second_link_ as kinematic_link
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === kinematic_joint.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for kinematic_joint" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.KINEMATIC_JOINT ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.KINEMATIC_JOINT
}
