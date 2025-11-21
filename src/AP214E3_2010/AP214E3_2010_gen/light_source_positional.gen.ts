
import { light_source } from "./index"
import { cartesian_point } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class light_source_positional extends light_source {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.LIGHT_SOURCE_POSITIONAL
  }
  private position_? : cartesian_point
  private constant_attenuation_? : number
  private distance_attenuation_? : number

  public get position() : cartesian_point {
    if ( this.position_ === void 0 ) {
      this.position_ = this.extractElement( 2, 2, 3, false, cartesian_point )
    }

    return this.position_ as cartesian_point
  }

  public get constant_attenuation() : number {
    if ( this.constant_attenuation_ === void 0 ) {
      this.constant_attenuation_ = this.extractNumber( 3, 2, 3, false )
    }

    return this.constant_attenuation_ as number
  }

  public get distance_attenuation() : number {
    if ( this.distance_attenuation_ === void 0 ) {
      this.distance_attenuation_ = this.extractNumber( 4, 2, 3, false )
    }

    return this.distance_attenuation_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === light_source_positional.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for light_source_positional" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.LIGHT_SOURCE_POSITIONAL ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.LIGHT_SOURCE_POSITIONAL
}
