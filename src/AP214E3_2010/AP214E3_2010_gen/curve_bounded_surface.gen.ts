
import { bounded_surface } from "./index"
import { surface } from "./index"
import { boundary_curve } from "./index"
import {
  stepExtractOptional,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class curve_bounded_surface extends bounded_surface {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.CURVE_BOUNDED_SURFACE
  }
  private basis_surface_? : surface
  private boundaries_? : Array<boundary_curve>
  private implicit_outer_? : boolean

  public get basis_surface() : surface {
    if ( this.basis_surface_ === void 0 ) {
      this.basis_surface_ = this.extractElement( 1, 1, 4, false, surface )
    }

    return this.basis_surface_ as surface
  }

  public get boundaries() : Array<boundary_curve> {
    if ( this.boundaries_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 2, 1, 4 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<boundary_curve> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, boundary_curve )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.boundaries_ = value
    }

    return this.boundaries_ as Array<boundary_curve>
  }

  public get implicit_outer() : boolean {
    if ( this.implicit_outer_ === void 0 ) {
      this.implicit_outer_ = this.extractBoolean( 3, 1, 4, false )
    }

    return this.implicit_outer_ as boolean
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === curve_bounded_surface.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for curve_bounded_surface" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.CURVE_BOUNDED_SURFACE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.CURVE_BOUNDED_SURFACE
}
