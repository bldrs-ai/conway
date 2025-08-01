
import { swept_area_solid } from "./index"
import { curve } from "./index"
import { surface } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class surface_curve_swept_area_solid extends swept_area_solid {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.SURFACE_CURVE_SWEPT_AREA_SOLID
  }
  private directrix_? : curve
  private start_param_? : number
  private end_param_? : number
  private reference_surface_? : surface

  public get directrix() : curve {
    if ( this.directrix_ === void 0 ) {
      this.directrix_ = this.extractElement( 2, 2, 4, false, curve )
    }

    return this.directrix_ as curve
  }

  public get start_param() : number {
    if ( this.start_param_ === void 0 ) {
      this.start_param_ = this.extractNumber( 3, 2, 4, false )
    }

    return this.start_param_ as number
  }

  public get end_param() : number {
    if ( this.end_param_ === void 0 ) {
      this.end_param_ = this.extractNumber( 4, 2, 4, false )
    }

    return this.end_param_ as number
  }

  public get reference_surface() : surface {
    if ( this.reference_surface_ === void 0 ) {
      this.reference_surface_ = this.extractElement( 5, 2, 4, false, surface )
    }

    return this.reference_surface_ as surface
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === surface_curve_swept_area_solid.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for surface_curve_swept_area_solid" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.SURFACE_CURVE_SWEPT_AREA_SOLID ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.SURFACE_CURVE_SWEPT_AREA_SOLID
}
