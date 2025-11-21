
import { representation_item } from "./index"
import { dimension_count } from "./index"
import {
  dimension_of,
} from '../ap214_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class geometric_representation_item extends representation_item {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.GEOMETRIC_REPRESENTATION_ITEM
  }


  public get dim() : number {
    return dimension_of(this);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === geometric_representation_item.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for geometric_representation_item" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.GEOMETRIC_REPRESENTATION_ITEM, EntityTypesAP214.POINT, EntityTypesAP214.DIRECTION, EntityTypesAP214.VECTOR, EntityTypesAP214.PLACEMENT, EntityTypesAP214.CARTESIAN_TRANSFORMATION_OPERATOR, EntityTypesAP214.CURVE, EntityTypesAP214.SURFACE, EntityTypesAP214.EDGE_CURVE, EntityTypesAP214.FACE_SURFACE, EntityTypesAP214.POLY_LOOP, EntityTypesAP214.VERTEX_POINT, EntityTypesAP214.SOLID_MODEL, EntityTypesAP214.BOOLEAN_RESULT, EntityTypesAP214.SPHERE, EntityTypesAP214.RIGHT_CIRCULAR_CONE, EntityTypesAP214.RIGHT_CIRCULAR_CYLINDER, EntityTypesAP214.TORUS, EntityTypesAP214.BLOCK, EntityTypesAP214.RIGHT_ANGULAR_WEDGE, EntityTypesAP214.HALF_SPACE_SOLID, EntityTypesAP214.SHELL_BASED_SURFACE_MODEL, EntityTypesAP214.FACE_BASED_SURFACE_MODEL, EntityTypesAP214.EDGE_BASED_WIREFRAME_MODEL, EntityTypesAP214.GEOMETRIC_SET, EntityTypesAP214.CARTESIAN_POINT, EntityTypesAP214.POINT_ON_CURVE, EntityTypesAP214.POINT_ON_SURFACE, EntityTypesAP214.POINT_REPLICA, EntityTypesAP214.DEGENERATE_PCURVE, EntityTypesAP214.AXIS1_PLACEMENT, EntityTypesAP214.AXIS2_PLACEMENT_2D, EntityTypesAP214.AXIS2_PLACEMENT_3D, EntityTypesAP214.CARTESIAN_TRANSFORMATION_OPERATOR_2D, EntityTypesAP214.CARTESIAN_TRANSFORMATION_OPERATOR_3D, EntityTypesAP214.LINE, EntityTypesAP214.CONIC, EntityTypesAP214.PCURVE, EntityTypesAP214.SURFACE_CURVE, EntityTypesAP214.OFFSET_CURVE_2D, EntityTypesAP214.OFFSET_CURVE_3D, EntityTypesAP214.CURVE_REPLICA, EntityTypesAP214.CIRCLE, EntityTypesAP214.ELLIPSE, EntityTypesAP214.HYPERBOLA, EntityTypesAP214.PARABOLA, EntityTypesAP214.INTERSECTION_CURVE, EntityTypesAP214.SEAM_CURVE, EntityTypesAP214.ELEMENTARY_SURFACE, EntityTypesAP214.SWEPT_SURFACE, EntityTypesAP214.BOUNDED_SURFACE, EntityTypesAP214.OFFSET_SURFACE, EntityTypesAP214.SURFACE_REPLICA, EntityTypesAP214.PLANE, EntityTypesAP214.CYLINDRICAL_SURFACE, EntityTypesAP214.CONICAL_SURFACE, EntityTypesAP214.SPHERICAL_SURFACE, EntityTypesAP214.TOROIDAL_SURFACE, EntityTypesAP214.SURFACE_OF_LINEAR_EXTRUSION, EntityTypesAP214.SURFACE_OF_REVOLUTION, EntityTypesAP214.B_SPLINE_SURFACE, EntityTypesAP214.RECTANGULAR_TRIMMED_SURFACE, EntityTypesAP214.CURVE_BOUNDED_SURFACE, EntityTypesAP214.RECTANGULAR_COMPOSITE_SURFACE, EntityTypesAP214.B_SPLINE_SURFACE_WITH_KNOTS, EntityTypesAP214.UNIFORM_SURFACE, EntityTypesAP214.QUASI_UNIFORM_SURFACE, EntityTypesAP214.BEZIER_SURFACE, EntityTypesAP214.CSG_SOLID, EntityTypesAP214.MANIFOLD_SOLID_BREP, EntityTypesAP214.SWEPT_FACE_SOLID, EntityTypesAP214.SWEPT_AREA_SOLID, EntityTypesAP214.SWEPT_DISK_SOLID, EntityTypesAP214.SOLID_REPLICA, EntityTypesAP214.EXTRUDED_FACE_SOLID, EntityTypesAP214.REVOLVED_FACE_SOLID, EntityTypesAP214.REVOLVED_AREA_SOLID, EntityTypesAP214.EXTRUDED_AREA_SOLID, EntityTypesAP214.SURFACE_CURVE_SWEPT_AREA_SOLID ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.GEOMETRIC_REPRESENTATION_ITEM
}
