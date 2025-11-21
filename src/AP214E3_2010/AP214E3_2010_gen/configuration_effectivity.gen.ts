
import { product_definition_effectivity } from "./index"
import { configuration_design } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class configuration_effectivity extends product_definition_effectivity {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.CONFIGURATION_EFFECTIVITY
  }
  private configuration_? : configuration_design

  public get configuration() : configuration_design {
    if ( this.configuration_ === void 0 ) {
      this.configuration_ = this.extractElement( 2, 2, 2, false, configuration_design )
    }

    return this.configuration_ as configuration_design
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === configuration_effectivity.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for configuration_effectivity" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.CONFIGURATION_EFFECTIVITY ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.CONFIGURATION_EFFECTIVITY
}
