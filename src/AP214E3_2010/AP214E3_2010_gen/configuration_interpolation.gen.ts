
import { configuration_definition } from "./index"
import { interpolation_type, interpolation_typeDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class configuration_interpolation extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.CONFIGURATION_INTERPOLATION
  }
  private previous_configuration_definition_? : configuration_definition
  private next_configuration_definition_? : configuration_definition
  private interpolation_? : interpolation_type

  public get previous_configuration_definition() : configuration_definition {
    if ( this.previous_configuration_definition_ === void 0 ) {
      this.previous_configuration_definition_ = this.extractElement( 0, 0, 0, false, configuration_definition )
    }

    return this.previous_configuration_definition_ as configuration_definition
  }

  public get next_configuration_definition() : configuration_definition {
    if ( this.next_configuration_definition_ === void 0 ) {
      this.next_configuration_definition_ = this.extractElement( 1, 0, 0, false, configuration_definition )
    }

    return this.next_configuration_definition_ as configuration_definition
  }

  public get interpolation() : interpolation_type {
    if ( this.interpolation_ === void 0 ) {
      this.interpolation_ = this.extractLambda( 2, 0, 0, interpolation_typeDeserializeStep, false )
    }

    return this.interpolation_ as interpolation_type
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === configuration_interpolation.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for configuration_interpolation" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.CONFIGURATION_INTERPOLATION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.CONFIGURATION_INTERPOLATION
}
