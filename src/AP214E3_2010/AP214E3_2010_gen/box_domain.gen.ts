
import { founded_item } from "./index"
import { cartesian_point } from "./index"
import { positive_length_measure } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class box_domain extends founded_item {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.BOX_DOMAIN
  }
  private corner_? : cartesian_point
  private xlength_? : number
  private ylength_? : number
  private zlength_? : number

  public get corner() : cartesian_point {
    if ( this.corner_ === void 0 ) {
      this.corner_ = this.extractElement( 0, 0, 1, false, cartesian_point )
    }

    return this.corner_ as cartesian_point
  }

  public get xlength() : number {
    if ( this.xlength_ === void 0 ) {
      this.xlength_ = this.extractNumber( 1, 0, 1, false )
    }

    return this.xlength_ as number
  }

  public get ylength() : number {
    if ( this.ylength_ === void 0 ) {
      this.ylength_ = this.extractNumber( 2, 0, 1, false )
    }

    return this.ylength_ as number
  }

  public get zlength() : number {
    if ( this.zlength_ === void 0 ) {
      this.zlength_ = this.extractNumber( 3, 0, 1, false )
    }

    return this.zlength_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === box_domain.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for box_domain" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.BOX_DOMAIN ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.BOX_DOMAIN
}
