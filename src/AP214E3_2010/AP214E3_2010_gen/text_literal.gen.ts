
import { geometric_representation_item } from "./index"
import { presentable_text } from "./index"
import { axis2_placement_2d } from "./index"
import { axis2_placement_3d } from "./index"
import { text_alignment } from "./index"
import { text_path, text_pathDeserializeStep } from "./index"
import { pre_defined_text_font } from "./index"
import { externally_defined_text_font } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class text_literal extends geometric_representation_item {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.TEXT_LITERAL
  }
  private literal_? : string
  private placement_? : axis2_placement_2d | axis2_placement_3d
  private alignment_? : string
  private path_? : text_path
  private font_? : pre_defined_text_font | externally_defined_text_font

  public get literal() : string {
    if ( this.literal_ === void 0 ) {
      this.literal_ = this.extractString( 1, 1, 2, false )
    }

    return this.literal_ as string
  }

  public get placement() : axis2_placement_2d | axis2_placement_3d {
    if ( this.placement_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 2, 1, 2, false )

      if ( !( value instanceof axis2_placement_2d ) && !( value instanceof axis2_placement_3d ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.placement_ = value as (axis2_placement_2d | axis2_placement_3d)

    }

    return this.placement_ as axis2_placement_2d | axis2_placement_3d
  }

  public get alignment() : string {
    if ( this.alignment_ === void 0 ) {
      this.alignment_ = this.extractString( 3, 1, 2, false )
    }

    return this.alignment_ as string
  }

  public get path() : text_path {
    if ( this.path_ === void 0 ) {
      this.path_ = this.extractLambda( 4, 1, 2, text_pathDeserializeStep, false )
    }

    return this.path_ as text_path
  }

  public get font() : pre_defined_text_font | externally_defined_text_font {
    if ( this.font_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 5, 1, 2, false )

      if ( !( value instanceof pre_defined_text_font ) && !( value instanceof externally_defined_text_font ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.font_ = value as (pre_defined_text_font | externally_defined_text_font)

    }

    return this.font_ as pre_defined_text_font | externally_defined_text_font
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === text_literal.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for text_literal" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.TEXT_LITERAL ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.TEXT_LITERAL
}
