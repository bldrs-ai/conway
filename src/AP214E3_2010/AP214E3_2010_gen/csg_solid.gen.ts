
import { solid_model } from "./index"
import { boolean_result } from "./index"
import { sphere } from "./index"
import { block } from "./index"
import { right_angular_wedge } from "./index"
import { torus } from "./index"
import { right_circular_cone } from "./index"
import { right_circular_cylinder } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class csg_solid extends solid_model {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.CSG_SOLID
  }
  private tree_root_expression_? : boolean_result | sphere | block | right_angular_wedge | torus | right_circular_cone | right_circular_cylinder

  public get tree_root_expression() : boolean_result | sphere | block | right_angular_wedge | torus | right_circular_cone | right_circular_cylinder {
    if ( this.tree_root_expression_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 1, 1, 3, false )

      if ( !( value instanceof boolean_result ) && !( value instanceof sphere ) && !( value instanceof block ) && !( value instanceof right_angular_wedge ) && !( value instanceof torus ) && !( value instanceof right_circular_cone ) && !( value instanceof right_circular_cylinder ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.tree_root_expression_ = value as (boolean_result | sphere | block | right_angular_wedge | torus | right_circular_cone | right_circular_cylinder)

    }

    return this.tree_root_expression_ as boolean_result | sphere | block | right_angular_wedge | torus | right_circular_cone | right_circular_cylinder
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === csg_solid.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for csg_solid" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.CSG_SOLID ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.CSG_SOLID
}
