
import { half_space_solid } from "./index"
import { box_domain } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class boxed_half_space extends half_space_solid {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.BOXED_HALF_SPACE
  }
  private enclosure_? : box_domain

  public get enclosure() : box_domain {
    if ( this.enclosure_ === void 0 ) {
      this.enclosure_ = this.extractElement( 3, 3, 3, false, box_domain )
    }

    return this.enclosure_ as box_domain
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === boxed_half_space.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for boxed_half_space" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.BOXED_HALF_SPACE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.BOXED_HALF_SPACE
}
