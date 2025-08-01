
import { shading_curve_method, shading_curve_methodDeserializeStep } from "./index"
import { surface_rendering_properties } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class curve_style_rendering extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.CURVE_STYLE_RENDERING
  }
  private rendering_method_? : shading_curve_method
  private rendering_properties_? : surface_rendering_properties

  public get rendering_method() : shading_curve_method {
    if ( this.rendering_method_ === void 0 ) {
      this.rendering_method_ = this.extractLambda( 0, 0, 0, shading_curve_methodDeserializeStep, false )
    }

    return this.rendering_method_ as shading_curve_method
  }

  public get rendering_properties() : surface_rendering_properties {
    if ( this.rendering_properties_ === void 0 ) {
      this.rendering_properties_ = this.extractElement( 1, 0, 0, false, surface_rendering_properties )
    }

    return this.rendering_properties_ as surface_rendering_properties
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === curve_style_rendering.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for curve_style_rendering" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.CURVE_STYLE_RENDERING ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.CURVE_STYLE_RENDERING
}
