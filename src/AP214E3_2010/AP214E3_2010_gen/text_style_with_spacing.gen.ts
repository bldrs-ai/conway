
import { text_style } from "./index"
import { length_measure } from "./index"
import { ratio_measure } from "./index"
import { measure_with_unit } from "./index"
import { descriptive_measure } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class text_style_with_spacing extends text_style {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.TEXT_STYLE_WITH_SPACING
  }
  private character_spacing_? : length_measure | ratio_measure | measure_with_unit | descriptive_measure

  public get character_spacing() : length_measure | ratio_measure | measure_with_unit | descriptive_measure {
    if ( this.character_spacing_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 2, 2, 2, false )

      if ( !( value instanceof length_measure ) && !( value instanceof ratio_measure ) && !( value instanceof measure_with_unit ) && !( value instanceof descriptive_measure ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.character_spacing_ = value as (length_measure | ratio_measure | measure_with_unit | descriptive_measure)

    }

    return this.character_spacing_ as length_measure | ratio_measure | measure_with_unit | descriptive_measure
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === text_style_with_spacing.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for text_style_with_spacing" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.TEXT_STYLE_WITH_SPACING ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.TEXT_STYLE_WITH_SPACING
}
