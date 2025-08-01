
import { geometric_representation_item } from "./index"
import { positive_length_measure } from "./index"
import { point } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class sphere extends geometric_representation_item {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.SPHERE
  }
  private radius_? : number
  private centre_? : point

  public get radius() : number {
    if ( this.radius_ === void 0 ) {
      this.radius_ = this.extractNumber( 1, 1, 2, false )
    }

    return this.radius_ as number
  }

  public get centre() : point {
    if ( this.centre_ === void 0 ) {
      this.centre_ = this.extractElement( 2, 1, 2, false, point )
    }

    return this.centre_ as point
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === sphere.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for sphere" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.SPHERE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.SPHERE
}
