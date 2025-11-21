
import { bounded_surface } from "./index"
import { surface } from "./index"
import { parameter_value } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class rectangular_trimmed_surface extends bounded_surface {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.RECTANGULAR_TRIMMED_SURFACE
  }
  private basis_surface_? : surface
  private u1_? : number
  private u2_? : number
  private v1_? : number
  private v2_? : number
  private usense_? : boolean
  private vsense_? : boolean

  public get basis_surface() : surface {
    if ( this.basis_surface_ === void 0 ) {
      this.basis_surface_ = this.extractElement( 1, 1, 4, false, surface )
    }

    return this.basis_surface_ as surface
  }

  public get u1() : number {
    if ( this.u1_ === void 0 ) {
      this.u1_ = this.extractNumber( 2, 1, 4, false )
    }

    return this.u1_ as number
  }

  public get u2() : number {
    if ( this.u2_ === void 0 ) {
      this.u2_ = this.extractNumber( 3, 1, 4, false )
    }

    return this.u2_ as number
  }

  public get v1() : number {
    if ( this.v1_ === void 0 ) {
      this.v1_ = this.extractNumber( 4, 1, 4, false )
    }

    return this.v1_ as number
  }

  public get v2() : number {
    if ( this.v2_ === void 0 ) {
      this.v2_ = this.extractNumber( 5, 1, 4, false )
    }

    return this.v2_ as number
  }

  public get usense() : boolean {
    if ( this.usense_ === void 0 ) {
      this.usense_ = this.extractBoolean( 6, 1, 4, false )
    }

    return this.usense_ as boolean
  }

  public get vsense() : boolean {
    if ( this.vsense_ === void 0 ) {
      this.vsense_ = this.extractBoolean( 7, 1, 4, false )
    }

    return this.vsense_ as boolean
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === rectangular_trimmed_surface.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for rectangular_trimmed_surface" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.RECTANGULAR_TRIMMED_SURFACE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.RECTANGULAR_TRIMMED_SURFACE
}
