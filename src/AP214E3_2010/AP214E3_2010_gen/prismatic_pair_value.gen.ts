
import { pair_value } from "./index"
import { prismatic_pair } from "./index"
import { length_measure } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class prismatic_pair_value extends pair_value {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.PRISMATIC_PAIR_VALUE
  }
  private actual_translation_? : number


  public get actual_translation() : number {
    if ( this.actual_translation_ === void 0 ) {
      this.actual_translation_ = this.extractNumber( 2, 1, 1, false )
    }

    return this.actual_translation_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === prismatic_pair_value.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for prismatic_pair_value" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.PRISMATIC_PAIR_VALUE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.PRISMATIC_PAIR_VALUE
}
