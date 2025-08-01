
import { curve } from "./index"
import { axis2_placement_2d } from "./index"
import { axis2_placement_3d } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class conic extends curve {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.CONIC
  }
  private position_? : axis2_placement_2d | axis2_placement_3d

  public get position() : axis2_placement_2d | axis2_placement_3d {
    if ( this.position_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 1, 1, 3, false )

      if ( !( value instanceof axis2_placement_2d ) && !( value instanceof axis2_placement_3d ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.position_ = value as (axis2_placement_2d | axis2_placement_3d)

    }

    return this.position_ as axis2_placement_2d | axis2_placement_3d
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === conic.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for conic" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.CONIC, EntityTypesAP214.CIRCLE, EntityTypesAP214.ELLIPSE, EntityTypesAP214.HYPERBOLA, EntityTypesAP214.PARABOLA ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.CONIC
}
