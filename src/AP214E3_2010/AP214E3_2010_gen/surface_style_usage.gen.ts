
import { founded_item } from "./index"
import { surface_side, surface_sideDeserializeStep } from "./index"
import { surface_side_style } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class surface_style_usage extends founded_item {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.SURFACE_STYLE_USAGE
  }
  private side_? : surface_side
  private style_? : surface_side_style

  public get side() : surface_side {
    if ( this.side_ === void 0 ) {
      this.side_ = this.extractLambda( 0, 0, 1, surface_sideDeserializeStep, false )
    }

    return this.side_ as surface_side
  }

  public get style() : surface_side_style {
    if ( this.style_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 1, 0, 1, false )

      if ( !( value instanceof surface_side_style ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.style_ = value as (surface_side_style)

    }

    return this.style_ as surface_side_style
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === surface_style_usage.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for surface_style_usage" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.SURFACE_STYLE_USAGE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.SURFACE_STYLE_USAGE
}
