
import { colour } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class text_style_for_defined_font extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.TEXT_STYLE_FOR_DEFINED_FONT
  }
  private text_colour_? : colour

  public get text_colour() : colour {
    if ( this.text_colour_ === void 0 ) {
      this.text_colour_ = this.extractElement( 0, 0, 0, false, colour )
    }

    return this.text_colour_ as colour
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === text_style_for_defined_font.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for text_style_for_defined_font" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.TEXT_STYLE_FOR_DEFINED_FONT ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.TEXT_STYLE_FOR_DEFINED_FONT
}
