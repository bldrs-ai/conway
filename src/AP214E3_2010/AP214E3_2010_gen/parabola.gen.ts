
import { conic } from "./index"
import { length_measure } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class parabola extends conic {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.PARABOLA
  }
  private focal_dist_? : number

  public get focal_dist() : number {
    if ( this.focal_dist_ === void 0 ) {
      this.focal_dist_ = this.extractNumber( 2, 2, 4, false )
    }

    return this.focal_dist_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === parabola.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for parabola" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.PARABOLA ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.PARABOLA
}
