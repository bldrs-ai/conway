
import { founded_item } from "./index"
import { label } from "./index"
import { surface_style_fill_area } from "./index"
import { surface_style_boundary } from "./index"
import { surface_style_silhouette } from "./index"
import { surface_style_segmentation_curve } from "./index"
import { surface_style_control_grid } from "./index"
import { surface_style_parameter_line } from "./index"
import { surface_style_rendering } from "./index"
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
export  class surface_side_style extends founded_item {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.SURFACE_SIDE_STYLE
  }
  private name_? : string
  private styles_? : Array<surface_style_fill_area | surface_style_boundary | surface_style_silhouette | surface_style_segmentation_curve | surface_style_control_grid | surface_style_parameter_line | surface_style_rendering>

  public get name() : string {
    if ( this.name_ === void 0 ) {
      this.name_ = this.extractString( 0, 0, 1, false )
    }

    return this.name_ as string
  }

  public get styles() : Array<surface_style_fill_area | surface_style_boundary | surface_style_silhouette | surface_style_segmentation_curve | surface_style_control_grid | surface_style_parameter_line | surface_style_rendering> {
    if ( this.styles_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 1, 0, 1 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<surface_style_fill_area | surface_style_boundary | surface_style_silhouette | surface_style_segmentation_curve | surface_style_control_grid | surface_style_parameter_line | surface_style_rendering> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesAP214 > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof surface_style_fill_area ) && !( value1Untyped instanceof surface_style_boundary ) && !( value1Untyped instanceof surface_style_silhouette ) && !( value1Untyped instanceof surface_style_segmentation_curve ) && !( value1Untyped instanceof surface_style_control_grid ) && !( value1Untyped instanceof surface_style_parameter_line ) && !( value1Untyped instanceof surface_style_rendering ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (surface_style_fill_area | surface_style_boundary | surface_style_silhouette | surface_style_segmentation_curve | surface_style_control_grid | surface_style_parameter_line | surface_style_rendering)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.styles_ = value
    }

    return this.styles_ as Array<surface_style_fill_area | surface_style_boundary | surface_style_silhouette | surface_style_segmentation_curve | surface_style_control_grid | surface_style_parameter_line | surface_style_rendering>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === surface_side_style.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for surface_side_style" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.SURFACE_SIDE_STYLE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.SURFACE_SIDE_STYLE
}
