
import { toroidal_surface } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class degenerate_toroidal_surface extends toroidal_surface {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.DEGENERATE_TOROIDAL_SURFACE
  }
  private select_outer_? : boolean

  public get select_outer() : boolean {
    if ( this.select_outer_ === void 0 ) {
      this.select_outer_ = this.extractBoolean( 4, 4, 5, false )
    }

    return this.select_outer_ as boolean
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === degenerate_toroidal_surface.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for degenerate_toroidal_surface" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.DEGENERATE_TOROIDAL_SURFACE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.DEGENERATE_TOROIDAL_SURFACE
}
