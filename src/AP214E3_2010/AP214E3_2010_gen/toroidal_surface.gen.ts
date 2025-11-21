
import { elementary_surface } from "./index"
import { positive_length_measure } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class toroidal_surface extends elementary_surface {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.TOROIDAL_SURFACE
  }
  private major_radius_? : number
  private minor_radius_? : number

  public get major_radius() : number {
    if ( this.major_radius_ === void 0 ) {
      this.major_radius_ = this.extractNumber( 2, 2, 4, false )
    }

    return this.major_radius_ as number
  }

  public get minor_radius() : number {
    if ( this.minor_radius_ === void 0 ) {
      this.minor_radius_ = this.extractNumber( 3, 2, 4, false )
    }

    return this.minor_radius_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === toroidal_surface.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for toroidal_surface" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.TOROIDAL_SURFACE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.TOROIDAL_SURFACE
}
