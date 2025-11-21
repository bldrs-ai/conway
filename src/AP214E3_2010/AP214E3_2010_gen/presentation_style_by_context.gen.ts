
import { presentation_style_assignment } from "./index"
import { group } from "./index"
import { presentation_layer_assignment } from "./index"
import { presentation_set } from "./index"
import { representation } from "./index"
import { representation_item } from "./index"
import { shape_representation_relationship } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class presentation_style_by_context extends presentation_style_assignment {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.PRESENTATION_STYLE_BY_CONTEXT
  }
  private style_context_? : group | presentation_layer_assignment | presentation_set | representation | representation_item | shape_representation_relationship

  public get style_context() : group | presentation_layer_assignment | presentation_set | representation | representation_item | shape_representation_relationship {
    if ( this.style_context_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 1, 1, 2, false )

      if ( !( value instanceof group ) && !( value instanceof presentation_layer_assignment ) && !( value instanceof presentation_set ) && !( value instanceof representation ) && !( value instanceof representation_item ) && !( value instanceof shape_representation_relationship ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.style_context_ = value as (group | presentation_layer_assignment | presentation_set | representation | representation_item | shape_representation_relationship)

    }

    return this.style_context_ as group | presentation_layer_assignment | presentation_set | representation | representation_item | shape_representation_relationship
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === presentation_style_by_context.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for presentation_style_by_context" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.PRESENTATION_STYLE_BY_CONTEXT ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.PRESENTATION_STYLE_BY_CONTEXT
}
