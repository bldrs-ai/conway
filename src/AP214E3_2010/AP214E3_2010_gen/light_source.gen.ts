
import { geometric_representation_item } from "./index"
import { colour } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class light_source extends geometric_representation_item {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.LIGHT_SOURCE
  }
  private light_colour_? : colour

  public get light_colour() : colour {
    if ( this.light_colour_ === void 0 ) {
      this.light_colour_ = this.extractElement( 1, 1, 2, false, colour )
    }

    return this.light_colour_ as colour
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === light_source.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for light_source" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.LIGHT_SOURCE, EntityTypesAP214.LIGHT_SOURCE_AMBIENT, EntityTypesAP214.LIGHT_SOURCE_DIRECTIONAL, EntityTypesAP214.LIGHT_SOURCE_POSITIONAL, EntityTypesAP214.LIGHT_SOURCE_SPOT ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.LIGHT_SOURCE
}
