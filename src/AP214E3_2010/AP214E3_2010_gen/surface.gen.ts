
import { geometric_representation_item } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class surface extends geometric_representation_item {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.SURFACE
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.SURFACE, EntityTypesAP214.ELEMENTARY_SURFACE, EntityTypesAP214.SWEPT_SURFACE, EntityTypesAP214.BOUNDED_SURFACE, EntityTypesAP214.OFFSET_SURFACE, EntityTypesAP214.SURFACE_REPLICA, EntityTypesAP214.PLANE, EntityTypesAP214.CYLINDRICAL_SURFACE, EntityTypesAP214.CONICAL_SURFACE, EntityTypesAP214.SPHERICAL_SURFACE, EntityTypesAP214.TOROIDAL_SURFACE, EntityTypesAP214.SURFACE_OF_LINEAR_EXTRUSION, EntityTypesAP214.SURFACE_OF_REVOLUTION, EntityTypesAP214.B_SPLINE_SURFACE, EntityTypesAP214.RECTANGULAR_TRIMMED_SURFACE, EntityTypesAP214.CURVE_BOUNDED_SURFACE, EntityTypesAP214.RECTANGULAR_COMPOSITE_SURFACE, EntityTypesAP214.B_SPLINE_SURFACE_WITH_KNOTS, EntityTypesAP214.UNIFORM_SURFACE, EntityTypesAP214.QUASI_UNIFORM_SURFACE, EntityTypesAP214.BEZIER_SURFACE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.SURFACE
}
