
import { geometric_representation_item } from "./index"
import { annotation_symbol_occurrence } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class fill_area_style_tile_symbol_with_style extends geometric_representation_item {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.FILL_AREA_STYLE_TILE_SYMBOL_WITH_STYLE
  }
  private symbol_? : annotation_symbol_occurrence

  public get symbol() : annotation_symbol_occurrence {
    if ( this.symbol_ === void 0 ) {
      this.symbol_ = this.extractElement( 1, 1, 2, false, annotation_symbol_occurrence )
    }

    return this.symbol_ as annotation_symbol_occurrence
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === fill_area_style_tile_symbol_with_style.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for fill_area_style_tile_symbol_with_style" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.FILL_AREA_STYLE_TILE_SYMBOL_WITH_STYLE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.FILL_AREA_STYLE_TILE_SYMBOL_WITH_STYLE
}
