
import { curve } from "./index"
import { pcurve } from "./index"
import { surface } from "./index"
import { preferred_surface_curve_representation, preferred_surface_curve_representationDeserializeStep } from "./index"
import {
  stepExtractOptional,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
} from '../../step/parsing/step_deserialization_functions'
import {
  get_basis_surface,
} from '../ap214_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class surface_curve extends curve {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.SURFACE_CURVE
  }
  private curve_3d_? : curve
  private associated_geometry_? : Array<pcurve | surface>
  private master_representation_? : preferred_surface_curve_representation

  public get curve_3d() : curve {
    if ( this.curve_3d_ === void 0 ) {
      this.curve_3d_ = this.extractElement( 1, 1, 3, false, curve )
    }

    return this.curve_3d_ as curve
  }

  public get associated_geometry() : Array<pcurve | surface> {
    if ( this.associated_geometry_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 2, 1, 3 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<pcurve | surface> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesAP214 > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof pcurve ) && !( value1Untyped instanceof surface ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (pcurve | surface)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.associated_geometry_ = value
    }

    return this.associated_geometry_ as Array<pcurve | surface>
  }

  public get master_representation() : preferred_surface_curve_representation {
    if ( this.master_representation_ === void 0 ) {
      this.master_representation_ = this.extractLambda( 3, 1, 3, preferred_surface_curve_representationDeserializeStep, false )
    }

    return this.master_representation_ as preferred_surface_curve_representation
  }

  public get basis_surface() : Array<surface> {
    return get_basis_surface(this);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === surface_curve.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for surface_curve" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.SURFACE_CURVE, EntityTypesAP214.INTERSECTION_CURVE, EntityTypesAP214.SEAM_CURVE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.SURFACE_CURVE
}
