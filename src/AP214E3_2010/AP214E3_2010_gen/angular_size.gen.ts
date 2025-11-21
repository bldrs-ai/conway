
import { dimensional_size } from "./index"
import { angle_relator, angle_relatorDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class angular_size extends dimensional_size {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.ANGULAR_SIZE
  }
  private angle_selection_? : angle_relator

  public get angle_selection() : angle_relator {
    if ( this.angle_selection_ === void 0 ) {
      this.angle_selection_ = this.extractLambda( 2, 2, 1, angle_relatorDeserializeStep, false )
    }

    return this.angle_selection_ as angle_relator
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === angular_size.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for angular_size" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.ANGULAR_SIZE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.ANGULAR_SIZE
}
