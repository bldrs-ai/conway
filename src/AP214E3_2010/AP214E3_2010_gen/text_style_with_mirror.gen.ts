
import { text_style } from "./index"
import { axis2_placement_2d } from "./index"
import { axis2_placement_3d } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class text_style_with_mirror extends text_style {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.TEXT_STYLE_WITH_MIRROR
  }
  private mirror_placement_? : axis2_placement_2d | axis2_placement_3d

  public get mirror_placement() : axis2_placement_2d | axis2_placement_3d {
    if ( this.mirror_placement_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 2, 2, 2, false )

      if ( !( value instanceof axis2_placement_2d ) && !( value instanceof axis2_placement_3d ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.mirror_placement_ = value as (axis2_placement_2d | axis2_placement_3d)

    }

    return this.mirror_placement_ as axis2_placement_2d | axis2_placement_3d
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === text_style_with_mirror.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for text_style_with_mirror" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.TEXT_STYLE_WITH_MIRROR ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.TEXT_STYLE_WITH_MIRROR
}
