
import { generic_character_glyph_symbol } from "./index"
import { planar_extent } from "./index"
import { ratio_measure } from "./index"
import { length_measure } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class character_glyph_symbol extends generic_character_glyph_symbol {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.CHARACTER_GLYPH_SYMBOL
  }
  private character_box_? : planar_extent
  private baseline_ratio_? : number

  public get character_box() : planar_extent {
    if ( this.character_box_ === void 0 ) {
      this.character_box_ = this.extractElement( 3, 3, 3, false, planar_extent )
    }

    return this.character_box_ as planar_extent
  }

  public get baseline_ratio() : number {
    if ( this.baseline_ratio_ === void 0 ) {
      this.baseline_ratio_ = this.extractNumber( 4, 3, 3, false )
    }

    return this.baseline_ratio_ as number
  }

  public get box_height() : number {
    return this?.character_box?.size_in_y;
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === character_glyph_symbol.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for character_glyph_symbol" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.CHARACTER_GLYPH_SYMBOL ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.CHARACTER_GLYPH_SYMBOL
}
