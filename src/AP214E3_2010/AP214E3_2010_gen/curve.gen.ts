
import { geometric_representation_item } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class curve extends geometric_representation_item {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.CURVE
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.CURVE, EntityTypesAP214.LINE, EntityTypesAP214.CONIC, EntityTypesAP214.PCURVE, EntityTypesAP214.SURFACE_CURVE, EntityTypesAP214.OFFSET_CURVE_2D, EntityTypesAP214.OFFSET_CURVE_3D, EntityTypesAP214.CURVE_REPLICA, EntityTypesAP214.CIRCLE, EntityTypesAP214.ELLIPSE, EntityTypesAP214.HYPERBOLA, EntityTypesAP214.PARABOLA, EntityTypesAP214.INTERSECTION_CURVE, EntityTypesAP214.SEAM_CURVE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.CURVE
}
