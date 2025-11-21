
import { surface } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class bounded_surface extends surface {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.BOUNDED_SURFACE
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === bounded_surface.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for bounded_surface" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.BOUNDED_SURFACE, EntityTypesAP214.B_SPLINE_SURFACE, EntityTypesAP214.RECTANGULAR_TRIMMED_SURFACE, EntityTypesAP214.CURVE_BOUNDED_SURFACE, EntityTypesAP214.RECTANGULAR_COMPOSITE_SURFACE, EntityTypesAP214.B_SPLINE_SURFACE_WITH_KNOTS, EntityTypesAP214.UNIFORM_SURFACE, EntityTypesAP214.QUASI_UNIFORM_SURFACE, EntityTypesAP214.BEZIER_SURFACE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.BOUNDED_SURFACE
}
