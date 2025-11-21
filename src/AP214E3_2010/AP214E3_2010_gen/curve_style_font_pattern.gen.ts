
import { founded_item } from "./index"
import { positive_length_measure } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class curve_style_font_pattern extends founded_item {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.CURVE_STYLE_FONT_PATTERN
  }
  private visible_segment_length_? : number
  private invisible_segment_length_? : number

  public get visible_segment_length() : number {
    if ( this.visible_segment_length_ === void 0 ) {
      this.visible_segment_length_ = this.extractNumber( 0, 0, 1, false )
    }

    return this.visible_segment_length_ as number
  }

  public get invisible_segment_length() : number {
    if ( this.invisible_segment_length_ === void 0 ) {
      this.invisible_segment_length_ = this.extractNumber( 1, 0, 1, false )
    }

    return this.invisible_segment_length_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === curve_style_font_pattern.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for curve_style_font_pattern" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.CURVE_STYLE_FONT_PATTERN ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.CURVE_STYLE_FONT_PATTERN
}
