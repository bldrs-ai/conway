
import { pre_defined_terminator_symbol } from "./index"
import { label } from "./index"
import { curve_style_font } from "./index"
import { pre_defined_curve_font } from "./index"
import { externally_defined_curve_font } from "./index"
import { positive_length_measure } from "./index"
import { measure_with_unit } from "./index"
import { descriptive_measure } from "./index"
import { colour } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class vector_style extends pre_defined_terminator_symbol {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.VECTOR_STYLE
  }
  private curve_font_? : curve_style_font | pre_defined_curve_font | externally_defined_curve_font
  private curve_width_? : positive_length_measure | measure_with_unit | descriptive_measure
  private curve_colour_? : colour

  public get curve_font() : curve_style_font | pre_defined_curve_font | externally_defined_curve_font {
    if ( this.curve_font_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 1, 1, 3, false )

      if ( !( value instanceof curve_style_font ) && !( value instanceof pre_defined_curve_font ) && !( value instanceof externally_defined_curve_font ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.curve_font_ = value as (curve_style_font | pre_defined_curve_font | externally_defined_curve_font)

    }

    return this.curve_font_ as curve_style_font | pre_defined_curve_font | externally_defined_curve_font
  }

  public get curve_width() : positive_length_measure | measure_with_unit | descriptive_measure {
    if ( this.curve_width_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 2, 1, 3, false )

      if ( !( value instanceof positive_length_measure ) && !( value instanceof measure_with_unit ) && !( value instanceof descriptive_measure ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.curve_width_ = value as (positive_length_measure | measure_with_unit | descriptive_measure)

    }

    return this.curve_width_ as positive_length_measure | measure_with_unit | descriptive_measure
  }

  public get curve_colour() : colour {
    if ( this.curve_colour_ === void 0 ) {
      this.curve_colour_ = this.extractElement( 3, 1, 3, false, colour )
    }

    return this.curve_colour_ as colour
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === vector_style.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for vector_style" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.VECTOR_STYLE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.VECTOR_STYLE
}
