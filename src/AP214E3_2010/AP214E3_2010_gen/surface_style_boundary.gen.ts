
import { founded_item } from "./index"
import { curve_style } from "./index"
import { curve_style_rendering } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class surface_style_boundary extends founded_item {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.SURFACE_STYLE_BOUNDARY
  }
  private style_of_boundary_? : curve_style | curve_style_rendering

  public get style_of_boundary() : curve_style | curve_style_rendering {
    if ( this.style_of_boundary_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 0, 0, 1, false )

      if ( !( value instanceof curve_style ) && !( value instanceof curve_style_rendering ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.style_of_boundary_ = value as (curve_style | curve_style_rendering)

    }

    return this.style_of_boundary_ as curve_style | curve_style_rendering
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === surface_style_boundary.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for surface_style_boundary" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.SURFACE_STYLE_BOUNDARY ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.SURFACE_STYLE_BOUNDARY
}
