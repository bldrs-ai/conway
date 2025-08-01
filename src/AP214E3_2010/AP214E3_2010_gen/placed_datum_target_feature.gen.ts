
import { datum_target } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class placed_datum_target_feature extends datum_target {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.PLACED_DATUM_TARGET_FEATURE
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === placed_datum_target_feature.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for placed_datum_target_feature" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.PLACED_DATUM_TARGET_FEATURE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.PLACED_DATUM_TARGET_FEATURE
}
